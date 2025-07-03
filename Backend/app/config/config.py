import os
from dotenv import load_dotenv

load_dotenv()

ADMIN_USERNAME = os.getenv("ADMIN_USERNAME")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


# Jenkins config
JENKINS_URL = os.getenv("JENKINS_URL", "http://83.147.37.78:8090/bit-webhook-pullrequest/")
JENKINS_USER = os.getenv("Marouan")
JENKINS_TOKEN = os.getenv("11f95e13898dfdb25940bd7ca41eba689b")
JENKINS_JOB_PATH = os.getenv("JENKINS_JOB_PATH", "/job/DevOps/job/K6/job/cluster-builder-k6/")