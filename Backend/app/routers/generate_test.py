from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from pathlib import Path
import json
import re
from jinja2 import Environment, FileSystemLoader
import uuid
from app.auth import get_current_user
from app.database import get_db
from sqlalchemy.orm import Session
from app.store.scenario_crud import create_scenario
from app.models.models import User
from app.classes.scenario_schemas import TestCase, GenerateRequest, ScenarioCreate 




router = APIRouter(prefix="/generate", tags=["generator"])

# ------------------
# Helper functions
# ------------------

def regex_replace(s, pattern, replacement):
    return re.sub(pattern, replacement, s)

def extract_base_url(swagger_data):
    if "openapi" in swagger_data and "servers" in swagger_data:
        return swagger_data["servers"][0]["url"].rstrip("/")
    elif "swagger" in swagger_data:
        scheme = swagger_data.get("schemes", ["http"])[0]
        host = swagger_data.get("host", "")
        base_path = swagger_data.get("basePath", "")
        return f"{scheme}://{host}{base_path}".rstrip("/")
    return ""


# ------------------
# Route
# ------------------

@router.post("/from-config")
def generate_test_file(
    request: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Resolve Swagger file path
        swagger_path = Path(__file__).resolve().parent.parent.parent / "UI" / "dev-helpers" / request.swagger_filename
        if not swagger_path.exists():
            raise HTTPException(status_code=404, detail="Swagger file not found")

        # Load Swagger
        with swagger_path.open("r", encoding="utf-8") as f:
            swagger_data = json.load(f)
            base_url = extract_base_url(swagger_data)

        # Template configuration
        template_dir = Path(__file__).resolve().parent.parent / "templates"
        template_name = "template.j2"
        env = Environment(
            loader=FileSystemLoader(template_dir),
            trim_blocks=True,
            lstrip_blocks=True
        )
        env.filters["regex_replace"] = regex_replace
        template = env.get_template(template_name)

        # Render script
        rendered = template.render(
            tests=request.test_cases,
            stages=request.stages,
            base_url=base_url
        )

        # Save to /generated
        generated_dir = Path(__file__).resolve().parent.parent / "generated"
        generated_dir.mkdir(exist_ok=True)
        unique_id = uuid.uuid4().hex[:8]  # short, unique id
        output_filename = f"{Path(request.swagger_filename).stem}_{unique_id}_test.js"
        output_path = generated_dir / output_filename

        with output_path.open("w", encoding="utf-8") as f:
            f.write(rendered)

        # Save scenario to DB
        scenario = ScenarioCreate(
            name=output_filename,
            content=rendered
        )
        saved = create_scenario(db=db, user_id=current_user.id, scenario=scenario)

        return {
            "message": f"Test saved to {output_path}",
            "scenario_id": saved.id,
            "base_url": base_url
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating test: {str(e)}")
