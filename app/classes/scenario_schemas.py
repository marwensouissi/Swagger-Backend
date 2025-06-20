from pydantic import BaseModel
from typing import List, Optional


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
    name: str
    endpoint: str
    method: str
    function: Optional[str] = None
    save_as: Optional[str] = None
    payload: Optional[dict] = None


class GenerateRequest(BaseModel):
    swagger_filename: str
    test_cases: List[TestCase]
    stages: Optional[List[dict]] = []