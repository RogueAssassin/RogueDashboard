<div align="center">

<img src="https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/app/static/icons/roguedashboard-approved-128.png" width="128" height="128" alt="RogueDashboard logo">

# RogueDashboard

**Local-first service monitoring, uptime, incidents and notifications for Docker and Podman environments.**

[![Release](https://img.shields.io/badge/RELEASE-2.0.0%20TESTING-8b5cf6?style=for-the-badge&labelColor=45464d)](https://github.com/RogueAssassin/RogueDashboard/tree/testing)
[![Build](https://img.shields.io/github/actions/workflow/status/RogueAssassin/RogueDashboard/ci.yml?branch=testing&style=for-the-badge&label=BUILD&labelColor=45464d)](https://github.com/RogueAssassin/RogueDashboard/actions/workflows/ci.yml?query=branch%3Atesting)
![Engine](https://img.shields.io/badge/ENGINE-DOCKER%20%7C%20PODMAN-00cbe6?style=for-the-badge&labelColor=45464d)
![Platform](https://img.shields.io/badge/PLATFORM-AMD64%20%7C%20ARM64-42d6a4?style=for-the-badge&labelColor=45464d)

</div>

RogueDashboard is the visibility and monitoring layer for the Rogue media-server stack. It runs as one unprivileged container, keeps monitoring when no browser is open, persists uptime/incidents in SQLite, and can send Discord outage/recovery notifications without mounting a Docker or Podman socket.

RogueDashboard deliberately stays separate from **RogueForge**, which owns container/stack management and logs.

## Highlights

- always-on health monitoring with browser closed
- DEGRADED, DOWN and RECOVERED lifecycle
- persistent SQLite health history and incidents
- 1h, 24h, 7d and 30d availability windows
- Discord webhook notifications with retry, cooldown and delivery history
- maintenance mode and per-service alert silencing
- fully editable pages, sections and cards through **Customise**
- native integrations for media services and Rogue applications
- one unified `compose.yaml` for Docker and Podman
- read-only root filesystem, dropped capabilities and no engine socket
- amd64 and arm64 testing images

## 2.0.0 Rogue ecosystem monitoring platform

RogueDashboard 2.0.0 is the testing baseline for the first stable Rogue ecosystem monitoring contract. Customise → Connect retains the **Migration readiness** panel and now presents the same explicit Rogue ecosystem responsibility model used by RogueForge. RogueDashboard checks its own persisted evidence before recommending Uptime Kuma removal:

- background monitor freshness
- 7+ days of retained/observed health history
- at least one real resolved outage
- Discord webhook connectivity
- successful DOWN and RECOVERED deliveries
- maintenance suppression test
- per-service silence test

Restart/reboot persistence and RogueForge logging remain manual validation gates because RogueDashboard cannot safely prove those from inside its own container.

Uptime Kuma remains available as a migration-only integration until these gates pass.

## Rogue ecosystem

| Service | What it does |
| --- | --- |
| **RogueDashboard** | Lightweight media-server visibility, health, uptime, incidents, Discord alerts and service overview. |
| **RogueForge** | Docker/Podman stack management, verified updates, live logs, terminals and operational troubleshooting. |
| **RogueMediaValidator** | Torrent/media validation and protection, including policy enforcement and diagnostics. |
| **RogueRoute-GPX** | Routing and GPX services for route generation, processing and mapping workflows. |

RogueDashboard integrates with these applications through safe HTTP/read-only endpoints and does not gain container-engine privileges.

## Supported live integrations

RogueDashboard includes native collectors or health support for:

```text
qBittorrent
Prowlarr
Radarr
Sonarr
Seerr
Bazarr
Tautulli
Pi-hole
Nginx Proxy Manager
Uptime Kuma (migration compatibility)
RogueForge
RogueMediaValidator
RogueRoute GPX / OSRM / Manager
Custom JSON API
```

Uptime Kuma remains available only during the migration period. RogueDashboard already owns browser-closed uptime, incidents and Discord alerting.

## Customise

Authenticated administrators can manage the dashboard without editing JSON or SQLite:

- dashboard title and subtitle
- appearance, density, accents and backgrounds
- show/hide header, search, page tabs, statistics and footer
- page titles
- section titles
- cards per row
- move sections between pages
- show/hide sections
- card title, description, icon and URL
- health endpoint and integration
- Discord alert enable/disable per service
- card visibility and 1–3 column span
- move cards between sections
- unsaved-change protection

## Quick install — Podman

```bash
sudo mkdir -p /opt/media-server/roguedashboard/{data,custom/backgrounds,custom/icons}
sudo chown -R 10001:10001 /opt/media-server/roguedashboard/data
cd /opt/media-server/roguedashboard

curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/compose.yaml -o compose.yaml
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/.env.example -o .env

podman network inspect media-net >/dev/null 2>&1 || podman network create media-net
podman compose --env-file .env -f compose.yaml pull
podman compose --env-file .env -f compose.yaml up -d
```

Open:

```text
http://HOST:7805
```

For a stable/main release, use the `main` branch files and the stable image tag instead of `testing`.

## Quick install — Docker

```bash
sudo mkdir -p /opt/roguedashboard/{data,custom/backgrounds,custom/icons}
sudo chown -R 10001:10001 /opt/roguedashboard/data
cd /opt/roguedashboard

curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/compose.yaml -o compose.yaml
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/.env.example -o .env

docker network inspect media-net >/dev/null 2>&1 || docker network create media-net
docker compose --env-file .env -f compose.yaml pull
docker compose --env-file .env -f compose.yaml up -d
```

Open:

```text
http://HOST:7805
```

## Discord setup

Create a webhook in the Discord channel that should receive RogueDashboard alerts, then add it to `.env`:

```env
RGDASH_DISCORD_ENABLED=true
RGDASH_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
RGDASH_DISCORD_NOTIFY_DOWN=true
RGDASH_DISCORD_NOTIFY_RECOVERY=true
RGDASH_DISCORD_NOTIFY_DEGRADED=false
```

Recreate the container, then open **Customise → Connect → Send Discord test**.

## Persistent files

Keep these between upgrades:

```text
.env
data/
custom/
```

`data/` contains SQLite state including users, dashboard configuration, health samples, incidents and notification history.

## Updating

Podman:

```bash
cd /opt/media-server/roguedashboard
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/compose.yaml -o compose.yaml
podman compose --env-file .env -f compose.yaml pull
podman compose --env-file .env -f compose.yaml up -d
```

Docker:

```bash
cd /opt/roguedashboard
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/compose.yaml -o compose.yaml
docker compose --env-file .env -f compose.yaml pull
docker compose --env-file .env -f compose.yaml up -d
```

Do not replace an existing `.env` with `.env.example`; compare new variables and merge them.

## Documentation

- [Installation](docs/INSTALLATION.md)
- [Configuration](docs/CONFIGURATION.md)
- [Upgrading](docs/UPGRADING.md)
- [Reverse proxy](docs/REVERSE_PROXY.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Security](docs/SECURITY.md)
- [Support matrix](docs/SUPPORT.md)
- [Testing channel](docs/TESTING.md)
- [Migrations](docs/MIGRATIONS.md)
- [Roadmap to v2.0.0](docs/ROADMAP.md)
- [Changelog](CHANGELOG.md)

## Security model

RogueDashboard:

- runs as an unprivileged user
- uses a read-only root filesystem
- drops Linux capabilities
- uses `no-new-privileges`
- does not mount Docker/Podman sockets
- keeps integration credentials and Discord webhook URLs server-side

Container lifecycle and log access remain in RogueForge.

## Testing images

```text
ghcr.io/rogueassassin/roguedashboard:testing
ghcr.io/rogueassassin/roguedashboard:2.0.0-testing
```

The testing branch is promoted only after CI and live-host validation pass.
