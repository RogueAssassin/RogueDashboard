#!/usr/bin/env python3
from __future__ import annotations

import os
import sys

from container_engine import detect_engine


def translate_agent_environment() -> None:
    if os.environ.get("CONTAINER_AGENT_URL") and not os.environ.get("DOCKER_AGENT_URL"):
        os.environ["DOCKER_AGENT_URL"] = os.environ["CONTAINER_AGENT_URL"]
    if os.environ.get("CONTAINER_AGENT_TOKEN") and not os.environ.get("DOCKER_AGENT_TOKEN"):
        os.environ["DOCKER_AGENT_TOKEN"] = os.environ["CONTAINER_AGENT_TOKEN"]


def run_dashboard_via_agent() -> int:
    """Start the web dashboard without direct container-engine socket access."""
    translate_agent_environment()

    import dashboard

    dashboard.DOCKER_AGENT_URL = os.environ.get("DOCKER_AGENT_URL", "")
    dashboard.DOCKER_AGENT_TOKEN = os.environ.get("DOCKER_AGENT_TOKEN", "")
    return int(dashboard.main())


def run_with_engine() -> int:
    """Start the restricted engine agent or an explicit direct-engine deployment."""
    engine = detect_engine()

    os.environ.setdefault("CONTAINER_ENGINE", engine.name)
    os.environ.setdefault("CONTAINER_SOCKET", engine.socket_path)
    os.environ["DOCKER_SOCKET"] = engine.socket_path
    translate_agent_environment()

    os.environ.setdefault("RGDASH_ENGINE_NAME", engine.name)
    os.environ.setdefault("RGDASH_ENGINE_VERSION", engine.version)
    os.environ.setdefault("RGDASH_ENGINE_API_VERSION", engine.api_version)

    import dashboard

    dashboard.DOCKER_SOCKET = engine.socket_path
    dashboard.DOCKER_AGENT_URL = os.environ.get("DOCKER_AGENT_URL", "")
    dashboard.DOCKER_AGENT_TOKEN = os.environ.get("DOCKER_AGENT_TOKEN", "")

    original_request = dashboard.docker_request

    def engine_request(path: str, maximum: int = 5_000_000):
        try:
            return engine.request_json(path, maximum)
        except Exception as exc:
            raise RuntimeError(f"{engine.name.title()} engine request failed: {exc}") from exc

    dashboard.docker_request = engine_request
    try:
        return int(dashboard.main())
    finally:
        dashboard.docker_request = original_request


def main() -> int:
    command = sys.argv[1] if len(sys.argv) > 1 else "serve"

    # Health checks probe the local HTTP service and do not need an engine socket.
    if command == "healthcheck":
        return run_dashboard_via_agent()

    # Normal web deployments use the restricted private agent over HTTP.
    if command != "agent" and os.environ.get("CONTAINER_AGENT_URL"):
        return run_dashboard_via_agent()

    # The agent, or an explicit single-container deployment, owns engine access.
    return run_with_engine()


if __name__ == "__main__":
    raise SystemExit(main())
