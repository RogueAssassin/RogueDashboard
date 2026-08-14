# Changelog

Rogue Dashboard follows semantic versioning for published container tags. Detailed upgrade notes live in `docs/`.

## 1.1.0

- Added first-class Docker and Podman engine detection with capability probing.
- Added native Podman API socket support using `/run/podman/podman.sock` without a Docker socket compatibility symlink.
- Added engine-neutral `CONTAINER_ENGINE`, `CONTAINER_SOCKET`, and `CONTAINER_AGENT_*` settings while retaining legacy `DOCKER_*` aliases for upgrades.
- Added `compose.podman.yaml` for Podman-native deployment.
- Kept the existing restricted agent boundary for container list, stats and lifecycle actions.
- Updated runtime image metadata and documentation for Docker + Podman deployments.
- Refreshed the complete documentation set for dual-engine deployment and added coordinated Rogue Dashboard / RogueForge branding assets.
- Updated remaining user-facing Docker-only setup wording to engine-neutral container terminology.

See [the 1.1.0 release notes](docs/RELEASE_1.1.0.md).

## 1.0.1

- Made native Docker health authoritative for container-backed cards while retaining private endpoint diagnostics.
- Migrated RogueRoute OSRM cards from the generic OSRM root path to `/api/health/osrm` on the RogueRoute Web container.
- Automatically attaches the dashboard to an existing `rogueroute-gpx` network when no other extra network is configured.
- Added health source, container state and probe detail to the health API and UI tooltips.
- Updated Docker discovery so healthy, starting and unhealthy containers are displayed accurately.
- Updated the GitHub Actions checkout major and expanded regression coverage for health-state handling.

See [the 1.0.1 release notes](docs/RELEASE_1.0.1.md).

## 1.0.0

- Added active administrator-session review and protected revocation.
- Added a bounded, local administrative action history for login, logout, dashboard saves and Docker actions.
- Added automatic in-place migration for pre-1.0 session tables.
- Published a support matrix, migration policy and complete deployment guide.

See [the 1.0.0 release notes](docs/RELEASE_1.0.0.md).
