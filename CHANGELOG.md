# Changelog

Rogue Dashboard follows semantic versioning for published GHCR releases.

## 1.1.3

- Removed direct Docker and Podman container-engine management from Rogue Dashboard.
- Removed the engine-agent service and all engine socket mounts.
- Removed container lifecycle controls and engine inventory APIs.
- Simplified Docker and Podman deployments to one Rogue Dashboard container.
- Retained service integrations, HTTP/API health monitoring, widgets, admin/session controls and persistent configuration.
- Kept the synchronized Rogue Dashboard branding and browser/app icon set.
- Simplified server upgrades to Compose `pull` + `up -d`.
- Established RogueForge as the future home for container/stack management.

## 1.1.2

- Introduced synchronized Rogue branding and browser/app icon assets.
- Added Docker/Podman engine abstraction work that was later removed in 1.1.3 after production testing showed the management layer added unnecessary deployment complexity.

## 1.1.0

- Added first-class Docker and Podman experiments and engine-neutral configuration.

## 1.0.1

- Improved container health and RogueRoute integration.

## 1.0.0

- Initial stable public release series.
