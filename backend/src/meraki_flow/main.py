#!/usr/bin/env python
import random
from crewai.flow import Flow, listen, router, start, or_
from opik import opik_context

from meraki_flow.tools.opik_tracking import initialize_opik
from meraki_flow.state import MerakiState, UserAction, EmotionalState

# Initialize Opik tracking before crew imports
initialize_opik()
from meraki_flow.crews.discovery_crew.discovery_crew import DiscoveryCrew
from meraki_flow.crews.sampling_crew.sampling_crew import SamplingCrew
from meraki_flow.crews.practice_crew.practice_crew import PracticeCrew
from meraki_flow.crews.retention_crew.retention_crew import RetentionCrew


class MerakiFlow(Flow[MerakiState]):
    """
    MerakiFlow orchestrates the user journey through hobby discovery, sampling,
    practice, and retention using specialized crews.
    """

    def assign_experiment(self) -> str:
        """Assign user to an experiment variant for A/B testing."""
        variant = random.choice(["control", "optimized_prompts"])
        opik_context.update_current_trace(
            tags=[f"experiment:prompt-optimization", f"variant:{variant}"],
            metadata={"experiment_name": "prompt_ab_test", "variant": variant}
        )
        return variant

    @start()
    def initialize_flow(self, crewai_trigger_payload: dict = None):
        """Parse trigger payload and initialize state."""
        print("Initializing Meraki Flow")

        # Assign experiment variant for A/B testing
        experiment_variant = self.assign_experiment()
        print(f"Assigned to experiment variant: {experiment_variant}")

        if crewai_trigger_payload:
            trigger = crewai_trigger_payload.get("trigger_payload", crewai_trigger_payload)

            # Parse action
            action_str = trigger.get("action", "new_user")
            try:
                self.state.current_action = UserAction(action_str)
            except ValueError:
                self.state.current_action = UserAction.NEW_USER

            # Parse user_id
            self.state.user_id = trigger.get("user_id", "")

            # Parse data payload
            data = trigger.get("data", {})
            self.state.raw_input = data

            # Populate state from data
            if "hobby_interests" in data:
                self.state.hobby_interests = data["hobby_interests"]
            if "available_time" in data:
                self.state.available_time = data["available_time"]
            if "budget" in data:
                self.state.budget = data["budget"]
            if "location" in data:
                self.state.location = data["location"]
            if "hobby_name" in data:
                self.state.selected_hobby = data["hobby_name"]
            if "days_inactive" in data:
                self.state.days_inactive = data["days_inactive"]
            if "session_count" in data:
                self.state.session_count = data["session_count"]
            if "current_streak" in data:
                self.state.current_streak = data["current_streak"]
            if "emotional_state" in data:
                try:
                    emotional = EmotionalState(data["emotional_state"])
                    self.state.emotional_history.append(emotional)
                except ValueError:
                    pass

            print(f"Trigger payload parsed: action={self.state.current_action}, user_id={self.state.user_id}")
        else:
            print("No trigger payload provided, using default state")

    @router(initialize_flow)
    def route_to_crew(self):
        """Route to appropriate crew based on user action."""
        action = self.state.current_action
        print(f"Routing based on action: {action}")

        if action == UserAction.NEW_USER:
            return "discovery"
        elif action == UserAction.HOBBY_SELECTED:
            return "sampling"
        elif action == UserAction.WORK_UPLOAD:
            return "practice"
        elif action == UserAction.EMOTIONAL_CHECKIN:
            # Check emotional history for patterns of distress
            if self._has_negative_pattern():
                return "retention"
            return "practice"
        elif action == UserAction.RETURNING_USER:
            # Check inactivity level
            if self.state.days_inactive >= 3:
                return "retention"
            return "practice"
        else:
            return "discovery"

    def _has_negative_pattern(self) -> bool:
        """Check if recent emotional history shows concerning patterns."""
        recent = self.state.emotional_history[-3:] if len(self.state.emotional_history) >= 3 else self.state.emotional_history
        negative_states = {EmotionalState.FRUSTRATED, EmotionalState.DISCOURAGED}
        negative_count = sum(1 for e in recent if e in negative_states)
        return negative_count >= 2

    @listen("discovery")
    def run_discovery_crew(self):
        """Run the Discovery Crew to recommend hobbies."""
        print("Running Discovery Crew")

        inputs = {
            "hobby_interests": ", ".join(self.state.hobby_interests) if self.state.hobby_interests else "general creative activities",
            "available_time": self.state.available_time,
            "budget": self.state.budget,
            "location": self.state.location or "any location",
        }

        result = DiscoveryCrew().crew().kickoff(inputs=inputs)

        # Store recommendations in state
        self.state.hobby_recommendations = [{"raw_output": result.raw}]
        print("Discovery Crew completed")
        return result.raw

    @listen("sampling")
    def run_sampling_crew(self):
        """Run the Sampling Crew to create entry points for a hobby."""
        print("Running Sampling Crew")

        inputs = {
            "hobby_name": self.state.selected_hobby or "the selected hobby",
            "location": self.state.location or "any location",
        }

        result = SamplingCrew().crew().kickoff(inputs=inputs)
        print("Sampling Crew completed")
        return result.raw

    @listen("practice")
    def run_practice_crew(self):
        """Run the Practice Crew for feedback and challenges."""
        print("Running Practice Crew")

        # Get work description from raw input
        work_description = ""
        if self.state.raw_input:
            work_description = self.state.raw_input.get("work_description", "")

        # Get current emotional state
        current_emotional = self.state.emotional_history[-1].value if self.state.emotional_history else "okay"
        emotional_history_str = ", ".join([e.value for e in self.state.emotional_history[-5:]]) if self.state.emotional_history else "no history"

        inputs = {
            "hobby_name": self.state.selected_hobby or "the hobby",
            "work_description": work_description or "practice session",
            "session_count": self.state.session_count,
            "emotional_state": current_emotional,
            "emotional_history": emotional_history_str,
        }

        result = PracticeCrew().crew().kickoff(inputs=inputs)

        # Increment session count
        self.state.session_count += 1
        print("Practice Crew completed")
        return result.raw

    @listen("retention")
    def run_retention_crew(self):
        """Run the Retention Crew for re-engagement."""
        print("Running Retention Crew")

        emotional_history_str = ", ".join([e.value for e in self.state.emotional_history[-5:]]) if self.state.emotional_history else "no history"
        current_challenge_str = str(self.state.current_challenge) if self.state.current_challenge else "none"

        inputs = {
            "hobby_name": self.state.selected_hobby or "the hobby",
            "days_inactive": self.state.days_inactive,
            "current_streak": self.state.current_streak,
            "session_count": self.state.session_count,
            "emotional_history": emotional_history_str,
            "current_challenge": current_challenge_str,
        }

        result = RetentionCrew().crew().kickoff(inputs=inputs)
        print("Retention Crew completed")
        return result.raw

    @listen(or_("discovery", "sampling", "practice", "retention"))
    def finalize_flow(self, crew_result):
        """Finalize the flow and return results."""
        print("Finalizing Meraki Flow")
        print(f"Final state: user_id={self.state.user_id}, action={self.state.current_action}")
        return {
            "user_id": self.state.user_id,
            "action": self.state.current_action.value,
            "result": crew_result,
            "session_count": self.state.session_count,
        }


def kickoff():
    """Run the flow without a trigger payload."""
    meraki_flow = MerakiFlow()
    meraki_flow.kickoff()


def plot():
    """Generate a visual plot of the flow."""
    meraki_flow = MerakiFlow()
    meraki_flow.plot()


def run_with_trigger():
    """Run the flow with a trigger payload from command line."""
    import json
    import sys

    if len(sys.argv) < 2:
        raise Exception("No trigger payload provided. Please provide JSON payload as argument.")

    try:
        trigger_payload = json.loads(sys.argv[1])
    except json.JSONDecodeError:
        raise Exception("Invalid JSON payload provided as argument")

    meraki_flow = MerakiFlow()

    try:
        result = meraki_flow.kickoff({"crewai_trigger_payload": trigger_payload})
        return result
    except Exception as e:
        raise Exception(f"An error occurred while running the flow with trigger: {e}")


if __name__ == "__main__":
    kickoff()
