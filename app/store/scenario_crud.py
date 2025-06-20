from sqlalchemy.orm import Session
from app.models.models import Scenario ,User
from app.classes.scenario_schemas import ScenarioCreate

def create_scenario(db: Session, user_id: int, scenario: ScenarioCreate):
    db_scenario = Scenario(**scenario.dict(), user_id=user_id)
    db.add(db_scenario)
    db.commit()
    db.refresh(db_scenario)
    return db_scenario