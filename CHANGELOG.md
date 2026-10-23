# Changelog

## 2.3.0

- Merged the testing line into main on top of the 2.0.1 stability release.
- Service icons now load from [dashboard-icons](https://github.com/homarr-labs/dashboard-icons) (`RGDASH_ICON_CDN`, blank keeps icons local), with a light GitHub mark on dark themes and the bundled copies as fallback. Services without a built-in mapping try their dashboard-icons slug, and icons that fail to load are not requested again on each refresh. RogueForge and RogueRoute keep their bundled icons until they are published there.
- Faster renders: the bootstrap lists local `/custom/icons` overrides, so the browser no longer requests a missing override (a 404) for every service icon on each 30 s refresh.

## 2.0.1

Stability release.

- Fixed: a service that closed the connection without replying aborted the whole monitoring cycle, so the failing service never reached DOWN and no alert was sent. Every probe error is now contained.
- Fixed: one transient database error permanently stopped the background monitor while the UI and healthcheck still looked healthy. The loop now survives errors, `/api/ping` returns 503 when monitoring stalls, and an optional watchdog restarts a hung process.
- Fixed: `/api/history` loaded every health sample into memory (about 22 s and 720 MB for 30 services at 30 days). It now uses SQL aggregation on a read-only connection with caching (about 3 s cold, instant cached).
- Fixed: SIGTERM was ignored by PID 1, so every stop waited for SIGKILL. The server now shuts down gracefully and checkpoints the WAL.
- Fixed: endpoints without an HTTP(S) monitor URL could be recorded as outages.
- Fixed: background and request-triggered monitor runs could race and double-count failures.
- Fixed: login throttling locked out every user behind a reverse proxy; it now uses the real client address and counts attempts before hashing.
- Added: scheduled consistent SQLite backups (`data/backups/`), `backup` and `reset-password` commands.
- Added: request timeouts, bounded connections, JSON 500 handling, quieter access logs, Discord delivery on a worker thread, widget refresh without a global lock.
- Added: rootless Podman and SELinux mount options, `RGDASH_BIND`, memory/pids limits, log rotation, `compose.override.yaml` support.
- Improved: `update.sh` pulls before changing configuration, backs up the database, keeps backups outside `/tmp`, shows compose changes, locks against concurrent runs and rolls back automatically on a failed health check.
- Improved: qBittorrent supports large libraries; Radarr/Sonarr library sizes are cached; blank or invalid numeric settings no longer crash start-up.
- CI: smoke-tests the built image, derives the version from the source, and sets up QEMU for the stable arm64 build.

## 2.0.0

- Established the RogueDashboard 2.x monitoring platform.
- Standardised the canonical deployment, container and GHCR identity on `roguedashboard`.
- Aligned the Rogue ecosystem presentation and documented `.env` style with RogueForge.
- Added the RogueForge-style `update.sh` workflow for production, testing and pinned-version updates.
- Added browser-closed monitoring, persistent uptime/incidents and Discord DOWN/RECOVERED delivery.
- Added migration readiness for retiring duplicate Uptime Kuma monitoring after live validation.
- Kept Docker and rootless Podman first-class through one `compose.yaml`.
- Testing validation image: `ghcr.io/rogueassassin/roguedashboard:2.0.0-testing`.

## 1.9.0

- Added evidence-based monitoring and notification readiness checks.
- Added persistent incident/availability validation and Uptime Kuma replacement gates.

## 1.8.1

- Hardened Docker/Podman deployment, Customise layout and release documentation.

## 1.8.0

- Added RogueMediaValidator and expanded Rogue ecosystem integration.

## 1.7.1

- Refined Customise section layout and notification delivery history.

## 1.7.0

- Added Discord delivery controls, retries, cooldowns and optional DEGRADED alerts.

## 1.6.0

- Added persistent incidents, availability windows, maintenance mode and service silencing.

## 1.5.0

- Expanded Customise with dashboard, page, section and card layout controls.

## 1.4.1

- Added always-on SQLite monitoring and browser-closed Discord notifications.

## 1.4.0

- Added richer health, runtime and integration monitoring.

## 1.3.5

- Refined branding, Customise, authentication and responsive layout.

## 1.3.0

- Established the socket-free RogueDashboard architecture and RogueForge integration.

## 1.2.1

- Refined runtime presentation and Rogue ecosystem branding.

## 1.2.0

- Standardised the `roguedashboard` runtime and GHCR identity.

## 1.1.3

- Removed direct Docker/Podman management and delegated container operations to RogueForge.

## 1.1.2

- Added synchronised Rogue branding and early engine-neutral work.

## 1.1.0

- Added initial Docker and Podman engine-neutral deployment work.

## 1.0.1

- Improved container health and RogueRoute integration.

## 1.0.0

- Initial stable public release.
