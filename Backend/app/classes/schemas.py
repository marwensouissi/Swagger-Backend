# schemas.py
from pydantic import BaseModel

class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    role: str
    
    class Config:
        from_attributes = True  # Updated for Pydantic v2

class User(UserBase):
    id: int
    role: str
    
    class Config:
        from_attributes = True  # Updated for Pydantic v2

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    username: str
    role: str