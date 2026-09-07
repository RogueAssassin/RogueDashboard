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

## Persistence

Keep these across updates:

```text
.env
data/
custom/
```

`data/` contains users, dashboard configuration, health history, incidents and notification history.
