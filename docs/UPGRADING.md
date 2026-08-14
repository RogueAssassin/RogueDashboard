# Upgrading

Back up `.env`, `data/` and `custom/` before an upgrade.

Podman:

```bash
sudo podman-compose --env-file .env -f compose.podman.yaml pull
sudo podman-compose --env-file .env -f compose.podman.yaml up -d
```

Docker:

```bash
docker compose --env-file .env -f docker-compose.yaml pull
docker compose --env-file .env -f docker-compose.yaml up -d
```

No Git checkout, build step, install script or migration script is required on the production host.
