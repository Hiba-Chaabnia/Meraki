"""
Opik trace hooks, declared once instead of pasted into every crew.

Each crew carried ~35 lines of identical `@before_kickoff` / `@after_kickoff`
boilerplate that differed only in the crew name, which fields it pulled out of
`inputs`, and which metric it scored the output with. `@opik_traced(...)` takes
those three things as arguments and installs the hooks.

WHY A CLASS DECORATOR AND NOT A BASE CLASS
------------------------------------------
`@CrewBase` collects hooks with `cls.__dict__.items()` — not the MRO (see
crewai/project/crew_base.py). A method inherited from a shared base is invisible
to it, so a mixin would silently stop all tracing with no error anywhere. This
decorator writes the hooks into the concrete class's own `__dict__`, and because
decorators apply bottom-up it must sit *below* `@CrewBase`:

    @CrewBase
    @opik_traced(name="discovery", metric=HobbyMatchDiversityMetric)
    class DiscoveryCrew:
        ...

Every hook stays best-effort: a tracing or scoring failure must never take down
a crew run, which is why both halves swallow their exceptions.
"""

from __future__ import annotations

from typing import Any, Callable

from crewai.project import after_kickoff, before_kickoff

try:
    from opik import opik_context
    OPIK_AVAILABLE = True
except ImportError:
    OPIK_AVAILABLE = False


#: Extra trace metadata for a crew, derived from its kickoff inputs.
MetadataFn = Callable[[dict], dict[str, Any]]

#: Custom scoring for crews whose metric does not take the raw output alone.
#: Receives the raw output string and the inputs stashed at kickoff.
ScoreFn = Callable[[str, dict], Any]


def opik_traced(
    *,
    name: str,
    metric: type | None = None,
    metadata: MetadataFn | None = None,
    score: ScoreFn | None = None,
):
    """
    Install Opik kickoff hooks on a crew class.

    :param name: snake_case crew name. Supplies the `crew` metadata field, the
        `crew_completed` field, and the tag (`local_experiences` →
        `local-experiences-crew`).
    :param metric: metric class scored against the crew's raw output. Omit to
        trace without scoring.
    :param metadata: extra trace metadata built from the kickoff inputs. The
        default reports the input keys, which is what a crew with nothing more
        specific to say was already doing.
    :param score: overrides how `metric` is called. Only needed when the metric
        does not take the raw output — `ChallengeCalibrationMetric` wants a
        difficulty parsed out of the output plus a count from the inputs.
    """
    tag = f"{name.replace('_', '-')}-crew"

    def default_metadata(inputs: dict) -> dict[str, Any]:
        return {"input_keys": list(inputs.keys()) if inputs else []}

    build_metadata = metadata or default_metadata

    def log_inputs(self, inputs: dict):
        """Log input metadata to Opik and stash inputs for scoring."""
        # Stashed unconditionally: `score` callbacks need them, and doing it
        # only when Opik is importable would make the two paths diverge.
        self._opik_inputs = inputs or {}
        if OPIK_AVAILABLE:
            try:
                opik_context.update_current_trace(
                    metadata={"crew": name, **build_metadata(inputs or {})},
                    tags=[tag],
                )
            except Exception:
                pass  # Opik tracing not active, skip
        return inputs

    def log_outputs(self, output):
        """Log output metadata and scoring to Opik after crew execution."""
        if OPIK_AVAILABLE:
            try:
                raw = output.raw if hasattr(output, "raw") else str(output)
                trace: dict[str, Any] = {
                    "metadata": {"crew_completed": name, "result_type": type(output).__name__},
                }
                if metric is not None or score is not None:
                    result = score(raw, getattr(self, "_opik_inputs", {})) if score else metric().score(output=raw)
                    trace["feedback_scores"] = [
                        {"name": result.name, "value": result.value, "reason": result.reason}
                    ]
                opik_context.update_current_trace(**trace)
            except Exception as e:
                print(f"[Opik] {name} scoring failed (non-fatal): {e}")
        return output

    def decorate(cls):
        # Written into the concrete class's own __dict__ — see the module
        # docstring for why inheritance would not work here.
        cls.log_inputs = before_kickoff(log_inputs)
        cls.log_outputs = after_kickoff(log_outputs)
        return cls

    return decorate
