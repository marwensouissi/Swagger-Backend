from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pathlib import Path
import subprocess
import json

router = APIRouter()

class K6Payload(BaseModel):
    token: str
    vus: int
    iterations: int
    url: str  # base API URL

@router.post("/generate-credentials")
def generate_credentials(payload: K6Payload):
    # 📌 Resolve JS path relative to this file
    script_path = Path(__file__).parent / "k6_generate_credentials.js"

    try:
        result = subprocess.run(
            [
                "k6", "run",
                "--env", f"TOKEN={payload.token}",
                "--env", f"VUS={payload.vus}",
                "--env", f"ITERATIONS={payload.iterations}",
                "--env", f"URL={payload.url}",
                str(script_path)
            ],
            capture_output=True,
            text=True
        )

        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"K6 failed: {result.stderr}")

        # ✅ Parse last valid JSON line
        lines = result.stdout.strip().splitlines()
        json_line = next((line for line in reversed(lines) if line.strip().startswith("{")), None)

        if not json_line:
            raise HTTPException(status_code=500, detail="No valid JSON output from K6")

        try:
            data = json.loads(json_line)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=500, detail=f"Invalid JSON output from K6: {str(e)}")

        return {"credentials": data.get("credentials", [])}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
