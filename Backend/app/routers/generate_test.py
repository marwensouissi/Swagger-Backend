from fastapi import APIRouter, HTTPException, Depends, Query
from pathlib import Path
from typing import Optional, List
from sqlalchemy.orm import Session
from jinja2 import Environment, FileSystemLoader
from app.auth import get_current_user
from app.database import get_db
from app.models.models import User
from app.store.scenario_crud import create_scenario
from app.classes.scenario_schemas import GenerateRequest, ScenarioCreate
import re
import json
import uuid
import logging
import json

 
router = APIRouter(prefix="/generate", tags=["generator"])
logger = logging.getLogger(__name__)
 
 
# Helper functions
 
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
 
 
# Main route
 
@router.post("/from-config")
def generate_test_file(
    request: GenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Locate Swagger JSON file
        swagger_dir = Path(__file__).resolve().parents[3] / "UI" / "dev-helpers"
        swagger_path = swagger_dir / request.swagger_filename
 
        if not swagger_path.exists():
            existing_files = [f.name for f in swagger_dir.glob("*.json")]
            logger.error(f"Swagger file '{request.swagger_filename}' not found. Available files: {existing_files}")
            raise HTTPException(
                status_code=404,
                detail=f"Swagger file '{request.swagger_filename}' not found. Available: {existing_files}"
            )
 
        # Load Swagger file content
        with swagger_path.open("r", encoding="utf-8") as f:
            swagger_data = json.load(f)
 
        base_url = extract_base_url(swagger_data)
 
        # Detect test execution mode: iterations+vus OR stages with duration+target
        use_iterations = False
        vus = None
        iterations = None
        stages = []
 
        if request.stages:
            first_stage = request.stages[0]
            if first_stage.iterations is not None and first_stage.vus is not None:
                # iterations mode
                use_iterations = True
                vus = first_stage.vus
                iterations = first_stage.iterations
            else:
                # stages mode
                stages = request.stages
 
        # Setup Jinja2 environment
        template_dir = Path(__file__).resolve().parent.parent / "templates"
        template_name = "template.j2"
        env = Environment(
            loader=FileSystemLoader(template_dir),
            trim_blocks=True,
            lstrip_blocks=True
        )
        env.filters["regex_replace"] = regex_replace
        template = env.get_template(template_name)
 
        # Render the test script from template
        rendered = template.render(
            tests=request.test_cases,
            stages=stages,
            vus=vus,
            iterations=iterations,
            base_url=base_url,
            use_iterations=use_iterations
        )
 
        # Save rendered test script
        generated_dir = Path(__file__).resolve().parent.parent / "generated"
        generated_dir.mkdir(parents=True, exist_ok=True)
        unique_id = uuid.uuid4().hex[:8]
        output_filename = f"{Path(request.swagger_filename).stem}_{unique_id}_test.js"
        output_path = generated_dir / output_filename
 
        with output_path.open("w", encoding="utf-8") as f:
            f.write(rendered)
 
        # Save scenario record in DB
        scenario = ScenarioCreate(name=output_filename, content=rendered)
        saved = create_scenario(db=db, user_id=current_user.id, scenario=scenario)
 
        return {
            "filename": output_filename,
            "scenario_id": saved.id,
        } 
    except Exception as e:
        logger.exception("Error during test generation")
        raise HTTPException(status_code=500, detail=f"Error generating test: {str(e)}")
    

