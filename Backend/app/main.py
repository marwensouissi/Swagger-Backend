from fastapi import FastAPI, Depends, HTTPException
from app.auth import create_access_token, get_current_user, admin_only
from app.config.config import ADMIN_USERNAME, ADMIN_PASSWORD
from fastapi.security import OAuth2PasswordRequestForm
from app.routers import user
import os
from app.database import get_db
from app.models.models import User
from app.security import get_password_hash
from fastapi.middleware.cors import CORSMiddleware
from app.routers import swagger
from app.routers import generate_test
from app.routers import execution
from app.routers import mqtt


app = FastAPI()  # ✅ Only define once
app.include_router(user.router)
app.include_router(swagger.router)
app.include_router(generate_test.router)
app.include_router(execution.router)
app.include_router(mqtt.router)



@app.on_event("startup")
def create_admin_user():
    db = next(get_db())
    admin_username = os.getenv("ADMIN_USERNAME", "admin")
    admin_password = os.getenv("ADMIN_PASSWORD", "admin123")
    

    user = db.query(User).filter(User.username == admin_username).first()
    if not user:
        hashed_pw = get_password_hash(admin_password)
        new_user = User(
            username=admin_username,
            password=hashed_pw,
            role="admin"  # ✅ Set role here
        )
        db.add(new_user)
        db.commit()
        print("✅ Admin user created with role=admin")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
