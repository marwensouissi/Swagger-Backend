from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User
import secrets
import hashlib
from datetime import datetime, timedelta

# Simple bearer token storage (in production, use Redis or database)
active_tokens = {}

security = HTTPBearer()

def create_access_token(username: str) -> str:
    """Create a simple bearer token"""
    # Generate a random token
    token = secrets.token_urlsafe(32)
    
    # Store token with expiration (24 hours)
    expiration = datetime.utcnow() + timedelta(hours=24)
    active_tokens[token] = {
        "username": username,
        "expires_at": expiration
    }
    
    return token

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """Get current user from bearer token"""
    token = credentials.credentials
    
    # Check if token exists and is not expired
    if token not in active_tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token_data = active_tokens[token]
    
    # Check if token is expired
    if datetime.utcnow() > token_data["expires_at"]:
        # Remove expired token
        del active_tokens[token]
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Get user from database
    user = db.query(User).filter(User.username == token_data["username"]).first()
    if not user:
        # Remove invalid token
        del active_tokens[token]
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

def admin_only(current_user: User = Depends(get_current_user)):
    """Require admin role"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def logout_token(token: str):
    """Remove token from active tokens"""
    if token in active_tokens:
        del active_tokens[token]