# Upgrading and recovery

## Preserve state

Never replace a populated `.env`, delete `data/`, delete `custom/`, or use a volume-destructive compose command during a normal upgrade.

Pin 1.1.0 when testing:

```dotenv
RGDASH_IMAGE=ghcr.io/rogueassassin/rogue-dashboard:1.1.0
```

## Docker

```bash
docker compose pull
docker compose up -d
```

## Podman

```bash
podman-compose --env-file .env -f compose.podman.yaml pull
podman-compose --env-file .env -f compose.podman.yaml up -d
```

Podman migrations should use `/run/podman/podman.sock` directly rather than `/var/run/docker.sock` compatibility links.

## Recovery

Before an upgrade, back up `.env`, `data/` and `custom/`. If a replacement fails, restore those files and redeploy the last known-good image/compose definition.

For server deployments, validate the compose file before changing the running stack and verify both `rogue-dashboard` and `rogue-dashboard-agent` after startup.
