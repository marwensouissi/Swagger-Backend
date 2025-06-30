import os
import re
import socket
import asyncio
import subprocess
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Define the directory where generated test scripts are stored
GENERATED_PATH = Path(__file__).resolve().parent.parent / "generated"
K6_CUSTOM_PATH = Path(__file__).resolve().parent.parent / "generated" / "k6.exe"

router = APIRouter(prefix="/execution", tags=["test-execution"])

# Request model for POST /run
class RunRequest(BaseModel):
    filename: str

# Utility to find a free port for K6 dashboard
def find_free_port():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(('', 0))
        return s.getsockname()[1]

# Function to clean ANSI escape codes and fix encoding issues
def clean_output_line(line: str) -> str:
    """
    Remove ANSI escape codes and fix UTF-8 encoding issues from K6 output
    """
    # First, try to fix common UTF-8 encoding issues
    encoding_fixes = {
        'â€¾': '‾',  # Fix corrupted tilde characters
        'â†"': '↓',  # Fix down arrow
        'âœ"': '✓',  # Fix checkmark
        'âœ—': '✗',  # Fix X mark
        'ðŸ§ª': '🧪', # Fix test tube emoji
        'âœ…': '✅', # Fix check mark button
        'Âµ': 'µ',   # Fix micro symbol
    }
    
    for corrupted, fixed in encoding_fixes.items():
        line = line.replace(corrupted, fixed)
    
    # Remove ANSI escape sequences (colors, cursor movements, etc.)
    ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
    line = ansi_escape.sub('', line)
    
    # Remove other control characters except newlines and tabs
    line = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]', '', line)
    
    # Keep the original Unicode characters (don't replace with ASCII)
    # This preserves the K6 formatting as shown in your console output
    
    # Remove excessive whitespace but preserve intentional spacing
    line = re.sub(r'\s+$', '', line)
    line = re.sub(r'^\s+', '', line) if line.strip() else line
    return line

# Async generator for Server-Sent Events (SSE) with cleaned output
async def run_k6_with_dashboard(file_path: Path):
    if not file_path.exists():
        yield f"data: Error: File not found: {file_path.name}\n\n"
        return

    dashboard_port = find_free_port()
    yield f"data: DASHBOARD_PORT:{dashboard_port}\n\n"

    is_mqtt_test = "mqtt" in file_path.name.lower()
    k6_binary = str(K6_CUSTOM_PATH) if is_mqtt_test else "k6"

    command = [k6_binary, "run", str(file_path)]
    env = os.environ.copy()
    env["K6_WEB_DASHBOARD"] = "true"
    env["K6_WEB_DASHBOARD_PORT"] = str(dashboard_port)
    
    # Don't disable colors completely - let K6 output naturally but clean encoding issues
    # env["NO_COLOR"] = "1"
    # env["K6_NO_COLOR"] = "1"
    # env["TERM"] = "dumb"

    try:
        process = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            env=env,
            text=True,
            bufsize=1,  # Line buffered
            universal_newlines=True,
            encoding='utf-8',  # Ensure proper UTF-8 encoding
            errors='replace'   # Replace invalid characters instead of crashing
        )
    except Exception as e:
        yield f"data: Error running k6: {str(e)}\n\n"
        return

    try:
        for line in process.stdout:
            try:
                # Clean encoding issues but preserve the original K6 formatting
                cleaned_line = clean_output_line(line)
                
                # Send all lines (including empty ones for proper formatting)
                yield f"data: {cleaned_line}\n\n"
                
            except (asyncio.CancelledError, ConnectionResetError, BrokenPipeError):
                # Client disconnected, stop sending data silently
                break
    except Exception as e:
        yield f"data: Error streaming output: {str(e)}\n\n"

    return_code = process.wait()
    try:
        yield f"data: k6 test finished with exit code: {return_code}\n\n"
    except (asyncio.CancelledError, ConnectionResetError, BrokenPipeError):
        pass  # Client disconnected during final message

# SSE endpoint: live stream K6 output with clean formatting
@router.get("/run/stream/{filename}", response_class=StreamingResponse)
async def stream_k6_output(filename: str):
    """
    Stream K6 output with cleaned UTF-8 encoding to match console output
    """
    file_path = GENERATED_PATH / filename
    return StreamingResponse(
        run_k6_with_dashboard(file_path), 
        media_type="text/event-stream"
    )

# Enhanced POST endpoint with clean output option
@router.post("/run")
async def run_k6_test(request: RunRequest):
    file_path = GENERATED_PATH / request.filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    process = subprocess.run(
        ["k6", "run", str(file_path)],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding='utf-8',
        errors='replace'
    )

    if process.returncode != 0:
        output = clean_output_line(process.stdout)
        raise HTTPException(status_code=500, detail=f"k6 test failed: {output}")

    output = clean_output_line(process.stdout)
    return {"output": output}