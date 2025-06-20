# routers/scenario.py

from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
from io import BytesIO
import json

router = APIRouter(prefix="/scenarios", tags=["scenarios"])

@router.post("/upload-json")
async def upload_json(file: UploadFile = File(...)):
    if not file.filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="Only JSON files are accepted.")

    try:
        # Read and load the file content
        content_bytes = await file.read()
        data = json.loads(content_bytes.decode("utf-8"))

        # Locate schemas
        schemas = (
            data.get("components", {}).get("schemas")
            or data.get("definitions")
        )

        if not isinstance(schemas, dict):
            raise ValueError("No valid schemas found in Swagger JSON.")

        # Filter properties to keep only required ones
        for schema in schemas.values():
            if schema.get("type") != "object":
                continue
            required = schema.get("required", [])
            properties = schema.get("properties", {})
            schema["properties"] = {
                key: properties[key] for key in required if key in properties
            }

        # Save modified JSON to UI/dev-helpers/
        dest_folder = Path("../UI/dev-helpers/")
        dest_folder.mkdir(parents=True, exist_ok=True)
        dest_path = dest_folder / file.filename

        with dest_path.open("w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

        return {"message": f"Filtered Swagger saved to {dest_path}"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing Swagger: {str(e)}")
