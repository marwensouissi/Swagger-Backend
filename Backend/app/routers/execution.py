import os
import socket
import asyncio
import subprocess
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Define the directory where generated test scripts are stored
GENERATED_PATH = Path(__file__).resolve().parent.parent / "generated"

router = APIRouter(prefix="/execution", tags=["test-execution"])

# Request model for POST /run
class RunRequest(BaseModel):
    filename: str

# Utility to find a free port for K6 dashboard
def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

# Async generator for Server-Sent Events (SSE)
async def run_k6_with_dashboard(file_path: Path):
    if not file_path.exists():
        yield f"data: Error: File not found: {file_path.name}\n\n"
        return

    dashboard_port = find_free_port()
    yield f"data: DASHBOARD_PORT:{dashboard_port}\n\n"

    env = os.environ.copy()
    env["K6_WEB_DASHBOARD"] = "true"
    env["K6_WEB_DASHBOARD_PORT"] = str(dashboard_port)

    process = await asyncio.create_subprocess_exec(
        "k6", "run", str(file_path),
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.STDOUT,
        env=env
    )

    try:
        async for line in process.stdout:
            yield f"data: {line.decode().strip()}\n\n"
    except Exception as e:
        yield f"data: Error: {str(e)}\n\n"

    return_code = await process.wait()
    yield f"data: k6 test finished with exit code: {return_code}\n\n"

# SSE endpoint: live stream K6 output and dashboard port
@router.get("/run/stream/{filename}", response_class=StreamingResponse)
async def stream_k6_output(filename: str):
    file_path = GENERATED_PATH / filename
    return StreamingResponse(run_k6_with_dashboard(file_path), media_type="text/event-stream")

# POST endpoint: run test and return plain output (non-streaming)
@router.post("/run")
async def run_k6_test(request: RunRequest):
    file_path = GENERATED_PATH / request.filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    process = subprocess.run(
        ["k6", "run", str(file_path)],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )

    if process.returncode != 0:
        raise HTTPException(status_code=500, detail=f"k6 test failed: {process.stdout}")

    return {"output": process.stdout}
