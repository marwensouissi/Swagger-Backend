from pydantic import BaseModel, Field
from typing import List, Optional, Dict
 
 
class ScenarioCreate(BaseModel):
    name: str
    content: str
 
class ScenarioOut(BaseModel):
    id: int
    user_id: int
    name: str
    content: str
 
    class Config:
        orm_mode = True
 
class TestCase(BaseModel):
    function: str
    method: str
    url: str 
    save_as: Optional[str] = None
    payload: Optional[Dict] = None
 
    class Config:
        allow_population_by_alias = True
        allow_population_by_field_name = True
class Stage(BaseModel):
    duration: Optional[str] = None
    target: Optional[int] = None
    iterations: Optional[int] = None
    vus: Optional[int] = None
 
class GenerateRequest(BaseModel):
    swagger_filename: str
    test_cases: List[TestCase]
    stages: Optional[List[Stage]] = None
    vus: Optional[int] = None
    iterations: Optional[int] = None

class ClusterRequest(BaseModel):
    token: str
    name: str
    region: str
    size: str
    count: int = 1