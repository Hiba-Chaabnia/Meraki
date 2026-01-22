from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum


class EmotionalState(str, Enum):
    LOVED_IT = "loved_it"
    SATISFYING = "satisfying"
    OKAY = "okay"
    FRUSTRATED = "frustrated"
    DISCOURAGED = "discouraged"


class UserAction(str, Enum):
    NEW_USER = "new_user"
    HOBBY_SELECTED = "hobby_selected"
    WORK_UPLOAD = "work_upload"
    EMOTIONAL_CHECKIN = "emotional_checkin"
    RETURNING_USER = "returning_user"


class MerakiState(BaseModel):
    user_id: str = ""
    current_action: UserAction = UserAction.NEW_USER
    # User profile
    available_time: int = 5
    budget: float = 50
    location: str = ""
    hobby_interests: List[str] = Field(default_factory=list)
    # Discovery outputs
    hobby_recommendations: List[dict] = Field(default_factory=list)
    selected_hobby: Optional[str] = None
    # Practice tracking
    session_count: int = 0
    current_challenge: Optional[dict] = None
    emotional_history: List[EmotionalState] = Field(default_factory=list)
    # Retention tracking
    days_inactive: int = 0
    current_streak: int = 0
    # Raw input for current action
    raw_input: Optional[dict] = None
