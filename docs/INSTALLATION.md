# Installation

RogueDashboard runs as one unprivileged container and uses the same `compose.yaml` with Docker Compose or Podman Compose. No Docker or Podman socket is required.

## Requirements

- Linux or WSL 2
- Docker + Compose v2, or Podman + a Compose provider
- an external network such as `media-net`
- host port `7805` available, or another `RGDASH_PORT`

The container runs as UID/GID `10001:10001`.

Docker: `sudo chown -R 10001:10001 data`. Rootless Podman: see [Rootless Podman](#rootless-podman) below — a plain `chown 10001` is **not** correct there.

## Install directory

```text
/opt/media-server/roguedashboard/
├── compose.yaml
├── update.sh
├── .env
├── data/
└── custom/
    ├── backgrounds/
    └── icons/
```

Create it:

```bash
sudo mkdir -p /opt/media-server/roguedashboard/{data,custom/backgrounds,custom/icons}
sudo chown -R 10001:10001 /opt/media-server/roguedashboard/data
cd /opt/media-server/roguedashboard
```

Download the deployment files from the branch you want to run:

```bash
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/compose.yaml -o compose.yaml
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/.env.example -o .env
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/update.sh -o update.sh
chmod 600 .env
chmod +x update.sh
nano .env
```

For stable production after release, use `main` instead of `testing`.

## Start with Podman

```bash
podman network inspect media-net >/dev/null 2>&1 || podman network create media-net
podman compose --env-file .env -f compose.yaml pull
podman compose --env-file .env -f compose.yaml up -d
```

## Start with Docker

```bash
docker network inspect media-net >/dev/null 2>&1 || docker network create media-net
docker compose --env-file .env -f compose.yaml pull
docker compose --env-file .env -f compose.yaml up -d
```

Open `http://HOST:7805` and complete administrator setup.

## Rootless Podman

1. Own `data/` through the user namespace so the container user can write to it:

   ```bash
   podman unshare chown -R 10001:10001 /opt/media-server/roguedashboard/data
   ```

   Alternatively set `RGDASH_DATA_MOUNT_OPTS=,U` in `.env` and Podman does this for you at start-up.
2. On SELinux hosts add `Z` to the mount options so the container may read and write the directories:

   ```env
   RGDASH_DATA_MOUNT_OPTS=,U,Z
   RGDASH_CUSTOM_MOUNT_OPTS=,Z
   ```

   Never put `U` on the custom mount; it would change ownership of your own files.
3. Start on boot. Rootless containers only start at boot when lingering is enabled:

   ```bash
   loginctl enable-linger "$USER"
   systemctl --user enable --now podman-restart.service
   ```

   Restart-policy handling by `podman-restart.service` differs between Podman releases. For the most
   dependable start-up use a Quadlet unit (example below).

### Quadlet example (untested template — adjust to your Podman version)

`~/.config/containers/systemd/roguedashboard.container`:

```ini
[Unit]
Description=RogueDashboard
After=network-online.target

[Container]
Image=ghcr.io/rogueassassin/roguedashboard:latest
ContainerName=roguedashboard
EnvironmentFile=/opt/media-server/roguedashboard/.env
Network=media-net
PublishPort=7805:8080
Volume=/opt/media-server/roguedashboard/data:/data:U,Z
Volume=/opt/media-server/roguedashboard/custom:/custom:ro,Z
ReadOnly=true
Tmpfs=/tmp:size=32m
DropCapability=ALL
NoNewPrivileges=true
HealthCmd=python /app/dashboard.py healthcheck
HealthInterval=30s
HealthTimeout=5s
HealthRetries=3

[Service]
Restart=always

[Install]
WantedBy=default.target
```

## Health, backups and recovery

- `/api/ping` returns `503` when the background monitor has stopped completing cycles, so the container
  healthcheck reflects real health. Docker does not restart an *unhealthy* container by itself; the built-in
  watchdog (`RGDASH_WATCHDOG_SECONDS`) exits the process if monitoring hangs so `restart: unless-stopped` recovers it.
- Consistent SQLite backups are written to `data/backups/` (`RGDASH_BACKUP_INTERVAL_HOURS`, `RGDASH_BACKUP_KEEP`).
  Run one on demand with `docker exec roguedashboard python /app/dashboard.py backup`.
- SQLite WAL mode needs a local filesystem. Do not place `data/` on NFS or SMB.
- Forgot the administrator password?
  `docker exec -it roguedashboard python /app/dashboard.py reset-password` (all sessions are signed out).
  Use `podman exec -it …` on Podman. For scripts, set `RGDASH_NEW_PASSWORD`.

## Shared media network

RogueDashboard and services addressed by container name must share the same external network. The default is:

```env
MEDIA_NETWORK=media-net
```

For example, a Sonarr health URL can then use `http://sonarr:8989`.

## Verify

```bash
curl -fsS http://127.0.0.1:7805/api/ping
```

Podman logs:

```bash
podman logs --tail 100 roguedashboard
```

Docker logs:

```bash
docker logs --tail 100 roguedashboard
```
