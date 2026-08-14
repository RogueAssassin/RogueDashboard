"""Dependency-free, server-side collectors for service-card widgets.

Only compact display values and safe diagnostics leave this module. Secrets are
resolved from environment variable references at request time and are never
returned to the browser or written to the dashboard database.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from http.cookiejar import CookieJar
import json
import os
import re
import socket
import time
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import HTTPCookieProcessor, Request, build_opener, urlopen


USER_AGENT = "Rogue-Dashboard/1.1.0"
MAX_RESPONSE = 2_000_000
LARGE_LIBRARY_RESPONSE = 24_000_000
TIMEOUT = 6
SUPPORTED_WIDGETS = {
    "bazarr",
    "pihole",
    "prowlarr",
    "qbittorrent",
    "radarr",
    "seerr",
    "sonarr",
    "tautulli",
}
