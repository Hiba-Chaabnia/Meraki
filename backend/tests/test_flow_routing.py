"""Tests for MerakiFlow routing logic."""
import pytest
from meraki_flow.main import MerakiFlow
from meraki_flow.state import MerakiState, UserAction, EmotionalState


class TestMerakiFlowRouting:
    """Test cases for MerakiFlow routing logic."""

    def test_flow_initialization(self):
        """Test that MerakiFlow can be initialized."""
        flow = MerakiFlow()
        assert flow is not None

    def test_state_initialization(self):
        """Test that state is properly initialized."""
        state = MerakiState()
        assert state.current_action == UserAction.NEW_USER
        assert state.available_time == 5
        assert state.budget == 50
        assert state.hobby_interests == []
        assert state.session_count == 0

    def test_route_new_user_to_discovery(self):
        """Test that NEW_USER routes to discovery."""
        flow = MerakiFlow()
        flow.state.current_action = UserAction.NEW_USER
        route = flow.route_to_crew()
        assert route == "discovery"

    def test_route_hobby_selected_to_sampling(self):
        """Test that HOBBY_SELECTED routes to sampling."""
        flow = MerakiFlow()
        flow.state.current_action = UserAction.HOBBY_SELECTED
        route = flow.route_to_crew()
        assert route == "sampling"

    def test_route_work_upload_to_practice(self):
        """Test that WORK_UPLOAD routes to practice."""
        flow = MerakiFlow()
        flow.state.current_action = UserAction.WORK_UPLOAD
        route = flow.route_to_crew()
        assert route == "practice"

    def test_route_returning_user_inactive_to_retention(self):
        """Test that inactive RETURNING_USER routes to retention."""
        flow = MerakiFlow()
        flow.state.current_action = UserAction.RETURNING_USER
        flow.state.days_inactive = 5
        route = flow.route_to_crew()
        assert route == "retention"

    def test_route_returning_user_active_to_practice(self):
        """Test that active RETURNING_USER routes to practice."""
        flow = MerakiFlow()
        flow.state.current_action = UserAction.RETURNING_USER
        flow.state.days_inactive = 1
        route = flow.route_to_crew()
        assert route == "practice"

    def test_route_emotional_checkin_negative_to_retention(self):
        """Test that negative emotional pattern routes to retention."""
        flow = MerakiFlow()
        flow.state.current_action = UserAction.EMOTIONAL_CHECKIN
        flow.state.emotional_history = [
            EmotionalState.FRUSTRATED,
            EmotionalState.DISCOURAGED,
            EmotionalState.FRUSTRATED,
        ]
        route = flow.route_to_crew()
        assert route == "retention"

    def test_route_emotional_checkin_positive_to_practice(self):
        """Test that positive emotional pattern routes to practice."""
        flow = MerakiFlow()
        flow.state.current_action = UserAction.EMOTIONAL_CHECKIN
        flow.state.emotional_history = [
            EmotionalState.LOVED_IT,
            EmotionalState.SATISFYING,
            EmotionalState.OKAY,
        ]
        route = flow.route_to_crew()
        assert route == "practice"


class TestMerakiStateEnums:
    """Test cases for state enums."""

    def test_user_action_values(self):
        """Test UserAction enum values."""
        assert UserAction.NEW_USER.value == "new_user"
        assert UserAction.HOBBY_SELECTED.value == "hobby_selected"
        assert UserAction.WORK_UPLOAD.value == "work_upload"
        assert UserAction.EMOTIONAL_CHECKIN.value == "emotional_checkin"
        assert UserAction.RETURNING_USER.value == "returning_user"

    def test_emotional_state_values(self):
        """Test EmotionalState enum values."""
        assert EmotionalState.LOVED_IT.value == "loved_it"
        assert EmotionalState.SATISFYING.value == "satisfying"
        assert EmotionalState.OKAY.value == "okay"
        assert EmotionalState.FRUSTRATED.value == "frustrated"
        assert EmotionalState.DISCOURAGED.value == "discouraged"

    def test_user_action_from_string(self):
        """Test creating UserAction from string."""
        action = UserAction("new_user")
        assert action == UserAction.NEW_USER

    def test_emotional_state_from_string(self):
        """Test creating EmotionalState from string."""
        state = EmotionalState("loved_it")
        assert state == EmotionalState.LOVED_IT
