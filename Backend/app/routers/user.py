from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.classes.schemas import User, UserCreate, UserRead, LoginRequest, LoginResponse
from app.store.crud import get_users, create_user, authenticate_user
from app.auth import admin_only, create_access_token, get_current_user, logout_token
from app.database import get_db
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

router = APIRouter(prefix="/users", tags=["users"])
security = HTTPBearer()

@router.get("/", response_model=list[UserRead])
def list_users(db: Session = Depends(get_db), user=Depends(admin_only)):
    return get_users(db)

@router.post("/", response_model=UserRead)
def add_user(user_in: UserCreate, db: Session = Depends(get_db), user=Depends(admin_only)):
    """Admin-only endpoint to create users"""
    return create_user(db, user_in)

@router.post("/register", response_model=UserRead)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Public endpoint for user registration"""
    return create_user(db, user_in)

@router.post("/login", response_model=LoginResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login with JSON body"""
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(user.username)
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user_id=user.id,
        username=user.username,
        role=user.role
    )

@router.post("/logout")
def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout and invalidate token"""
    logout_token(credentials.credentials)
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=dict)
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role
}