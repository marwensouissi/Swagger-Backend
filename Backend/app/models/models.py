from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)  # Ensure unique usernames
    password = Column(String)  # This should store the hashed password
    role = Column(String, default="user")

    # One-to-many relationship: One user can have many scenarios
    scenarios = relationship("Scenario", back_populates="user")


class Scenario(Base):
    __tablename__ = "scenarios"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(Text)  # This holds the rendered/generated test script
    name = Column(String, index=True)  # Ensure unique usernames



    # Many-to-one relationship: Each scenario belongs to one user
    user = relationship("User", back_populates="scenarios")

