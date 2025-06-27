import re
from fastapi import APIRouter, Depends, HTTPException, Query, Body
from pydantic import BaseModel
from typing import List, Dict
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from app.auth import get_current_user
from app.database import get_db
from app.models.models import User
from app.store.scenario_crud import create_scenario
from app.classes.scenario_schemas import ScenarioCreate
import uuid
import json
router = APIRouter(prefix="/mqtt", tags=["mqtt"])

@router.post("/extract")
async def extract_key_from_raw_text(
    key: str = Query(..., description="The key to extract from the text"),
    raw_text: str = Body(..., media_type="text/plain")
):
    # Regex to match both "key": "value" and 'key': 'value'
    pattern = rf'["\']{re.escape(key)}["\']\s*:\s*["\']([^"\']+)["\']'
    matches = re.findall(pattern, raw_text)

    if not matches:
        raise HTTPException(status_code=404, detail=f"No values found for key '{key}'.")

    return {
        "key": key,
        "key_values": matches
    }
class MQTTRequest(BaseModel):
    key: str
    key_values: List[str]
    parameters: List[Dict]  # typically just one

# -------------------------
# Route
# -------------------------

@router.post("/")
def generate_mqtt_test(
    request: MQTTRequest,
    db=Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Resolve Jinja2 template
        template_dir = Path(__file__).resolve().parent.parent / "templates"
        template_name = "mqtt_template.j2"
        env = Environment(loader=FileSystemLoader(template_dir), trim_blocks=True, lstrip_blocks=True)
        template = env.get_template(template_name)

        # Render with Jinja
        rendered = template.render(
            credentials_key=request.key,
            credentials_values=request.key_values,
            params=request.parameters[0]
        )

        # Save generated script
        generated_dir = Path(__file__).resolve().parent.parent / "generated"
        generated_dir.mkdir(parents=True, exist_ok=True)
        unique_id = uuid.uuid4().hex[:8]
        filename = f"mqtt_{unique_id}_test.js"
        output_path = generated_dir / filename

        with output_path.open("w", encoding="utf-8") as f:
            f.write(rendered)

        # Save to DB
        scenario = ScenarioCreate(name=filename, content=rendered)
        saved = create_scenario(db=db, user_id=current_user.id, scenario=scenario)

        return {
            "message": f"MQTT test saved to {output_path}",
            "scenario_id": saved.id,
            "filename": filename
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating MQTT test: {str(e)}")
    
    

@router.post("/inject-mqtt")
def inject_mqtt_to_specified_swagger(filename: str = Query(..., description="Name of the Swagger JSON file (e.g. 'swagger.json')")):
    try:
        # Path to Swagger files directory
        swagger_dir = Path(__file__).resolve().parents[3] / "UI" / "dev-helpers"
        swagger_file = swagger_dir / filename

        if not swagger_file.exists():
            raise HTTPException(status_code=404, detail=f"Swagger file '{filename}' not found at {swagger_file}")

        # Load the Swagger content
        with swagger_file.open("r", encoding="utf-8") as f:
            swagger_json = json.load(f)

        # MQTT endpoint definition
        mqtt_path = {
            "/run-mqtt-test/{VU_COUNT}/{duration}/{broker}/{port}/{topic}/{password}": {
                "mqtt": {
                    "tags": ["mqtt-controller"],
                    "summary": "Run MQTT Load Test via Path Params",
                    "description": "Runs MQTT load test using parameters passed directly in the URL path.",
                    "operationId": "runMqttTestWithParams",
                    "parameters": [
                        {"name": "VU_COUNT", "in": "path", "required": True, "schema": {"type": "integer"}, "description": "Number of Virtual Users for K6 test"},
                        {"name": "duration", "in": "path", "required": True, "schema": {"type": "string"}, "description": "Duration of the load test"},
                        {"name": "broker", "in": "path", "required": True, "schema": {"type": "string"}, "description": "MQTT broker address"},
                        {"name": "port", "in": "path", "required": True, "schema": {"type": "string"}, "description": "MQTT broker port"},
                        {"name": "topic", "in": "path", "required": True, "schema": {"type": "string"}, "description": "MQTT topic to publish to"},
                        {"name": "password", "in": "path", "required": True, "schema": {"type": "string"}, "description": "MQTT password (can be empty)"}
                    ],
                    "responses": {
                        "200": {"description": "Test started successfully"},
                        "400": {"description": "Invalid input"}
                    }
                }
            }
        }

        # Inject into Swagger JSON
        swagger_json.setdefault("paths", {}).update(mqtt_path)

        # Save back to the same file
        with swagger_file.open("w", encoding="utf-8") as f:
            json.dump(swagger_json, f, indent=2)

        return {"message": f" MQTT endpoint injected successfully into '{filename}'"}

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail=f"Invalid JSON format in '{filename}'")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

@router.get("/check-mqtt")
def check_mqtt_injection(filename: str = Query(..., description="Name of the Swagger JSON file to check")):
    try:
        # Path to Swagger files directory
        swagger_dir = Path(__file__).resolve().parents[3] / "UI" / "dev-helpers"
        swagger_file = swagger_dir / filename

        if not swagger_file.exists():
            raise HTTPException(status_code=404, detail=f"Swagger file '{filename}' not found.")

        # Load Swagger JSON
        with swagger_file.open("r", encoding="utf-8") as f:
            swagger_json = json.load(f)

        paths = swagger_json.get("paths", {})

        mqtt_path = "/run-mqtt-test/{VU_COUNT}/{duration}/{broker}/{port}/{topic}/{password}"

        if mqtt_path in paths:
            return {"injected": True, }
        else:
            return {"injected": False}

    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail=f"Invalid JSON format in '{filename}'")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

    

