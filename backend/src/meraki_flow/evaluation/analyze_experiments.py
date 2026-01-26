"""
Experiment Analysis Script for Meraki Flow.

This module provides tools for analyzing A/B test results and experiment data
collected through Opik traces.
"""

from typing import Dict, List, Any, Optional
from collections import defaultdict
from datetime import datetime, timedelta

from opik import Opik

from meraki_flow.tools.opik_tracking import PROJECT_NAME


def get_experiment_traces(
    experiment_name: str = "prompt_ab_test",
    days_back: int = 7,
    project_name: str = PROJECT_NAME
) -> List[Dict[str, Any]]:
    """
    Retrieve traces from an experiment.

    Args:
        experiment_name: Name of the experiment to filter by.
        days_back: Number of days to look back for traces.
        project_name: Opik project name.

    Returns:
        List of trace dictionaries.
    """
    client = Opik()

    # Search for traces with experiment tag
    traces = client.search_traces(
        project_name=project_name,
        filter=f'tags contains "experiment:{experiment_name}"'
    )

    return list(traces)


def analyze_by_variant(traces: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    """
    Analyze traces grouped by experiment variant.

    Args:
        traces: List of trace dictionaries.

    Returns:
        Dictionary with variant-level statistics.
    """
    variants = defaultdict(lambda: {
        "count": 0,
        "latencies": [],
        "token_counts": [],
        "errors": 0,
        "crews": defaultdict(int),
    })

    for trace in traces:
        metadata = trace.get("metadata", {})
        variant = metadata.get("variant", "unknown")

        variants[variant]["count"] += 1

        # Track latency if available
        if "duration_ms" in trace:
            variants[variant]["latencies"].append(trace["duration_ms"])

        # Track token usage if available
        if "total_tokens" in metadata:
            variants[variant]["token_counts"].append(metadata["total_tokens"])

        # Track errors
        if trace.get("status") == "error":
            variants[variant]["errors"] += 1

        # Track which crews were used
        if "crew_completed" in metadata:
            variants[variant]["crews"][metadata["crew_completed"]] += 1

    # Compute aggregate statistics
    results = {}
    for variant, data in variants.items():
        latencies = data["latencies"]
        tokens = data["token_counts"]

        results[variant] = {
            "total_traces": data["count"],
            "error_count": data["errors"],
            "error_rate": data["errors"] / data["count"] if data["count"] > 0 else 0,
            "avg_latency_ms": sum(latencies) / len(latencies) if latencies else None,
            "min_latency_ms": min(latencies) if latencies else None,
            "max_latency_ms": max(latencies) if latencies else None,
            "avg_tokens": sum(tokens) / len(tokens) if tokens else None,
            "crew_distribution": dict(data["crews"]),
        }

    return results


def compare_variants(analysis: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compare performance between control and treatment variants.

    Args:
        analysis: Dictionary from analyze_by_variant.

    Returns:
        Comparison metrics between variants.
    """
    control = analysis.get("control", {})
    treatment = analysis.get("optimized_prompts", {})

    comparison = {
        "control_count": control.get("total_traces", 0),
        "treatment_count": treatment.get("total_traces", 0),
    }

    # Compare error rates
    if control.get("error_rate") is not None and treatment.get("error_rate") is not None:
        comparison["error_rate_diff"] = treatment["error_rate"] - control["error_rate"]
        comparison["error_rate_control"] = control["error_rate"]
        comparison["error_rate_treatment"] = treatment["error_rate"]

    # Compare latencies
    if control.get("avg_latency_ms") is not None and treatment.get("avg_latency_ms") is not None:
        comparison["latency_diff_ms"] = treatment["avg_latency_ms"] - control["avg_latency_ms"]
        comparison["latency_improvement_pct"] = (
            (control["avg_latency_ms"] - treatment["avg_latency_ms"]) /
            control["avg_latency_ms"] * 100
            if control["avg_latency_ms"] > 0 else 0
        )

    # Compare token usage
    if control.get("avg_tokens") is not None and treatment.get("avg_tokens") is not None:
        comparison["token_diff"] = treatment["avg_tokens"] - control["avg_tokens"]

    return comparison


def generate_experiment_report(
    experiment_name: str = "prompt_ab_test",
    days_back: int = 7
) -> str:
    """
    Generate a human-readable experiment report.

    Args:
        experiment_name: Name of the experiment.
        days_back: Number of days to analyze.

    Returns:
        Formatted report string.
    """
    print(f"Fetching traces for experiment: {experiment_name}")
    traces = get_experiment_traces(experiment_name, days_back)

    if not traces:
        return f"No traces found for experiment '{experiment_name}' in the last {days_back} days."

    analysis = analyze_by_variant(traces)
    comparison = compare_variants(analysis)

    # Build report
    lines = [
        "=" * 60,
        f"EXPERIMENT REPORT: {experiment_name}",
        f"Analysis Period: Last {days_back} days",
        f"Total Traces: {len(traces)}",
        "=" * 60,
        "",
        "VARIANT BREAKDOWN:",
        "-" * 40,
    ]

    for variant, stats in analysis.items():
        lines.extend([
            f"\n{variant.upper()}:",
            f"  Traces: {stats['total_traces']}",
            f"  Error Rate: {stats['error_rate']:.2%}",
            f"  Avg Latency: {stats['avg_latency_ms']:.0f}ms" if stats['avg_latency_ms'] else "  Avg Latency: N/A",
            f"  Avg Tokens: {stats['avg_tokens']:.0f}" if stats['avg_tokens'] else "  Avg Tokens: N/A",
            f"  Crews Used: {stats['crew_distribution']}",
        ])

    lines.extend([
        "",
        "COMPARISON (Treatment vs Control):",
        "-" * 40,
    ])

    if "error_rate_diff" in comparison:
        direction = "better" if comparison["error_rate_diff"] < 0 else "worse"
        lines.append(f"  Error Rate: {abs(comparison['error_rate_diff']):.2%} {direction}")

    if "latency_improvement_pct" in comparison:
        direction = "faster" if comparison["latency_improvement_pct"] > 0 else "slower"
        lines.append(f"  Latency: {abs(comparison['latency_improvement_pct']):.1f}% {direction}")

    if "token_diff" in comparison:
        direction = "more" if comparison["token_diff"] > 0 else "fewer"
        lines.append(f"  Tokens: {abs(comparison['token_diff']):.0f} {direction} per request")

    lines.extend([
        "",
        "=" * 60,
        "RECOMMENDATION:",
        "-" * 40,
    ])

    # Generate recommendation based on data
    if len(traces) < 100:
        lines.append("  Insufficient data for confident recommendation.")
        lines.append("  Continue running experiment to gather more traces.")
    elif comparison.get("error_rate_diff", 0) > 0.05:
        lines.append("  Treatment shows higher error rate.")
        lines.append("  Consider reviewing optimized prompts for issues.")
    elif comparison.get("latency_improvement_pct", 0) > 10:
        lines.append("  Treatment shows significant latency improvement.")
        lines.append("  Consider rolling out optimized prompts to production.")
    else:
        lines.append("  Results are within normal variance.")
        lines.append("  Consider extending experiment duration or sample size.")

    lines.append("=" * 60)

    return "\n".join(lines)


def get_crew_performance_metrics(
    crew_name: str,
    days_back: int = 7,
    project_name: str = PROJECT_NAME
) -> Dict[str, Any]:
    """
    Get performance metrics for a specific crew.

    Args:
        crew_name: Name of the crew (discovery, sampling, practice, retention).
        days_back: Number of days to look back.
        project_name: Opik project name.

    Returns:
        Performance metrics dictionary.
    """
    client = Opik()

    traces = client.search_traces(
        project_name=project_name,
        filter=f'tags contains "{crew_name}-crew"'
    )

    traces_list = list(traces)

    if not traces_list:
        return {"crew": crew_name, "traces": 0, "message": "No traces found"}

    latencies = []
    token_counts = []
    errors = 0

    for trace in traces_list:
        if "duration_ms" in trace:
            latencies.append(trace["duration_ms"])
        metadata = trace.get("metadata", {})
        if "total_tokens" in metadata:
            token_counts.append(metadata["total_tokens"])
        if trace.get("status") == "error":
            errors += 1

    return {
        "crew": crew_name,
        "total_traces": len(traces_list),
        "error_count": errors,
        "error_rate": errors / len(traces_list) if traces_list else 0,
        "avg_latency_ms": sum(latencies) / len(latencies) if latencies else None,
        "p95_latency_ms": sorted(latencies)[int(len(latencies) * 0.95)] if len(latencies) > 20 else None,
        "avg_tokens": sum(token_counts) / len(token_counts) if token_counts else None,
    }


if __name__ == "__main__":
    # Generate experiment report
    report = generate_experiment_report()
    print(report)

    # Also show crew-level metrics
    print("\n\nCREW PERFORMANCE METRICS:")
    print("-" * 40)
    for crew in ["discovery", "sampling", "practice", "retention"]:
        metrics = get_crew_performance_metrics(crew)
        print(f"\n{crew.upper()} CREW:")
        for key, value in metrics.items():
            if key != "crew":
                print(f"  {key}: {value}")
