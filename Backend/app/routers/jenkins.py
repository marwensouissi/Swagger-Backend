from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
import requests
import asyncio
import logging
import json
import time

router = APIRouter(prefix="/jenkins", tags=["jenkins"])

TRIGGER_TOKEN = "cluster-builder"
TRIGGER_TOKEN_CHECK = "check"
TRIGGER_TOKEN_DESTROY = "cluster-destroyer"
JENKINS_JOB_PATH_CHECK = "/job/DevOps/job/K6/job/cluster-checker"
JENKINS_JOB_PATH_DESTROY = "/job/DevOps/job/K6/job/cluster-destroyer"

JENKINS_URL = "http://localhost:8090"
JENKINS_JOB_PATH = "/job/DevOps/job/K6/job/cluster-builder-k6"
USERNAME = "Marouan"
API_TOKEN = "11f95e13898dfdb25940bd7ca41eba689b"

logger = logging.getLogger("jenkins_ws")
logging.basicConfig(level=logging.INFO)

# Cache for cluster check result (shared across requests)
cluster_status_cache = {
    "cluster_exists": None,
    "job_number": None,
    "note": "Not checked yet"
}

async def fetch_build_status(session, auth, build_number):
    build_info_url = f"{JENKINS_URL}{JENKINS_JOB_PATH}/{build_number}/api/json"
    try:
        resp = session.get(build_info_url, auth=auth)
        if resp.status_code != 200:
            return None
        info = resp.json()
        if info.get("building", False):
            return "RUNNING"
        return info.get("result", "PENDING")
    except Exception as e:
        logger.error(f"Error fetching status: {e}")
        return None


@router.websocket("/ws-run-k6-test")
async def run_k6_test_websocket(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connection opened")

    try:
        message = await websocket.receive_text()
        data = json.loads(message)

        region = data.get("region", "nyc3")
        cluster_name = data.get("cluster_name", "my-k6-cluster")
        node_size = data.get("node_size", "s-2vcpu-4gb")

        logger.info(f"Received cluster params: {data}")

    except Exception as e:
        logger.error(f"Invalid payload or WebSocket message: {e}")
        await websocket.send_text("❌ Invalid cluster configuration payload.")
        await websocket.close()
        return

    session = requests.Session()
    auth = (USERNAME, API_TOKEN)

    build_url = f"{JENKINS_URL}{JENKINS_JOB_PATH}/buildWithParameters"
    params = {
        "token": TRIGGER_TOKEN,
        "REGION": region,
        "CLUSTER_NAME": cluster_name,
        "NODE_SIZE": node_size
    }

    try:
        resp = session.post(build_url, params=params, auth=auth, allow_redirects=False)
    except Exception as e:
        await websocket.send_text(f"❌ Failed to contact Jenkins: {e}")
        await websocket.close()
        return

    if resp.status_code != 201:
        await websocket.send_text(f"❌ Jenkins job trigger failed: {resp.status_code}")
        await websocket.close()
        return

    queue_url = resp.headers.get("Location")
    if not queue_url:
        await websocket.send_text("❌ Missing queue location in Jenkins response.")
        await websocket.close()
        return

    build_number = None
    for _ in range(15):
        try:
            q_resp = session.get(f"{queue_url}api/json", auth=auth)
            if q_resp.status_code == 200:
                q_data = q_resp.json()
                if q_data.get("executable"):
                    build_number = q_data["executable"]["number"]
                    break
        except Exception as e:
            logger.warning(f"Queue polling failed: {e}")
        await asyncio.sleep(1)

    if not build_number:
        await websocket.send_text("❌ Timeout while waiting for build number.")
        await websocket.close()
        return

    await websocket.send_text(f"🚀 Job triggered: build number {build_number}")

    try:
        while True:
            status = await fetch_build_status(session, auth, build_number)
            if status:
                await websocket.send_text(f"📦 Job Status: {status}")
            if status not in ("RUNNING", "PENDING"):
                await websocket.send_text(f"✅ Final Status: {status}")
                break
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected by client.")
    finally:
        await websocket.close()
        logger.info("WebSocket connection closed")
        await asyncio.get_event_loop().run_in_executor(None, perform_cluster_check_once)



def perform_cluster_check_once():
    """Runs once at startup and caches the cluster existence status."""
    auth = (USERNAME, API_TOKEN)
    trigger_url = f"{JENKINS_URL}{JENKINS_JOB_PATH_CHECK}/build?token={TRIGGER_TOKEN_CHECK}"

    try:
        resp = requests.post(trigger_url, auth=auth, allow_redirects=False)
        if resp.status_code != 201:
            cluster_status_cache.update({
                "cluster_exists": None,
                "job_number": None,
                "note": f"Failed to trigger job: {resp.status_code}"
            })
            return

        queue_url = resp.headers.get("Location")
        if not queue_url:
            cluster_status_cache.update({
                "cluster_exists": None,
                "job_number": None,
                "note": "No queue URL returned"
            })
            return

        build_number = None
        for _ in range(120):
            queue_data = requests.get(f"{queue_url}api/json", auth=auth).json()
            if "executable" in queue_data:
                build_number = queue_data["executable"]["number"]
                break
            time.sleep(1)

        if not build_number:
            cluster_status_cache.update({
                "cluster_exists": None,
                "job_number": None,
                "note": "Timed out waiting for build"
            })
            return

        build_status_url = f"{JENKINS_URL}{JENKINS_JOB_PATH_CHECK}/{build_number}/api/json"
        for _ in range(60):
            build_data = requests.get(build_status_url, auth=auth).json()
            if not build_data.get("building", True):
                break
            time.sleep(2)

        console_text_url = f"{JENKINS_URL}{JENKINS_JOB_PATH_CHECK}/{build_number}/consoleText"
        output = requests.get(console_text_url, auth=auth).text.lower()
        
        if "proceeding with terraform plan and apply" in output:
            cluster_status_cache.update({
                "cluster_exists": False,
                "job_number": build_number,
                "note": "No cluster found"
            })
        else:
            cluster_status_cache.update({
                "cluster_exists": None,
                "job_number": build_number,
                "note": "Cluster already exists"
            })

    except Exception as e:
        cluster_status_cache.update({
            "cluster_exists": None,
            "job_number": None,
            "note": f"Exception during cluster check: {str(e)}"
        })


@router.get("/check")
def get_cached_cluster_status():
    # Return the cached cluster existence status
    return JSONResponse(content=cluster_status_cache)


@router.get("/destroy")
def destroy_cluster():
    trigger_url = f"{JENKINS_URL}{JENKINS_JOB_PATH_DESTROY}/build?token={TRIGGER_TOKEN_DESTROY}"
    auth = (USERNAME, API_TOKEN)

    # Trigger the destroy job
    resp = requests.post(trigger_url, auth=auth, allow_redirects=False)
    if resp.status_code != 201:
        raise HTTPException(status_code=resp.status_code, detail="❌ Failed to trigger destroy job")

    queue_url = resp.headers.get("Location")
    if not queue_url:
        raise HTTPException(status_code=500, detail="❌ No queue URL returned")

    # Poll queue until build number is ready
    build_number = None
    for _ in range(120):
        queue_data = requests.get(f"{queue_url}api/json", auth=auth).json()
        if "executable" in queue_data:
            build_number = queue_data["executable"]["number"]
            break
        time.sleep(1)

    if not build_number:
        raise HTTPException(status_code=500, detail="⏱️ Timed out waiting for build to start")

    # Wait for build to finish
    build_status_url = f"{JENKINS_URL}{JENKINS_JOB_PATH_DESTROY}/{build_number}/api/json"
    for _ in range(60):
        build_data = requests.get(build_status_url, auth=auth).json()
        if not build_data.get("building", True):
            result = build_data.get("result")
            break
        time.sleep(2)
    else:
        raise HTTPException(status_code=500, detail="⏱️ Timed out waiting for build to finish")

    # Get and return result
    if result == "SUCCESS":
        return JSONResponse(content={"destroy_status": "success", "job_number": build_number})
    else:
        return JSONResponse(content={"destroy_status": "failed", "job_number": build_number})
