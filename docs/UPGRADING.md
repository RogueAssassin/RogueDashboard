# Upgrading and recovery

Rogue Dashboard upgrades are image-based. Production hosts do not need a Git checkout or upgrade script.

## Preserve state

Before an upgrade, back up:

```text
.env
data/
custom/
```

Do not delete persistent data or replace a populated `.env` during a normal upgrade.

## Refresh the compose manifest

If the release notes mention compose changes, re-download the engine-specific manifest before pulling the image.

Podman:

```bash
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/rogue-dashboard/main/compose.podman.yaml -o compose.podman.yaml
```

Docker:

```bash
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/rogue-dashboard/main/docker-compose.yaml -o docker-compose.yaml
```

## Podman update

```bash
sudo podman-compose --env-file .env -f compose.podman.yaml pull
sudo podman-compose --env-file .env -f compose.podman.yaml up -d
```

Verify:

```bash
sudo podman ps --filter name=rogue-dashboard
sudo podman logs --tail=100 rogue-dashboard-agent
sudo podman logs --tail=100 rogue-dashboard
```

## Docker update

```bash
docker compose --env-file .env -f docker-compose.yaml pull
docker compose --env-file .env -f docker-compose.yaml up -d
```

## Pinning and rollback

Pin an exact GHCR image in `.env` when testing or rolling back:

```dotenv
RGDASH_IMAGE=ghcr.io/rogueassassin/rogue-dashboard:1.1.0
```

To roll back, restore the last known-good `.env`, `data/` and `custom/`, set `RGDASH_IMAGE` to the previous release, then run the same `pull` and `up -d` commands.

## Podman socket rule

Podman-only hosts should use `/run/podman/podman.sock` directly in the restricted engine agent. Do not create `/var/run/docker.sock` compatibility links for Rogue Dashboard.
