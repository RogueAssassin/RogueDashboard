# Installation

Rogue Dashboard 1.1.2 uses GHCR images. A server does not require a Git checkout.

## Podman

1. Create `data/` and `custom/`.
2. Download `compose.podman.yaml` and `.env.example`; save the latter as `.env`.
3. Set a long random `CONTAINER_AGENT_TOKEN`.
4. Enable the rootful Podman API socket when using the rootful manifest.
5. Ensure the external `${MEDIA_NETWORK:-media-net}` network exists.
6. Set `data/` ownership to UID/GID `10001:10001`.
7. Run `sudo podman-compose --env-file .env -f compose.podman.yaml pull` followed by `up -d`.

## Docker

Download `docker-compose.yaml` and `.env.example`, create the external media network, then run `docker compose --env-file .env -f docker-compose.yaml pull` and `up -d`.

Never mount an engine socket into the `dashboard` service. Only `engine-agent` receives it.
