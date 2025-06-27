# routers/scenario.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import json

from fastapi.responses import FileResponse

router = APIRouter(prefix="/swagger", tags=["swaggers"])

# Define a consistent base directory for saving swagger JSON files
BASE_DIR = Path(__file__).resolve().parents[3] / "UI" / "dev-helpers"
BASE_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/upload-json")
async def upload_json(file: UploadFile = File(...)):
    """Upload and sanitize a Swagger JSON file."""
    if not file.filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="Only JSON files are accepted.")

    try:
        content = await file.read()
        swagger_data = json.loads(content.decode("utf-8"))

        # Try to locate schemas from either OpenAPI 3 (components/schemas) or Swagger 2 (definitions)
        schemas = swagger_data.get("components", {}).get("schemas") or swagger_data.get("definitions")
        if not isinstance(schemas, dict):
            raise ValueError("No valid schemas found in Swagger JSON.")

        # Keep only required properties in each schema
        for schema in schemas.values():
            if schema.get("type") != "object":
                continue
            required = schema.get("required", [])
            props = schema.get("properties", {})
            schema["properties"] = {key: props[key] for key in required if key in props}

        # Save filtered Swagger JSON to disk
        file_path = BASE_DIR / file.filename
        with file_path.open("w", encoding="utf-8") as f:
            json.dump(swagger_data, f, indent=2, ensure_ascii=False)

        return {"message": f"Filtered Swagger saved to {file_path}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing Swagger: {str(e)}")

@router.get("/list-json")
def list_json_files():
    """List all Swagger JSON files in the target folder."""
    json_files = [f.name for f in BASE_DIR.glob("*.json")]
    return {"files": json_files}

@router.delete("/delete-json/{filename}")
def delete_json_file(filename: str):
    """Delete a specified Swagger JSON file."""
    file_path = BASE_DIR / filename

    if not file_path.exists() or not filename.endswith(".json"):
        raise HTTPException(status_code=404, detail="JSON file not found.")

    try:
        file_path.unlink()
        return {"message": f"{filename} deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")

@router.get("/get-base-url/{filename}")
def get_base_url(filename: str):
    file_path = BASE_DIR / filename

    if not file_path.exists() or not file_path.name.endswith(".json"):
        raise HTTPException(status_code=404, detail="JSON file not found.")

    try:
        with file_path.open("r", encoding="utf-8") as f:
            data = json.load(f)

        servers = data.get("servers")
        if not servers or not isinstance(servers, list):
            raise ValueError("No servers array found in Swagger JSON.")

        base_url = servers[0].get("url")
        if not base_url:
            raise ValueError("Base URL not found in servers[0].")

        return {"base_url": base_url}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading base URL: {str(e)}")

@router.get("/json/{filename}")
def get_swagger_json(filename: str):
    file_path = BASE_DIR / filename
    if not file_path.exists() or not file_path.name.endswith(".json"):
        raise HTTPException(status_code=404, detail="JSON file not found.")
    return FileResponse(str(file_path), media_type="application/json")