# Changelog

RogueDashboard follows semantic versioning for published GHCR releases.

## 1.2.0

- Standardized product naming from **Rogue Dashboard** to **RogueDashboard**.
- Standardized the canonical internal container/network identity as `roguedashboard`.
- Replaced separate Docker and Podman compose files with a single engine-neutral `compose.yaml`.
- Standardized the GHCR image path as `ghcr.io/rogueassassin/roguedashboard`.
- Retained the existing `RGDASH_*` environment-variable contract for compatibility with 1.1.3 installations.
- Added the legacy `rogue-dashboard` network alias as a transition compatibility alias.
- Kept the proven 1.1.3 socket-free architecture; container and stack management remains owned by RogueForge.
- Prepared RogueForge-style remote-first branding and image resolution with local `/custom` overrides.
- Updated documentation and deployment examples for the renamed GitHub repository and runtime folder.

## 1.1.3

- Removed direct Docker and Podman container-engine management from RogueDashboard.
- Removed the engine-agent service and all engine socket mounts.
- Removed container lifecycle controls and engine inventory APIs.
- Simplified Docker and Podman deployments to one RogueDashboard container.
- Retained service integrations, HTTP/API health monitoring, widgets, admin/session controls and persistent configuration.
- Kept synchronized RogueDashboard branding and browser/app icon assets.
- Simplified server upgrades to Compose `pull` + `up -d`.
- Established RogueForge as the home for container/stack management.

## 1.1.2

- Introduced synchronized Rogue branding and browser/app icon assets.
- Added Docker/Podman engine abstraction work that was later removed in 1.1.3 after production testing showed the management layer added unnecessary deployment complexity.

## 1.1.0

- Added first-class Docker and Podman experiments and engine-neutral configuration.

## 1.0.1

- Improved container health and RogueRoute integration.

## 1.0.0

- Initial stable public release series.
