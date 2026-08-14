# Configuration

The supported runtime configuration lives in `.env`.

Core settings:

- `RGDASH_IMAGE` — GHCR tag, recommended `ghcr.io/rogueassassin/rogue-dashboard:1.1.3`.
- `RGDASH_PORT` — host web port, default 7805.
- `MEDIA_NETWORK` — external shared proxy/application network, default `media-net`.
- `CONTAINER_AGENT_TOKEN` — required private shared secret between dashboard and agent.
- `SECURE_COOKIES`, `RGDASH_TRUST_PROXY_HEADERS`, `RGDASH_ALLOWED_HOSTS` — web security/proxy settings.
- `RGDASH_*_KEY` and qBittorrent credentials — optional service integrations.

Docker/Podman socket paths are defined in their respective Compose files and are intentionally isolated to `engine-agent`.
