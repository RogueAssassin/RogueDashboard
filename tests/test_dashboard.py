from __future__ import annotations

import base64
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import threading
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlparse
from urllib.request import Request, urlopen
from zipfile import ZIP_DEFLATED, ZipFile


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "app"))

import dashboard as dashboard_app
from importer import import_homepage
from integrations import collect_widget


class WidgetFixtureHandler(BaseHTTPRequestHandler):
    requested_paths = []
    posted_paths = []

    def log_message(self, *_args):
        return

    def respond(self, value, status=200, headers=None):
        payload = value.encode() if isinstance(value, str) else json.dumps(value).encode()
        self.send_response(status)
        self.send_header("Content-Type", "text/plain" if isinstance(value, str) else "application/json")
        self.send_header("Content-Length", str(len(payload)))
        for key, header_value in (headers or {}).items():
            self.send_header(key, header_value)
        self.end_headers()
        self.wfile.write(payload)

    def do_POST(self):
        type(self).posted_paths.append(urlparse(self.path).path)
        body = self.rfile.read(int(self.headers.get("Content-Length", "0")))
        if self.path == "/api/v2/auth/login":
            values = parse_qs(body.decode())
            origin = f"http://{self.headers.get('Host')}"
            if values == {"username": ["widget-user"], "password": ["widget-pass"]} and self.headers.get("Origin") == origin and self.headers.get("Referer") == f"{origin}/":
                self.respond("Ok.", headers={"Set-Cookie": "SID=test-session; Path=/; HttpOnly"})
            else:
                self.respond("Fails.", 403)
        elif self.path == "/api/auth" and json.loads(body) == {"password": "pihole-pass"}:
            self.respond({"session": {"valid": True, "sid": "pihole-session", "csrf": "unused"}})
        else:
            self.respond({"error": "not found"}, 404)

    def do_DELETE(self):
        if self.path == "/api/auth" and self.headers.get("X-FTL-SID") == "pihole-session":
            self.respond({}, 200)
        else:
            self.respond({"error": "not found"}, 404)

    def do_GET(self):
        parsed = urlparse(self.path)
        type(self).requested_paths.append(parsed.path)
        api_authorization = self.headers.get("Authorization", "")
        qbit_api_path = parsed.path in ("/api/v2/transfer/info", "/api/v2/torrents/info")
        if qbit_api_path and api_authorization.startswith("Bearer ") and api_authorization != f"Bearer qbt_{'A' * 28}":
            self.respond({"error": "unauthorized"}, 401)
            return
        qbit_authorized = "SID=test-session" in self.headers.get("Cookie", "") or api_authorization == f"Bearer qbt_{'A' * 28}"
        if parsed.path == "/api/v2/transfer/info" and qbit_authorized:
            self.respond({"dl_info_speed": 2_000_000, "up_info_speed": 500_000})
        elif parsed.path == "/api/v2/torrents/info" and qbit_authorized:
            self.respond([{"state": "downloading"}, {"state": "uploading"}, {"state": "pausedUP"}])
        elif parsed.path == "/api/v3/queue" and self.headers.get("X-Api-Key") in ("arr-key", "a" * 32):
            self.respond({"totalRecords": 4, "records": []})
        elif parsed.path == "/api/v3/health" and self.headers.get("X-Api-Key") == "arr-key":
            self.respond([{"type": "warning"}])
        elif parsed.path == "/api/v3/wanted/cutoff" and self.headers.get("X-Api-Key") == "a" * 32:
            self.respond({"totalRecords": 1, "records": []})
        elif parsed.path == "/api/v3/wanted/missing" and self.headers.get("X-Api-Key") in ("arr-key", "a" * 32):
            self.respond({"totalRecords": 2, "records": []})
        elif parsed.path == "/api/v3/movie" and self.headers.get("X-Api-Key") == "a" * 32:
            self.respond([{"id": 1}, {"id": 2}, {"id": 3}])
        elif parsed.path == "/api/v3/series" and self.headers.get("X-Api-Key") == "arr-key":
            self.respond([{"id": 1}, {"id": 2}])
        elif parsed.path == "/api/v1/indexer" and self.headers.get("X-Api-Key") == "prowlarr-key":
            self.respond([{"enable": True}, {"enable": False}, {"enable": True}])
        elif parsed.path == "/api/v1/health" and self.headers.get("X-Api-Key") == "prowlarr-key":
            self.respond([])
        elif parsed.path == "/api/v1/indexerstats" and self.headers.get("X-Api-Key") == "prowlarr-key":
            self.respond({"indexers": [{"numberOfGrabs": 8, "numberOfQueries": 12, "numberOfFailedGrabs": 1, "numberOfFailedQueries": 2}]})
        elif parsed.path == "/api/v2" and parse_qs(parsed.query) == {"apikey": ["tautulli-key"], "cmd": ["get_activity"]}:
            self.respond({"response": {"result": "success", "data": {"stream_count": "3", "stream_count_transcode": "1", "total_bandwidth": 12000}}})
        elif parsed.path == "/api/episodes/wanted" and self.headers.get("X-API-KEY") == "bazarr-key":
            self.respond({"total": 7, "data": []})
        elif parsed.path == "/api/movies/wanted" and self.headers.get("X-API-KEY") == "bazarr-key":
            self.respond({"total": 2, "data": []})
        elif parsed.path == "/api/stats/summary" and self.headers.get("X-FTL-SID") == "pihole-session":
            self.respond({"queries": {"total": 1000, "blocked": 245, "percent_blocked": 24.5}, "clients": {"active": 9}, "gravity": {"domains_being_blocked": 123456}})
        elif parsed.path == "/api/v1/request/count" and self.headers.get("X-Api-Key") == "seerr-key":
            self.respond({"pending": 2, "approved": 3, "processing": 1, "available": 7})
        elif parsed.path == "/api/status":
            self.respond({"appVersion": "0.8.8", "engine": "podman", "version": "5.7.0", "apiVersion": "5.7.0"})
        elif parsed.path == "/api/stacks":
            self.respond([
                {"name": "one", "state": "running"},
                {"name": "two", "state": "running"},
                {"name": "three", "state": "stopped"},
            ])
        elif parsed.path == "/api/containers":
            self.respond([
                {"name": "one", "state": "running"},
                {"name": "two", "state": "running"},
                {"name": "three", "state": "running"},
                {"name": "four", "state": "exited"},
            ])
        elif parsed.path == "/custom-json" and self.headers.get("Authorization") == "Bearer custom-token":
            self.respond({
                "status": "healthy",
                "data": {"users": 12, "nested": [{"name": "alpha"}]},
                "build": {"version": "4.2.1"},
            })
        elif parsed.path == "/api/nginx/proxy-hosts" and self.headers.get("Authorization") == "Bearer npm-token":
            self.respond([
                {"id": 1, "enabled": True},
                {"id": 2, "enabled": True},
                {"id": 3, "enabled": False},
            ])
        elif parsed.path == "/api/nginx/certificates" and self.headers.get("Authorization") == "Bearer npm-token":
            self.respond([
                {"id": 1, "expires_on": "2099-01-01T00:00:00Z"},
                {"id": 2, "expires_on": "2099-02-01T00:00:00Z"},
            ])
        elif parsed.path == "/api/status-page/default":
            self.respond({
                "publicGroupList": [{
                    "name": "Services",
                    "monitorList": [{"id": 1, "name": "One"}, {"id": 2, "name": "Two"}],
                }]
            })
        elif parsed.path == "/api/status-page/heartbeat/default":
            self.respond({
                "heartbeatList": {
                    "1": [{"status": 1, "ping": 20}],
                    "2": [{"status": 0, "ping": None}],
                },
                "uptimeList": {"1_24": 0.999, "2_24": 0.95},
            })
        else:
            self.respond({"error": "not found"}, 404)


class RogueDashboardTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        fixture = ROOT / "tests" / "fixtures" / "homepage"
        cls.files = {path.name: path.read_text() for path in fixture.glob("*.yaml")}

    def test_imports_generic_homepage_configuration(self):
        result = import_homepage(self.files)
        self.assertEqual(result["summary"]["groups"], 7)
        self.assertEqual(result["summary"]["services"], 12)
        self.assertEqual(result["summary"]["bookmarks"], 3)
        self.assertEqual(result["summary"]["widgets"], 2)
        self.assertEqual(len(result["summary"]["secretReferences"]), 10)
        self.assertEqual(result["dashboard"]["meta"]["title"], "Home Lab Dashboard")
        qbit = result["dashboard"]["groups"][0]["items"][0]["widget"]
        self.assertEqual(qbit["secretBindings"]["api_key"], "RGDASH_QBITTORRENT_API_KEY")
        self.assertEqual(qbit["secretBindings"]["username"], "RGDASH_QBITTORRENT_USERNAME")
        self.assertEqual(qbit["secretBindings"]["password"], "RGDASH_QBITTORRENT_PASSWORD")
        self.assertNotIn("Homepage", [item["name"] for group in result["dashboard"]["groups"] for item in group["items"]])
        bookmarks = [
            item["name"]
            for group in result["dashboard"]["groups"]
            if group["kind"] == "bookmarks"
            for item in group["items"]
        ]
        self.assertEqual(bookmarks, ["GitHub", "Docker Docs", "Project Website"])

    def test_discards_literal_widget_credentials(self):
        result = import_homepage({
            "services.yaml": "- Services:\n    - Example:\n        widget:\n          type: example\n          password: never-store-this\n"
        })
        self.assertNotIn("never-store-this", json.dumps(result["dashboard"]))
        self.assertIn("literal password value was discarded", result["warnings"][0])

    def test_live_service_widget_collectors_keep_secrets_server_side(self):
        WidgetFixtureHandler.requested_paths = []
        WidgetFixtureHandler.posted_paths = []
        server = ThreadingHTTPServer(("127.0.0.1", 0), WidgetFixtureHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = f"http://127.0.0.1:{server.server_port}"
        values = {
            "RGDASH_QBITTORRENT_API_KEY": f"qbt_{'A' * 28}",
            "RGDASH_QBITTORRENT_USERNAME": "widget-user",
            "RGDASH_QBITTORRENT_PASSWORD": "widget-pass",
            "RGDASH_RADARR_KEY": "a" * 32,
            "TEST_ARR_KEY": "arr-key",
            "TEST_PROWLARR_KEY": "prowlarr-key",
            "TEST_TAUTULLI_KEY": "tautulli-key",
            "TEST_BAZARR_KEY": "bazarr-key",
            "TEST_PIHOLE_KEY": "pihole-pass",
            "TEST_SEERR_KEY": "seerr-key",
        }
        previous = {key: os.environ.get(key) for key in values}
        os.environ.update(values)
        try:
            cases = [
                ("qbittorrent", ["RGDASH_QBITTORRENT_API_KEY", "RGDASH_QBITTORRENT_USERNAME", "RGDASH_QBITTORRENT_PASSWORD"], {"api_key": "RGDASH_QBITTORRENT_API_KEY", "username": "RGDASH_QBITTORRENT_USERNAME", "password": "RGDASH_QBITTORRENT_PASSWORD"}, ["Download", "Upload", "Leech", "Seed"]),
                ("radarr", ["RGDASH_RADARR_KEY"], {"key": "RGDASH_RADARR_KEY"}, ["Wanted", "Missing", "Queued", "Movies"]),
                ("sonarr", ["TEST_ARR_KEY"], {"key": "TEST_ARR_KEY"}, ["Wanted", "Queued", "Series"]),
                ("prowlarr", ["TEST_PROWLARR_KEY"], {"key": "TEST_PROWLARR_KEY"}, ["Grabs", "Queries", "Fail grabs", "Fail queries"]),
                ("seerr", ["TEST_SEERR_KEY"], {"key": "TEST_SEERR_KEY"}, ["Pending", "Approved", "Processing", "Available"]),
                ("tautulli", ["TEST_TAUTULLI_KEY"], {"key": "TEST_TAUTULLI_KEY"}, ["Playing", "Transcoding", "Bitrate"]),
                ("bazarr", ["TEST_BAZARR_KEY"], {"key": "TEST_BAZARR_KEY"}, ["Missing episodes", "Missing movies"]),
                ("pihole", ["TEST_PIHOLE_KEY"], {"key": "TEST_PIHOLE_KEY"}, ["Queries", "Blocked", "Gravity", "Clients"]),                ("rogueforge", [], {}, ["Version", "Engine", "Stacks", "Containers"]),

            ]
            for index, (kind, refs, bindings, labels) in enumerate(cases):
                item = {"id": f"widget-{index}", "widget": {"type": kind, "url": base, "secretRefs": refs, "secretBindings": bindings}}
                result = collect_widget(item)
                self.assertEqual(result["state"], "ok", result)
                self.assertEqual([metric["label"] for metric in result["metrics"]], labels)
                self.assertTrue(all(entry["loaded"] for entry in result["environment"]))
                serialized = json.dumps(result)
                for secret in values.values():
                    self.assertNotIn(secret, serialized)
            self.assertEqual(WidgetFixtureHandler.requested_paths.count("/api/v2/torrents/info"), 1)
            self.assertEqual(WidgetFixtureHandler.posted_paths.count("/api/v2/auth/login"), 0)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)
            for key, value in previous.items():
                if value is None:
                    os.environ.pop(key, None)
                else:
                    os.environ[key] = value

    def test_custom_api_widget_reads_json_paths_without_exposing_token(self):
        server = ThreadingHTTPServer(("127.0.0.1", 0), WidgetFixtureHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        previous = os.environ.get("RGDASH_CUSTOM_API_TOKEN")
        os.environ["RGDASH_CUSTOM_API_TOKEN"] = "custom-token"
        try:
            result = collect_widget({
                "id": "custom-api",
                "widget": {
                    "type": "customapi",
                    "url": f"http://127.0.0.1:{server.server_port}/custom-json",
                    "authMode": "bearer",
                    "secretRefs": ["RGDASH_CUSTOM_API_TOKEN"],
                    "secretBindings": {"token": "RGDASH_CUSTOM_API_TOKEN"},
                    "metrics": [
                        {"label": "Status", "path": "status"},
                        {"label": "Users", "path": "data.users"},
                        {"label": "First", "path": "data.nested.0.name"},
                        {"label": "Version", "path": "build.version"},
                    ],
                },
            })
            self.assertEqual(result["state"], "ok", result)
            self.assertEqual(
                [(metric["label"], metric["value"]) for metric in result["metrics"]],
                [("Status", "healthy"), ("Users", "12"), ("First", "alpha"), ("Version", "4.2.1")],
            )
            self.assertNotIn("custom-token", json.dumps(result))
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)
            if previous is None:
                os.environ.pop("RGDASH_CUSTOM_API_TOKEN", None)
            else:
                os.environ["RGDASH_CUSTOM_API_TOKEN"] = previous

    def test_custom_api_configuration_is_bounded_by_dashboard_validation(self):
        validated = dashboard_app.validate_dashboard({
            "version": 8,
            "meta": {"title": "Custom API"},
            "groups": [{
                "id": "custom", "name": "Custom", "kind": "services", "columns": 2,
                "items": [{
                    "id": "custom-api", "name": "Example", "type": "service",
                    "widget": {
                        "type": "customapi",
                        "url": "http://example:8080/api/status",
                        "authMode": "bearer",
                        "secretRefs": ["RGDASH_CUSTOM_API_TOKEN"],
                        "secretBindings": {"token": "RGDASH_CUSTOM_API_TOKEN"},
                        "metrics": [
                            {"label": f"Metric {index}", "path": f"data.value{index}"}
                            for index in range(8)
                        ],
                    },
                }],
            }],
        })
        widget = validated["groups"][0]["items"][0]["widget"]
        self.assertEqual(widget["authMode"], "bearer")
        self.assertEqual(len(widget["metrics"]), 4)
        self.assertEqual(widget["secretBindings"]["token"], "RGDASH_CUSTOM_API_TOKEN")

    def test_npm_native_widget_uses_bearer_token_and_compact_metrics(self):
        server = ThreadingHTTPServer(("127.0.0.1", 0), WidgetFixtureHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        previous = os.environ.get("RGDASH_NPM_TOKEN")
        os.environ["RGDASH_NPM_TOKEN"] = "npm-token"
        try:
            result = collect_widget({
                "id": "npm",
                "widget": {
                    "type": "npm",
                    "url": f"http://127.0.0.1:{server.server_port}",
                    "secretRefs": ["RGDASH_NPM_TOKEN"],
                    "secretBindings": {"token": "RGDASH_NPM_TOKEN"},
                },
            })
            self.assertEqual(result["state"], "ok", result)
            self.assertEqual(
                [(metric["label"], metric["value"]) for metric in result["metrics"]],
                [("Proxy hosts", "3"), ("Enabled", "2"), ("Certificates", "2"), ("Expiring 30d", "0")],
            )
            self.assertNotIn("npm-token", json.dumps(result))
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)
            if previous is None:
                os.environ.pop("RGDASH_NPM_TOKEN", None)
            else:
                os.environ["RGDASH_NPM_TOKEN"] = previous

    def test_uptime_kuma_native_widget_uses_public_status_page(self):
        server = ThreadingHTTPServer(("127.0.0.1", 0), WidgetFixtureHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            result = collect_widget({
                "id": "uptime-kuma",
                "widget": {
                    "type": "uptimekuma",
                    "url": f"http://127.0.0.1:{server.server_port}",
                    "statusPageSlug": "default",
                    "secretRefs": [],
                    "secretBindings": {},
                },
            })
            self.assertEqual(result["state"], "ok", result)
            self.assertEqual(
                [(metric["label"], metric["value"]) for metric in result["metrics"]],
                [("Monitors", "2"), ("Up", "1"), ("Down", "1"), ("24h uptime", "97.45%")],
            )
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

    def test_qbittorrent_falls_back_when_api_key_is_rejected(self):
        server = ThreadingHTTPServer(("127.0.0.1", 0), WidgetFixtureHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        values = {
            "RGDASH_QBITTORRENT_API_KEY": f"qbt_{'B' * 28}",
            "RGDASH_QBITTORRENT_USERNAME": "widget-user",
            "RGDASH_QBITTORRENT_PASSWORD": "widget-pass",
        }
        previous = {key: os.environ.get(key) for key in values}
        os.environ.update(values)
        WidgetFixtureHandler.posted_paths = []
        try:
            result = collect_widget({
                "id": "qbittorrent",
                "widget": {
                    "type": "qbittorrent",
                    "url": f"http://127.0.0.1:{server.server_port}",
                    "secretRefs": list(values),
                    "secretBindings": {
                        "api_key": "RGDASH_QBITTORRENT_API_KEY",
                        "username": "RGDASH_QBITTORRENT_USERNAME",
                        "password": "RGDASH_QBITTORRENT_PASSWORD",
                    },
                },
            })
            self.assertEqual(result["state"], "ok", result)
            self.assertEqual(result["authentication"], "username_password_fallback")
            self.assertIn("API key was rejected", result["message"])
            self.assertEqual(WidgetFixtureHandler.posted_paths.count("/api/v2/auth/login"), 1)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)
            for key, value in previous.items():
                if value is None:
                    os.environ.pop(key, None)
                else:
                    os.environ[key] = value

    def test_widget_reports_missing_environment_reference(self):
        os.environ.pop("TEST_MISSING_WIDGET_KEY", None)
        result = collect_widget({
            "id": "radarr",
            "widget": {"type": "radarr", "url": "http://radarr:7878", "secretRefs": ["TEST_MISSING_WIDGET_KEY"]},
        })
        self.assertEqual(result["state"], "configuration_required")
        self.assertEqual(result["missingRefs"], ["TEST_MISSING_WIDGET_KEY"])

    def test_radarr_reports_incomplete_api_key_before_connecting(self):
        previous = os.environ.get("RGDASH_RADARR_KEY")
        os.environ["RGDASH_RADARR_KEY"] = "incomplete-key"
        try:
            result = collect_widget({
                "id": "radarr",
                "widget": {
                    "type": "radarr",
                    "url": "http://radarr:7878",
                    "secretRefs": ["RGDASH_RADARR_KEY"],
                    "secretBindings": {"key": "RGDASH_RADARR_KEY"},
                },
            })
            self.assertEqual(result["state"], "error")
            self.assertIn("32-character", result["message"])
        finally:
            if previous is None:
                os.environ.pop("RGDASH_RADARR_KEY", None)
            else:
                os.environ["RGDASH_RADARR_KEY"] = previous

    def test_v03_dashboard_migrates_to_neon_and_rgdash_references(self):
        legacy = import_homepage(self.files)["dashboard"]
        legacy["version"] = 1
        legacy["meta"]["theme"] = "midnight"
        next(item for item in legacy["groups"][0]["items"] if item["name"] == "Seerr").pop("widget", None)
        widget = legacy["groups"][0]["items"][0]["widget"]
        widget["secretRefs"] = ["HOMEPAGE_VAR_QBITTORRENT_USERNAME", "HOMEPAGE_VAR_QBITTORRENT_PASSWORD"]
        widget["secretBindings"] = {"username": "HOMEPAGE_VAR_QBITTORRENT_USERNAME", "password": "HOMEPAGE_VAR_QBITTORRENT_PASSWORD"}
        migrated = dashboard_app.validate_dashboard(legacy)
        self.assertEqual(migrated["version"], 8)
        self.assertEqual(migrated["meta"]["theme"], "neon")
        self.assertEqual(migrated["meta"]["density"], "compact")
        migrated_widget = migrated["groups"][0]["items"][0]["widget"]
        self.assertEqual(migrated_widget["secretBindings"]["api_key"], "RGDASH_QBITTORRENT_API_KEY")
        self.assertEqual(migrated_widget["secretBindings"]["username"], "RGDASH_QBITTORRENT_USERNAME")
        seerr = next(item for item in migrated["groups"][0]["items"] if item["name"] == "Seerr")
        self.assertEqual(seerr["widget"]["type"], "seerr")
        self.assertEqual(seerr["widget"]["secretRefs"], ["RGDASH_SEERR_KEY"])

    def test_v04_dashboard_removes_legacy_homepage_card_without_reordering_bookmarks(self):
        current = import_homepage(self.files)["dashboard"]
        current["groups"].append({
            "id": "admin", "name": "Admin", "kind": "services", "columns": 2, "collapsed": False,
            "items": [{"id": "homepage", "name": "Homepage", "href": "http://homepage:3000", "type": "service", "statusStyle": "dot"}],
        })
        current["version"] = 2
        migrated = dashboard_app.validate_dashboard(current)
        names = [item["name"] for group in migrated["groups"] for item in group["items"]]
        self.assertNotIn("Homepage", names)
        bookmark_groups = [group["name"] for group in migrated["groups"] if group["kind"] == "bookmarks"]
        self.assertEqual(bookmark_groups, ["Developer resources", "Documentation", "Project"])

    def test_v07_migrates_rogueroute_cards_to_private_health_endpoints(self):
        current = {
            "version": 3,
            "meta": {"title": "Docker"},
            "groups": [{
                "id": "routes", "name": "Routes", "kind": "services", "columns": 3, "items": [
                    {"id": "web", "name": "RogueRoute-GPX", "href": "http://old", "type": "service"},
                    {"id": "osrm", "name": "rogueroute-osrm", "href": "http://old", "type": "service"},
                    {"id": "manager", "name": "rogueroute-gpx-manager", "href": "http://old", "type": "service"},
                ],
            }],
        }
        with patch.object(dashboard_app, "ROGUEROUTE_PUBLIC_URL", "https://gpx.example.com"):
            migrated = dashboard_app.validate_dashboard(current)
        web, osrm, manager = migrated["groups"][0]["items"]
        self.assertEqual(web["href"], "https://gpx.example.com")
        self.assertEqual(web["monitorUrl"], "http://rogueroute-gpx-web:9080/api/health")
        self.assertEqual(osrm["href"], "")
        self.assertEqual(osrm["monitorUrl"], "http://rogueroute-gpx-web:9080/api/health/osrm")
        self.assertEqual(manager["href"], "")
        self.assertEqual(manager["monitorUrl"], "http://rogueroute-gpx-manager:9090/health")
        self.assertTrue(all(item["icon"].startswith("/icons/rogueroute-") for item in (web, osrm, manager)))
        self.assertEqual(
            [item["containerName"] for item in (web, osrm, manager)],
            ["rogueroute-gpx-web", "rogueroute-gpx-osrm", "rogueroute-gpx-manager"],
        )

    def test_v08_preserves_multiple_pages_and_migrates_legacy_groups_home(self):
        multi_page = {
            "version": 6,
            "meta": {"title": "Pages"},
            "pages": [{"id": "home", "name": "Home"}, {"id": "media", "name": "Media"}],
            "groups": [
                {"id": "home-group", "name": "Home", "kind": "services", "columns": 2, "pageId": "home", "items": [{"id": "one", "name": "One"}]},
                {"id": "media-group", "name": "Media", "kind": "services", "columns": 3, "pageId": "media", "items": [{"id": "two", "name": "Two"}]},
            ],
        }
        validated = dashboard_app.validate_dashboard(multi_page)
        self.assertEqual([page["id"] for page in validated["pages"]], ["home", "media"])
        self.assertEqual([group["pageId"] for group in validated["groups"]], ["home", "media"])

        multi_page["version"] = 5
        legacy = dashboard_app.validate_dashboard(multi_page)
        self.assertEqual([group["pageId"] for group in legacy["groups"]], ["home", "home"])

    def test_v08_card_controls_are_validated_and_preserved(self):
        current = {
            "version": 8,
            "meta": {"title": "Cards"},
            "groups": [{
                "id": "services", "name": "Services", "kind": "services", "columns": 3,
                "items": [{
                    "id": "radarr", "name": "Radarr", "href": "https://radarr.example.com",
                    "favorite": True, "tags": ["media", "movies", "", "x" * 60],
                    "launchMode": "same-tab", "healthMethod": "GET", "healthTimeout": 8,
                    "healthStatusMin": 200, "healthStatusMax": 399,
                }],
            }],
        }
        validated = dashboard_app.validate_dashboard(current)
        item = validated["groups"][0]["items"][0]
        self.assertEqual(validated["version"], 8)
        self.assertTrue(item["favorite"])
        self.assertEqual(item["tags"][:2], ["media", "movies"])
        self.assertEqual(len(item["tags"][2]), 40)
        self.assertEqual(item["launchMode"], "same-tab")
        self.assertEqual(item["healthMethod"], "GET")
        self.assertEqual(item["healthTimeout"], 8)
        self.assertEqual((item["healthStatusMin"], item["healthStatusMax"]), (200, 399))

    def test_configurable_health_probe_method_and_status_range(self):
        class ProbeHandler(BaseHTTPRequestHandler):
            def log_message(self, *_args):
                return

            def do_GET(self):
                self.send_response(401)
                self.end_headers()

            def do_HEAD(self):
                self.send_response(405)
                self.end_headers()

        server = ThreadingHTTPServer(("127.0.0.1", 0), ProbeHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            result = dashboard_app.health_check({
                "id": "custom-health",
                "monitorUrl": f"http://127.0.0.1:{server.server_port}/health",
                "healthMethod": "GET",
                "healthTimeout": 2,
                "healthStatusMin": 400,
                "healthStatusMax": 499,
            })
            self.assertEqual(result["state"], "online")
            self.assertEqual(result["status"], 401)
            self.assertEqual(result["method"], "GET")
            self.assertEqual(result["timeoutSeconds"], 2)

            rejected = dashboard_app.health_check({
                "id": "custom-health",
                "monitorUrl": f"http://127.0.0.1:{server.server_port}/health",
                "healthMethod": "GET",
                "healthStatusMin": 200,
                "healthStatusMax": 399,
            })
            self.assertEqual(rejected["state"], "offline")
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

    def test_reads_homepage_zip_without_extracting_paths(self):
        archive = BytesIO()
        with ZipFile(archive, "w") as output:
            output.writestr("config/services.yaml", self.files["services.yaml"])
            output.writestr("../../ignored.txt", "not imported")
        files = dashboard_app.read_import_files({"zipBase64": base64.b64encode(archive.getvalue()).decode()})
        self.assertIn("services.yaml", files)
        self.assertNotIn("ignored.txt", files)

    def test_rejects_zip_entry_and_expansion_bombs(self):
        too_many = BytesIO()
        with ZipFile(too_many, "w", ZIP_DEFLATED) as output:
            for index in range(dashboard_app.MAX_ARCHIVE_ENTRIES + 1):
                output.writestr(f"ignored-{index}.txt", "")
        with self.assertRaisesRegex(ValueError, "more than"):
            dashboard_app.read_import_files({"zipBase64": base64.b64encode(too_many.getvalue()).decode()})

        expanded = BytesIO()
        with ZipFile(expanded, "w", ZIP_DEFLATED) as output:
            for index in range(6):
                output.writestr(f"folder-{index}/services.yaml", "A" * 900_000)
        with self.assertRaisesRegex(ValueError, "expands beyond"):
            dashboard_app.read_import_files({"zipBase64": base64.b64encode(expanded.getvalue()).decode()})

    def test_database_authentication_and_persistence(self):
        with tempfile.TemporaryDirectory() as directory:
            database = dashboard_app.Database(Path(directory) / "dashboard.sqlite")
            self.assertTrue(database.setup_required())
            imported = import_homepage(self.files)["dashboard"]
            token, _ = database.setup("admin", "a-secure-test-password", imported)
            with self.assertRaises(dashboard_app.SetupCompleted):
                database.setup("second-admin", "another-secure-password", imported)
            self.assertEqual(database.user_for_token(token), "admin")
            self.assertIsNone(database.login("admin", "incorrect-password"))
            second_login = database.login("admin", "a-secure-test-password")
            self.assertIsNotNone(second_login)
            sessions = database.sessions(token)
            self.assertEqual(len(sessions), 2)
            self.assertTrue(any(session["current"] for session in sessions))
            other = next(session for session in sessions if not session["current"])
            self.assertTrue(database.revoke_session(other["id"], token))
            self.assertEqual(len(database.sessions(token)), 1)
            database.audit("admin", "docker.restart", "0123456789ab", "success")
            self.assertEqual(database.audit_entries()[0]["action"], "docker.restart")
            self.assertEqual(database.dashboard()["meta"]["title"], "Home Lab Dashboard")

    def test_database_migrates_pre_v1_session_table_in_place(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "legacy.sqlite"
            connection = sqlite3.connect(path)
            connection.executescript(
                """
                CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password_hash TEXT, salt TEXT, created_at TEXT);
                CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL, expires_at INTEGER NOT NULL);
                """
            )
            connection.commit()
            connection.close()
            database = dashboard_app.Database(path)
            columns = {row[1] for row in database.db.execute("PRAGMA table_info(sessions)")}
            self.assertTrue({"created_at", "last_seen_at"}.issubset(columns))
            self.assertIsNotNone(database.db.execute("SELECT name FROM sqlite_master WHERE name='action_audit'").fetchone())

    def test_setup_and_authenticated_save_over_http(self):
        with tempfile.TemporaryDirectory() as directory:
            previous = dashboard_app.DB
            previous_custom = dashboard_app.CUSTOM_DIR
            dashboard_app.DB = dashboard_app.Database(Path(directory) / "api.sqlite")
            dashboard_app.CUSTOM_DIR = Path(directory) / "custom"
            (dashboard_app.CUSTOM_DIR / "icons").mkdir(parents=True)
            (dashboard_app.CUSTOM_DIR / "icons" / "example.svg").write_text("<svg xmlns='http://www.w3.org/2000/svg'/>")
            (dashboard_app.CUSTOM_DIR / "icons" / "blocked.html").write_text("<script>alert(1)</script>")
            server = ThreadingHTTPServer(("127.0.0.1", 0), dashboard_app.DashboardHandler)
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            base = f"http://127.0.0.1:{server.server_port}"
            try:
                with urlopen(f"{base}/api/bootstrap") as response:
                    bootstrap = json.load(response)
                    self.assertTrue(bootstrap["setupRequired"])
                    self.assertEqual(bootstrap["version"], dashboard_app.VERSION)
                    self.assertEqual(response.headers["Cross-Origin-Opener-Policy"], "same-origin")
                imported = import_homepage(self.files)["dashboard"]
                request = Request(
                    f"{base}/api/setup",
                    method="POST",
                    data=json.dumps({"username": "admin", "password": "a-secure-test-password", "dashboard": imported}).encode(),
                    headers={"Content-Type": "application/json"},
                )
                with urlopen(request) as response:
                    cookie = response.headers["Set-Cookie"].split(";", 1)[0]
                    self.assertEqual(response.status, 201)
                with urlopen(f"{base}/custom/icons/example.svg") as response:
                    self.assertEqual(response.headers.get_content_type(), "image/svg+xml")
                with urlopen(f"{base}/icons/roguedashboard-approved-128.png") as response:
                    self.assertEqual(response.headers.get_content_type(), "image/png")
                for name in ("rogueroute-gpx.svg", "rogueroute-osrm.svg", "rogueroute-manager.svg"):
                    with urlopen(f"{base}/icons/{name}") as response:
                        self.assertEqual(response.headers.get_content_type(), "image/svg+xml")
                with self.assertRaises(HTTPError) as context:
                    urlopen(f"{base}/custom/../not-allowed.svg")
                self.assertEqual(context.exception.code, 404)
                with self.assertRaises(HTTPError) as context:
                    urlopen(f"{base}/custom/icons/blocked.html")
                self.assertEqual(context.exception.code, 404)
                with self.assertRaises(HTTPError) as context:
                    urlopen(f"{base}/missing-script.js")
                self.assertEqual(context.exception.code, 404)
                imported["meta"]["title"] = "Updated dashboard"
                request = Request(
                    f"{base}/api/dashboard",
                    method="PUT",
                    data=json.dumps(imported).encode(),
                    headers={"Content-Type": "application/json", "Cookie": cookie},
                )
                with urlopen(request) as response:
                    self.assertEqual(json.load(response)["dashboard"]["meta"]["title"], "Updated dashboard")
                import_request = Request(
                    f"{base}/api/import/dashboard",
                    method="POST",
                    data=json.dumps({"dashboard": imported}).encode(),
                    headers={"Content-Type": "application/json", "Cookie": cookie},
                )
                with urlopen(import_request) as response:
                    restored = json.load(response)
                    self.assertEqual(restored["dashboard"]["pages"][0]["id"], "home")
                    self.assertEqual(restored["summary"]["services"], 12)
                session_request = Request(f"{base}/api/admin/sessions", headers={"Cookie": cookie})
                with urlopen(session_request) as response:
                    self.assertTrue(json.load(response)["sessions"][0]["current"])
                audit_request = Request(f"{base}/api/admin/audit", headers={"Cookie": cookie})
                with urlopen(audit_request) as response:
                    actions = [entry["action"] for entry in json.load(response)["entries"]]
                    self.assertIn("dashboard.save", actions)
                dashboard_app.WIDGET_CACHE = (0, [])
                with urlopen(f"{base}/api/widgets") as response:
                    widgets = json.load(response)
                    self.assertIn("qbittorrent", widgets["supported"])
                    self.assertIn("seerr", widgets["supported"])
                    self.assertIn("npm", widgets["supported"])
                    self.assertIn("uptimekuma", widgets["supported"])
                    self.assertEqual(len(widgets["widgets"]), 9)
                    self.assertTrue(all(item["state"] != "ok" for item in widgets["widgets"]))
                    self.assertTrue(any(item["type"] == "uptimekuma" for item in widgets["widgets"]))
                dashboard_app.HEALTH_CACHE = (9999999999, [{"old": True}])
                dashboard_app.WIDGET_CACHE = (9999999999, [{"old": True}])
                unauthenticated = Request(
                    f"{base}/api/monitor/refresh",
                    method="POST",
                    data=b"{}",
                    headers={"Content-Type": "application/json"},
                )
                with self.assertRaises(HTTPError) as context:
                    urlopen(unauthenticated)
                self.assertEqual(context.exception.code, 401)
                authenticated = Request(
                    f"{base}/api/monitor/refresh",
                    method="POST",
                    data=b"{}",
                    headers={"Content-Type": "application/json", "Cookie": cookie},
                )
                with urlopen(authenticated) as response:
                    self.assertTrue(json.load(response)["ok"])
                self.assertEqual(dashboard_app.HEALTH_CACHE, (0, []))
                self.assertEqual(dashboard_app.WIDGET_CACHE, (0, []))
            finally:
                server.shutdown()
                server.server_close()
                thread.join(timeout=2)
                dashboard_app.DB = previous
                dashboard_app.CUSTOM_DIR = previous_custom



    def test_socket_free_health_check_uses_endpoint_only(self):
        class HealthHandler(BaseHTTPRequestHandler):
            def log_message(self, *_args):
                return

            def do_HEAD(self):
                self.send_response(204)
                self.end_headers()

        server = ThreadingHTTPServer(("127.0.0.1", 0), HealthHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            result = dashboard_app.health_check({
                "id": "socket-free",
                "monitorUrl": f"http://127.0.0.1:{server.server_port}/health",
                "containerName": "ignored-by-1.2",
            })
            self.assertEqual(result["state"], "online")
            self.assertEqual(result["source"], "endpoint")
            self.assertEqual(result["status"], 204)
            self.assertNotIn("containerState", result)
            self.assertNotIn("containerHealth", result)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

    def test_legacy_database_filename_is_migrated_without_data_loss(self):
        previous_data_dir = dashboard_app.DATA_DIR
        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                dashboard_app.DATA_DIR = Path(temp_dir)
                legacy = dashboard_app.DATA_DIR / "rogue-dashboard.sqlite"
                legacy.write_bytes(b"legacy-database")
                resolved = dashboard_app.resolve_database_path()
                self.assertEqual(resolved.name, "roguedashboard.sqlite")
                self.assertFalse(legacy.exists())
                self.assertEqual(resolved.read_bytes(), b"legacy-database")
        finally:
            dashboard_app.DATA_DIR = previous_data_dir

    def test_runtime_metadata_is_exposed_in_bootstrap_contract(self):
        metadata = dashboard_app.runtime_metadata()
        self.assertIn(metadata["runtime"], {"Podman", "Docker", "Container"} | ({os.environ.get("RGDASH_RUNTIME")} if os.environ.get("RGDASH_RUNTIME") and os.environ.get("RGDASH_RUNTIME").lower() != "auto" else set()))
        self.assertTrue(metadata["platform"])
        self.assertTrue(metadata["arch"])
        self.assertEqual(metadata["license"], "MIT")


    def test_system_stats_expose_runtime_storage_and_network_without_engine_socket(self):
        stats = dashboard_app.system_stats()
        self.assertGreaterEqual(stats["memoryUsed"], 0)
        self.assertGreaterEqual(stats["memoryTotal"], 0)
        self.assertIn(stats["memoryScope"], {"container", "runtime"})
        self.assertGreaterEqual(stats["loadPercent"], 0)
        self.assertLessEqual(stats["loadPercent"], 100)
        self.assertGreaterEqual(stats["storageUsed"], 0)
        self.assertGreaterEqual(stats["storageTotal"], 0)
        self.assertIsInstance(stats["addresses"], list)
        self.assertEqual(stats["engineStatus"], "external")
        self.assertEqual(stats["containerStatus"], "external")
        self.assertEqual(stats["engine"]["socket"], "")

    def test_health_history_is_bounded_and_returns_compact_hour_summary(self):
        with dashboard_app.HEALTH_HISTORY_LOCK:
            dashboard_app.HEALTH_HISTORY.clear()
        try:
            for index in range(dashboard_app.HEALTH_HISTORY_LIMIT + 10):
                dashboard_app.record_health_history([{
                    "itemId": "service-one",
                    "state": "offline" if index % 10 == 0 else "online",
                    "latencyMs": 20 + (index % 5),
                }])
            summary = dashboard_app.health_history_summary()["service-one"]
            self.assertEqual(summary["samples"], dashboard_app.HEALTH_HISTORY_LIMIT)
            self.assertGreater(summary["availability"], 80)
            self.assertLess(summary["availability"], 100)
            self.assertIsInstance(summary["averageLatencyMs"], int)
            self.assertTrue(summary["lastFailureAt"].endswith("Z"))
            with dashboard_app.HEALTH_HISTORY_LOCK:
                self.assertEqual(len(dashboard_app.HEALTH_HISTORY["service-one"]), dashboard_app.HEALTH_HISTORY_LIMIT)
        finally:
            with dashboard_app.HEALTH_HISTORY_LOCK:
                dashboard_app.HEALTH_HISTORY.clear()

    def test_rogueforge_widget_uses_public_read_only_endpoints(self):
        class RogueForgeFixtureHandler(BaseHTTPRequestHandler):
            def log_message(self, *_args):
                return

            def respond(self, value):
                payload = json.dumps(value).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)

            def do_GET(self):
                if self.path == "/api/status":
                    self.respond({"appVersion": "0.8.8", "engine": "podman", "version": "5.7.0"})
                elif self.path == "/api/stacks":
                    self.respond([{"state": "running"}, {"state": "running"}, {"state": "stopped"}])
                elif self.path == "/api/containers":
                    self.respond([{"state": "running"}, {"state": "running"}, {"state": "running"}, {"state": "exited"}])
                else:
                    self.send_response(404)
                    self.end_headers()

        server = ThreadingHTTPServer(("127.0.0.1", 0), RogueForgeFixtureHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            result = collect_widget({
                "id": "rogueforge",
                "widget": {
                    "type": "rogueforge",
                    "url": f"http://127.0.0.1:{server.server_port}",
                    "secretRefs": [],
                    "secretBindings": {},
                },
            })
            self.assertEqual(result["state"], "ok")
            self.assertEqual(
                [(metric["label"], metric["value"]) for metric in result["metrics"]],
                [("Version", "0.8.8"), ("Engine", "Podman"), ("Stacks", "2/3"), ("Containers", "3/4")],
            )
            self.assertEqual(result["environment"], [])
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)



if __name__ == "__main__":
    unittest.main()
