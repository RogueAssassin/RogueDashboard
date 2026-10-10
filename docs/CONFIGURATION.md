# Configuration

RogueDashboard runtime settings live in `.env`. The supplied `.env.example` is the authoritative template and explains every option.

Keep `.env` private because it can contain API credentials and a Discord webhook.

## Deployment

Common settings:

```env
RGDASH_INSTALL_DIR=/opt/media-server/roguedashboard
RGDASH_DATA_DIR=/opt/media-server/roguedashboard/data
RGDASH_CUSTOM_DIR=/opt/media-server/roguedashboard/custom
RGDASH_PORT=7805
RGDASH_RUNTIME=auto
MEDIA_NETWORK=media-net
TZ=Australia/Melbourne
```

`RGDASH_RUNTIME=auto` lets the updater detect Docker or Podman. Set it explicitly to `docker` or `podman` only when needed.

`RGDASH_DATA_DIR` and `RGDASH_CUSTOM_DIR` are informational: `compose.yaml` always mounts `./data` and `./custom` next to itself.

## Container hardening and Podman

```env
RGDASH_BIND=0.0.0.0              # 127.0.0.1 when only a local reverse proxy connects
RGDASH_DATA_MOUNT_OPTS=          # Podman: ,U   SELinux: ,Z   (empty on Docker)
RGDASH_CUSTOM_MOUNT_OPTS=        # SELinux: ,Z
RGDASH_PULL_POLICY=missing
RGDASH_MEM_LIMIT=256m
RGDASH_PIDS_LIMIT=256
```

## Backups and self-recovery

```env
RGDASH_BACKUP_INTERVAL_HOURS=24  # 0 disables scheduled backups (data/backups/)
RGDASH_BACKUP_KEEP=7
RGDASH_WATCHDOG_SECONDS=900      # exit for restart if monitoring makes no progress; 0 disables
```

Blank or invalid numeric values fall back to their defaults instead of stopping the container.

## Monitoring

```env
RGDASH_MONITOR_INTERVAL=30
RGDASH_MONITOR_FAILURE_THRESHOLD=3
RGDASH_MONITOR_RETENTION_HOURS=720
```

Monitoring runs server-side and continues when every browser is closed.

## Discord

```env
RGDASH_DISCORD_ENABLED=false
RGDASH_DISCORD_WEBHOOK_URL=
RGDASH_DISCORD_NOTIFY_DOWN=true
RGDASH_DISCORD_NOTIFY_RECOVERY=true
RGDASH_DISCORD_NOTIFY_DEGRADED=false
RGDASH_DISCORD_COOLDOWN_SECONDS=300
RGDASH_DISCORD_RETRY_ATTEMPTS=3
RGDASH_DISCORD_MIN_OUTAGE_SECONDS=0
```

Use **Customise → Connect → Send Discord test** after enabling the webhook.

## Integration credentials

Credentials for qBittorrent, Prowlarr, Radarr, Sonarr, Seerr, Bazarr, Tautulli, Pi-hole and Nginx Proxy Manager use the documented `RGDASH_*` variables in `.env`.

RogueForge and RogueMediaValidator use safe read-only status endpoints and do not require their administrator credentials.

## Host allow-list

`RGDASH_ALLOWED_HOSTS` is a comma-separated Host-header allow-list. **Blank disables host checking.** When set, `localhost`, `127.0.0.1` and the container aliases stay allowed.

## Persistence

Keep these across updates:

```text
.env
data/
custom/
```

`data/` contains users, dashboard configuration, health history, incidents and notification history.
