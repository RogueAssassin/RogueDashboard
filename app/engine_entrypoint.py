#!/usr/bin/env python3
from __future__ import annotations

import os
import sys

from container_engine import detect_engine


def main() -> int:
    engine = detect_engine()

    # Keep legacy dashboard internals working while moving configuration to
    # engine-neutral names. Existing DOCKER_* variables remain supported.
    os.environ.setdefault("CONTAINER_ENGINE", engine.name)
    os.environ.setdefault("CONTAINER_SOCKET", engine.socket_path)

    # Translate the public engine-neutral contract into the legacy internal
    # variable names used by dashboard.py. Podman compose files therefore do
    # not need to expose DOCKER_* configuration at all.
    os.environ["DOCKER_SOCKET"] = engine.socket_path
    if os.environ.get("CONTAINER_AGENT_URL") and not os.environ.get("DOCKER_AGENT_URL"):
        os.environ["DOCKER_AGENT_URL"] = os.environ["CONTAINER_AGENT_URL"]
    if os.environ.get("CONTAINER_AGENT_TOKEN") and not os.environ.get("DOCKER_AGENT_TOKEN"):
        os.environ["DOCKER_AGENT_TOKEN"] = os.environ["CONTAINER_AGENT_TOKEN"]

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

    # docker_action() opens the configured UNIX socket directly; setting the
    # dashboard global above is sufficient for both Docker and Podman's
    # Docker-compatible API. Keep the original function names for backward
    # compatibility with existing routes and agents.
    try:
        return int(dashboard.main())
    finally:
        dashboard.docker_request = original_request


if __name__ == "__main__":
    raise SystemExit(main())
