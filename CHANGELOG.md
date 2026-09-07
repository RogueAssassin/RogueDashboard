# Changelog

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
