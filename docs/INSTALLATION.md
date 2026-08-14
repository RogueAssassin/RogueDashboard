# Installation

Rogue Dashboard 1.1.3 is distributed through GHCR and runs as a single web container.

## Podman

Use `compose.podman.yaml`. Create `data/` and `custom/`, download `.env.example` as `.env`, ensure the external `media-net` network exists, and set `data/` ownership to UID/GID `10001:10001`.

```bash
sudo podman-compose --env-file .env -f compose.podman.yaml pull
sudo podman-compose --env-file .env -f compose.podman.yaml up -d
```

No Podman API socket is mounted.

## Docker

Use `docker-compose.yaml` with the same `.env`, `data/` and `custom/` layout.

No Docker socket is mounted.
