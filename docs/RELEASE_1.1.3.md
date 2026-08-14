# Rogue Dashboard 1.1.3

Rogue Dashboard 1.1.3 is the **Dashboard-only stability release**.

## Direction

Direct Docker/Podman container management has been removed from Rogue Dashboard after live production testing. Rogue Dashboard now focuses on service monitoring and integrations, while container/stack management moves to RogueForge.

## Removed

- engine-agent service
- Docker and Podman socket mounts
- container inventory API
- container start/stop/restart actions
- engine version/socket detection UI
- engine-specific Admin controls

## Retained

- service health and widget monitoring
- qBittorrent, Prowlarr, Radarr, Sonarr, Bazarr, Seerr, Tautulli and other integrations
- RogueRoute health integrations
- dashboard pages and layout
- authentication, sessions and audit history
- SQLite persistence
- custom icons/backgrounds
- reverse-proxy support
- synchronized Rogue Dashboard branding

## Deployment

Production hosts use the GHCR image plus `.env` and one engine-specific Compose manifest. No Git checkout is required.
