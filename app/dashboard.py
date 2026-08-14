#!/usr/bin/env python3
from __future__ import annotations

import base64
from concurrent.futures import ThreadPoolExecutor
from copy import deepcopy
from datetime import datetime, timezone
import hashlib
import hmac
from http import HTTPStatus
from http.client import HTTPConnection
from http.cookies import SimpleCookie
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import io
import json
import mimetypes
import os
from pathlib import Path
import re
import secrets
import socket
import sqlite3
import sys
import threading
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import parse_qs, urlencode, urlparse
from urllib.request import Request, urlopen
import zipfile

from importer import DEFAULT_DASHBOARD, import_homepage, suggested_widget
from integrations import SUPPORTED_WIDGETS, collect_widget


VERSION = "1.1.0"
PORT = int(os.environ.get("PORT", "8080"))
AGENT_PORT = int(os.environ.get("AGENT_PORT", "8081"))
DATA_DIR = Path(os.environ.get("DATA_DIR", "/data"))
STATIC_DIR = Path(os.environ.get("STATIC_DIR", Path(__file__).with_name("static")))
CUSTOM_DIR = Path(os.environ.get("CUSTOM_DIR", "/custom"))
DOCKER_SOCKET = os.environ.get("DOCKER_SOCKET", "/var/run/docker.sock")
DOCKER_AGENT_URL = os.environ.get("DOCKER_AGENT_URL", "")
DOCKER_AGENT_TOKEN = os.environ.get("DOCKER_AGENT_TOKEN", "")
SECURE_COOKIES = os.environ.get("SECURE_COOKIES", "false").lower() == "true"
TRUST_PROXY_HEADERS = os.environ.get("RGDASH_TRUST_PROXY_HEADERS", "true").lower() == "true"
CONFIGURED_ALLOWED_HOSTS = {
    host.strip().lower().rstrip(".")
    for host in os.environ.get("RGDASH_ALLOWED_HOSTS", "").split(",")
    if host.strip()
}
ALLOWED_HOSTS = set(CONFIGURED_ALLOWED_HOSTS)
ALLOWED_HOSTS.update({"localhost", "127.0.0.1", "::1", "dashboard", "rogue-dashboard"})
ROGUEROUTE_PUBLIC_URL = os.environ.get("RGDASH_ROGUEROUTE_URL", "").strip()
if urlparse(ROGUEROUTE_PUBLIC_URL).scheme not in ("http", "https"):
    ROGUEROUTE_PUBLIC_URL = ""
SESSION_COOKIE = "rogue_session"
MAX_BODY = 2_000_000
MAX_ARCHIVE_ENTRIES = 100
MAX_ARCHIVE_UNCOMPRESSED = 5_000_000
MAX_CUSTOM_ASSET = 10_000_000
CUSTOM_ASSET_SUFFIXES = {".avif", ".gif", ".ico", ".jpeg", ".jpg", ".png", ".svg", ".webp"}
ROGUEROUTE_WEB_HEALTH_URL = "http://rogueroute-gpx-web:9080/api/health"
ROGUEROUTE_OSRM_HEALTH_URL = "http://rogueroute-gpx-web:9080/api/health/osrm"
ROGUEROUTE_MANAGER_HEALTH_URL = "http://rogueroute-gpx-manager:9090/health"


class SetupCompleted(Exception):
    """Raised when another setup request has already created the administrator."""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def clamp(value: Any, minimum: int, maximum: int, fallback: int) -> int:
    return max(minimum, min(maximum, value)) if isinstance(value, int) and not isinstance(value, bool) else fallback


def text(value: Any, maximum: int, fallback: str = "") -> str:
    return value[:maximum] if isinstance(value, str) else fallback


def canonical_env_ref(value: str) -> str:
    if value.startswith("HOMEPAGE_VAR_"):
        return f"RGDASH_{value.removeprefix('HOMEPAGE_VAR_')}"
    if value.startswith("HOMEPAGE_"):
        return f"RGDASH_{value.removeprefix('HOMEPAGE_')}"
    return value


def validate_dashboard(raw: Any) -> dict[str, Any]:
    if not isinstance(raw, dict):
        raise ValueError("Dashboard must be an object")
    raw_meta = raw.get("meta") if isinstance(raw.get("meta"), dict) else {}
    stored_version = raw.get("version") if isinstance(raw.get("version"), int) else 1
    allowed_themes = ("neon", "midnight", "graphite", "ocean", "ember", "light")
    stored_theme = raw_meta.get("theme") if raw_meta.get("theme") in allowed_themes else "midnight"
    theme = "neon" if stored_version < 2 and stored_theme == "midnight" else stored_theme
    accent = text(raw_meta.get("accent"), 7, "#ff2bd6" if theme == "neon" else "#7c5cff")
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", accent):
        accent = "#ff2bd6" if theme == "neon" else "#7c5cff"
    accent_secondary = text(raw_meta.get("accentSecondary"), 7, "#00e5ff")
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", accent_secondary):
        accent_secondary = "#00e5ff"
    result: dict[str, Any] = {
        "version": 7,
        "meta": {
            "title": text(raw_meta.get("title"), 100, "My Docker Dashboard").strip() or "My Docker Dashboard",
            "subtitle": text(raw_meta.get("subtitle"), 180, "Your self-hosted command centre"),
            "theme": theme,
            "accent": accent,
            "accentSecondary": accent_secondary,
            "background": text(raw_meta.get("background"), 1000),
            "backgroundMode": raw_meta.get("backgroundMode") if raw_meta.get("backgroundMode") in ("neon-grid", "aurora", "mesh", "solid", "image") else "neon-grid",
            "density": raw_meta.get("density") if raw_meta.get("density") in ("compact", "comfortable") else "compact",
            "glow": clamp(raw_meta.get("glow"), 0, 100, 68),
            "surfaceOpacity": clamp(raw_meta.get("surfaceOpacity"), 45, 100, 82),
            "showLatency": raw_meta.get("showLatency", True) is True,
            "fullWidth": raw_meta.get("fullWidth", True) is True,
            "equalHeights": raw_meta.get("equalHeights", True) is True,
            "maxColumns": clamp(raw_meta.get("maxColumns"), 1, 6, 4),
        },
        "groups": [],
        "widgets": {
            "resources": raw.get("widgets", {}).get("resources", True) is True if isinstance(raw.get("widgets"), dict) else True,
            "dateTime": raw.get("widgets", {}).get("dateTime", True) is True if isinstance(raw.get("widgets"), dict) else True,
        },
    }
    pages: list[dict[str, str]] = []
    page_ids: set[str] = set()
    raw_pages = raw.get("pages") if isinstance(raw.get("pages"), list) else []
    for page_index, raw_page in enumerate(raw_pages[:20]):
        if not isinstance(raw_page, dict):
            continue
        page_id = text(raw_page.get("id"), 100, f"page-{page_index + 1}").strip() or f"page-{page_index + 1}"
        if page_id in page_ids:
            page_id = f"{page_id}-{page_index + 1}"
        page_ids.add(page_id)
        pages.append({"id": page_id, "name": text(raw_page.get("name"), 100, "Page").strip() or "Page"})
    if not pages:
        pages = [{"id": "home", "name": "Home"}]
        page_ids = {"home"}
    result["pages"] = pages
    default_page_id = pages[0]["id"]
    seen: set[str] = set()
    raw_groups = raw.get("groups") if isinstance(raw.get("groups"), list) else []
    for group_index, raw_group in enumerate(raw_groups[:100]):
        if not isinstance(raw_group, dict):
            continue
        group_id = text(raw_group.get("id"), 100, f"group-{group_index + 1}") or f"group-{group_index + 1}"
        if group_id in seen:
            group_id = f"{group_id}-{group_index + 1}"
        seen.add(group_id)
        group = {
            "id": group_id,
            "name": text(raw_group.get("name"), 100, "Group").strip() or "Group",
            "kind": raw_group.get("kind") if raw_group.get("kind") in ("services", "bookmarks") else "services",
            "columns": clamp(raw_group.get("columns"), 1, 6, 3),
            "collapsed": raw_group.get("collapsed", False) is True,
            "pageId": raw_group.get("pageId") if stored_version >= 6 and raw_group.get("pageId") in page_ids else default_page_id,
            "items": [],
        }
        raw_items = raw_group.get("items") if isinstance(raw_group.get("items"), list) else []
        for item_index, raw_item in enumerate(raw_items[:500]):
            if not isinstance(raw_item, dict):
                continue
            item_id = text(raw_item.get("id"), 100, f"item-{group_index + 1}-{item_index + 1}")
            while item_id in seen:
                item_id = f"{item_id}-{item_index + 2}"
            seen.add(item_id)
            item: dict[str, Any] = {
                "id": item_id,
                "name": text(raw_item.get("name"), 100, "Service").strip() or "Service",
                "href": text(raw_item.get("href"), 2000),
                "type": raw_item.get("type") if raw_item.get("type") in ("service", "bookmark") else "service",
                "statusStyle": raw_item.get("statusStyle") if raw_item.get("statusStyle") in ("dot", "badge", "none") else "dot",
            }
            if isinstance(raw_item.get("containerName"), str):
                item["containerName"] = text(raw_item["containerName"], 255)
            for key, limit in (("monitorUrl", 2000), ("description", 300), ("icon", 500)):
                if isinstance(raw_item.get(key), str):
                    item[key] = text(raw_item[key], limit)
            raw_widget = raw_item.get("widget")
            if isinstance(raw_widget, dict) and isinstance(raw_widget.get("type"), str):
                refs = raw_widget.get("secretRefs") if isinstance(raw_widget.get("secretRefs"), list) else []
                widget: dict[str, Any] = {
                    "type": text(raw_widget["type"], 80),
                    "secretRefs": [canonical_env_ref(ref) for ref in refs[:50] if isinstance(ref, str) and re.fullmatch(r"[A-Z][A-Z0-9_]*", ref)],
                }
                raw_bindings = raw_widget.get("secretBindings") if isinstance(raw_widget.get("secretBindings"), dict) else {}
                bindings = {
                    key.lower(): value
                    for key, value in list(raw_bindings.items())[:50]
                    if isinstance(key, str)
                    and re.fullmatch(r"[a-zA-Z][a-zA-Z0-9_]*", key)
                    and isinstance(value, str)
                    and canonical_env_ref(value) in widget["secretRefs"]
                }
                bindings = {key: canonical_env_ref(value) for key, value in bindings.items()}
                if bindings:
                    widget["secretBindings"] = bindings
                if isinstance(raw_widget.get("url"), str):
                    widget["url"] = text(raw_widget["url"], 2000)
                if isinstance(raw_widget.get("version"), (str, int)):
                    widget["version"] = raw_widget["version"]
                if widget["type"].lower() == "qbittorrent":
                    bindings = widget.setdefault("secretBindings", {})
                    for binding, ref in (
                        ("api_key", "RGDASH_QBITTORRENT_API_KEY"),
                        ("username", "RGDASH_QBITTORRENT_USERNAME"),
                        ("password", "RGDASH_QBITTORRENT_PASSWORD"),
                    ):
                        if ref not in widget["secretRefs"]:
                            widget["secretRefs"].append(ref)
                        bindings[binding] = ref
                item["widget"] = widget
            elif stored_version < 2:
                suggested = suggested_widget(item["name"], item.get("monitorUrl", ""))
                if suggested:
                    item["widget"] = suggested
            if not (stored_version < 3 and re.sub(r"[^a-z0-9]+", "", item["name"].lower()) == "homepage"):
                if stored_version < 7:
                    identity = re.sub(r"[^a-z0-9]+", "", item["name"].lower())
                    container_name = item.get("containerName", "")
                    if identity in ("rogueroutegpx", "rogueroutegpxweb") or container_name == "rogueroute-gpx-web":
                        item.update(
                            name="RogueRoute GPX",
                            containerName="rogueroute-gpx-web",
                            monitorUrl=ROGUEROUTE_WEB_HEALTH_URL,
                            description="Route generator",
                            icon="/icons/rogueroute-gpx.svg",
                        )
                        if ROGUEROUTE_PUBLIC_URL:
                            item["href"] = ROGUEROUTE_PUBLIC_URL
                    elif identity in ("roguerouteosrm", "rogueroutegpxosrm") or container_name == "rogueroute-gpx-osrm":
                        item.update(
                            name="RogueRoute OSRM",
                            containerName="rogueroute-gpx-osrm",
                            href="",
                            monitorUrl=ROGUEROUTE_OSRM_HEALTH_URL,
                            description="Local route engine",
                            icon="/icons/rogueroute-osrm.svg",
                        )
                    elif identity in ("rogueroutemanager", "rogueroutegpxmanager") or container_name == "rogueroute-gpx-manager":
                        item.update(
                            name="RogueRoute Manager",
                            containerName="rogueroute-gpx-manager",
                            href="",
                            monitorUrl=ROGUEROUTE_MANAGER_HEALTH_URL,
                            description="Private region manager",
                            icon="/icons/rogueroute-manager.svg",
                        )
                group["items"].append(item)
        result["groups"].append(group)
    result["groups"] = [group for group in result["groups"] if group["items"]]
    if not result["groups"]:
        result["groups"] = deepcopy(DEFAULT_DASHBOARD["groups"])
        for group in result["groups"]:
            group["pageId"] = default_page_id
    return result
