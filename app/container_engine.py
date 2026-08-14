#!/usr/bin/env python3
from __future__ import annotations

from dataclasses import dataclass
from http.client import HTTPConnection
import json
import os
from pathlib import Path
import socket
from typing import Any


class UnixHTTPConnection(HTTPConnection):
    def __init__(self, socket_path: str, timeout: float = 4.0):
        super().__init__("localhost", timeout=timeout)
        self.socket_path = socket_path

    def connect(self) -> None:
        self.sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.connect(self.socket_path)


@dataclass(frozen=True)
class ContainerEngine:
    name: str
    socket_path: str
    version: str = "unknown"
    api_version: str = "unknown"

    @property
    def is_podman(self) -> bool:
        return self.name == "podman"

    @property
    def is_docker(self) -> bool:
        return self.name == "docker"

    def request(self, method: str, path: str, body: bytes | None = None, maximum: int = 5_000_000) -> bytes:
        connection = UnixHTTPConnection(self.socket_path)
        try:
            connection.request(method, path, body=body, headers={"Accept": "application/json"})
            response = connection.getresponse()
            payload = response.read(maximum)
            if response.status >= 400:
                raise RuntimeError(f"{self.name.title()} engine returned HTTP {response.status}")
            return payload
        finally:
            connection.close()

    def request_json(self, path: str, maximum: int = 5_000_000) -> Any:
        payload = self.request("GET", path, maximum=maximum)
        return json.loads(payload) if payload else None


def _candidate_sockets() -> list[str]:
    explicit = os.environ.get("CONTAINER_SOCKET", "").strip()
    legacy = os.environ.get("DOCKER_SOCKET", "").strip()
    candidates: list[str] = []
    if explicit:
        candidates.append(explicit)
    if legacy and legacy not in candidates:
        candidates.append(legacy)
    for path in ("/run/podman/podman.sock", "/var/run/docker.sock"):
        if path not in candidates:
            candidates.append(path)
    run_user = Path("/run/user")
    if run_user.is_dir():
        for path in sorted(run_user.glob("*/podman/podman.sock")):
            value = str(path)
            if value not in candidates:
                candidates.append(value)
    return candidates


def _probe(path: str) -> ContainerEngine | None:
    if not Path(path).exists():
        return None
    try:
        connection = UnixHTTPConnection(path, timeout=2.0)
        try:
            connection.request("GET", "/_ping")
            response = connection.getresponse()
            response.read(4096)
            if response.status >= 400:
                return None
        finally:
            connection.close()

        connection = UnixHTTPConnection(path, timeout=2.0)
        try:
            connection.request("GET", "/version", headers={"Accept": "application/json"})
            response = connection.getresponse()
            raw = response.read(250_000)
            if response.status >= 400:
                return None
            version_data = json.loads(raw or b"{}")
        finally:
            connection.close()

        haystack = json.dumps(version_data).lower()
        name = "podman" if "podman" in haystack or "libpod" in haystack else "docker"
        version = str(version_data.get("Version") or version_data.get("version") or "unknown")
        api_version = str(version_data.get("ApiVersion") or version_data.get("APIVersion") or version_data.get("apiVersion") or "unknown")
        return ContainerEngine(name=name, socket_path=path, version=version, api_version=api_version)
    except (OSError, ValueError, json.JSONDecodeError):
        return None


def detect_engine() -> ContainerEngine:
    requested = os.environ.get("CONTAINER_ENGINE", "auto").strip().lower() or "auto"
    if requested not in {"auto", "docker", "podman"}:
        raise RuntimeError("CONTAINER_ENGINE must be auto, docker, or podman")

    discovered: list[ContainerEngine] = []
    for path in _candidate_sockets():
        engine = _probe(path)
        if not engine:
            continue
        discovered.append(engine)
        if requested == "auto" or engine.name == requested:
            return engine

    if requested != "auto" and discovered:
        found = ", ".join(f"{item.name}:{item.socket_path}" for item in discovered)
        raise RuntimeError(f"Requested {requested} engine was not found; discovered {found}")
    raise RuntimeError("No Docker or Podman API socket is reachable; set CONTAINER_SOCKET explicitly")
