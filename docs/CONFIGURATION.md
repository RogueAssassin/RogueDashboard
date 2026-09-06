# Configuration

Runtime configuration is supplied through `.env`. Keep that file private; integration credentials and the Discord webhook are server-side secrets.

## Core

| Variable | Default | Purpose |
| --- | --- | --- |
| `RGDASH_IMAGE` | testing image | GHCR image/tag to run |
| `RGDASH_PORT` | `7805` | host web port |
| `MEDIA_NETWORK` | `media-net` | external shared container network |
| `TZ` | `Australia/Melbourne` in example | display/runtime timezone |
| `SECURE_COOKIES` | `false` | enable when public access is HTTPS |
| `RGDASH_TRUST_PROXY_HEADERS` | `true` | trust controlled reverse-proxy headers |
| `RGDASH_ALLOWED_HOSTS` | blank | optional allowed host list |
| `RGDASH_ROGUEROUTE_URL` | blank | optional public RogueRoute GPX URL |

## Monitoring

```env
RGDASH_MONITOR_INTERVAL=30
RGDASH_MONITOR_FAILURE_THRESHOLD=3
RGDASH_MONITOR_RETENTION_HOURS=720
```

Monitoring runs inside the RogueDashboard process even with every browser closed.

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

## Native integration credentials

```env
RGDASH_QBITTORRENT_API_KEY=
RGDASH_QBITTORRENT_USERNAME=
RGDASH_QBITTORRENT_PASSWORD=
RGDASH_PROWLARR_KEY=
RGDASH_RADARR_KEY=
RGDASH_SONARR_KEY=
RGDASH_SEERR_KEY=
RGDASH_BAZARR_KEY=
RGDASH_TAUTULLI_KEY=
RGDASH_PIHOLE_KEY=
RGDASH_NPM_TOKEN=
```

RogueForge and RogueMediaValidator use read-only endpoints and do not require administrator credentials in RogueDashboard.

## Persistence

- `./data` stores SQLite state, users, dashboard configuration, health samples, incidents and notification history.
- `./custom` stores optional local icons and backgrounds.
- `.env` stores runtime settings and secrets.

Back up all three before upgrades.
