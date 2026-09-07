<div align="center">

<img src="https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/app/static/icons/roguedashboard-approved-128.png" width="128" height="128" alt="RogueDashboard logo">

# RogueDashboard

**Local-first service monitoring, uptime, incidents and Discord notifications for Docker and Podman environments.**

[![Release](https://img.shields.io/badge/RELEASE-2.0.0%20TESTING-8b5cf6?style=for-the-badge&labelColor=45464d)](https://github.com/RogueAssassin/RogueDashboard/tree/testing)
[![Build](https://img.shields.io/github/actions/workflow/status/RogueAssassin/RogueDashboard/ci.yml?branch=testing&style=for-the-badge&label=BUILD&labelColor=45464d)](https://github.com/RogueAssassin/RogueDashboard/actions/workflows/ci.yml?query=branch%3Atesting)
![Engine](https://img.shields.io/badge/ENGINE-DOCKER%20%7C%20PODMAN-00cbe6?style=for-the-badge&labelColor=45464d)
![Platform](https://img.shields.io/badge/PLATFORM-AMD64%20%7C%20ARM64-42d6a4?style=for-the-badge&labelColor=45464d)

</div>

RogueDashboard is the monitoring and visibility layer for a media-server stack. It runs as a lightweight unprivileged container, checks services even when no browser is open, stores uptime and incident history in SQLite, and can send Discord DOWN/RECOVERED notifications.

It deliberately stays separate from [**RogueForge**](https://github.com/RogueAssassin/RogueForge), which owns Docker/Podman management, updates and logs. RogueDashboard does **not** need an engine socket.

## Highlights

- always-on monitoring with the browser closed
- DEGRADED, DOWN and RECOVERED incident lifecycle
- persistent uptime, health history and incidents
- 1h, 24h, 7d and 30d availability windows
- Discord notifications with retry, cooldown and delivery history
- maintenance mode and per-service alert silencing
- editable pages, sections, card layout, titles, icons and appearance
- native media-service and Rogue ecosystem integrations
- one `compose.yaml` for Docker and Podman
- read-only root filesystem, dropped capabilities and no engine socket
- amd64 and arm64 container images

## Rogue ecosystem

| Service | What it does |
| --- | --- |
| **RogueDashboard** | Lightweight service visibility, health, uptime, incidents, Discord alerts and dashboard customisation. |
| [**RogueForge**](https://github.com/RogueAssassin/RogueForge) | Docker/Podman stack management, verified updates, live logs, terminals and troubleshooting. |
| [**RogueMediaValidator**](https://github.com/RogueAssassin/RogueMediaValidator) | Torrent/media validation and protection, including policy enforcement and diagnostics. |
| [**RogueRoute-GPX**](https://github.com/RogueAssassin/RogueRoute-GPX) | Routing and GPX services for route generation, processing and mapping workflows. |

The Rogue applications are intentionally separated by responsibility. RogueDashboard can read safe status information from the other services without receiving container-engine privileges or their administrator credentials.

## 2.0.0 testing

2.0.0 is the testing baseline for RogueDashboard's first 2.x monitoring contract.

- canonical deployment name and directory are now `roguedashboard` and `/opt/media-server/roguedashboard`
- `.env.example` follows the same documented layout and revision policy as RogueForge
- Customise → Connect includes Rogue ecosystem responsibilities and migration readiness
- browser-closed monitoring, SQLite history and Discord incident delivery remain server-side
- Docker and rootless Podman remain first-class
- Uptime Kuma support is migration-only while replacement validation is completed
- RogueForge remains responsible for logs and container operations

## Default layout

```text
/opt/media-server/
├── roguedashboard/
│   ├── compose.yaml
│   ├── .env
│   ├── data/
│   └── custom/
│       ├── backgrounds/
│       └── icons/
├── rogueforge/
├── roguemediavalidator/
├── rogueroute-gpx/
├── radarr/
├── sonarr/
└── ...
```

Persistent state belongs in `data/`. Optional custom icons and backgrounds belong in `custom/`.

## Quick install — Podman

```bash
sudo mkdir -p /opt/media-server/roguedashboard/{data,custom/backgrounds,custom/icons}
sudo chown -R 10001:10001 /opt/media-server/roguedashboard/data
cd /opt/media-server/roguedashboard

curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/compose.yaml -o compose.yaml
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/.env.example -o .env
chmod 600 .env

nano .env

podman network inspect media-net >/dev/null 2>&1 || podman network create media-net
podman compose --env-file .env -f compose.yaml pull
podman compose --env-file .env -f compose.yaml up -d
```

Open `http://HOST:7805`, create the administrator account on first launch, then use **Customise** to configure the dashboard.

## Quick install — Docker

```bash
sudo mkdir -p /opt/media-server/roguedashboard/{data,custom/backgrounds,custom/icons}
sudo chown -R 10001:10001 /opt/media-server/roguedashboard/data
cd /opt/media-server/roguedashboard

curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/compose.yaml -o compose.yaml
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/.env.example -o .env
chmod 600 .env

nano .env

docker network inspect media-net >/dev/null 2>&1 || docker network create media-net
docker compose --env-file .env -f compose.yaml pull
docker compose --env-file .env -f compose.yaml up -d
```

Open `http://HOST:7805` and complete first-run setup.

The supplied `.env.example` explains every supported deployment, monitoring, integration and Discord setting. Keep your populated `.env` private.

## Supported integrations

Native collectors or health support are available for qBittorrent, Prowlarr, Radarr, Sonarr, Seerr, Bazarr, Tautulli, Pi-hole, Nginx Proxy Manager, RogueForge, RogueMediaValidator, RogueRoute-GPX/OSRM/Manager and custom JSON APIs.

Uptime Kuma remains available only for migration compatibility while RogueDashboard's replacement coverage is validated.

## Discord notifications

Create a Discord channel webhook and add it to `.env`:

```env
RGDASH_DISCORD_ENABLED=true
RGDASH_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
RGDASH_DISCORD_NOTIFY_DOWN=true
RGDASH_DISCORD_NOTIFY_RECOVERY=true
RGDASH_DISCORD_NOTIFY_DEGRADED=false
```

Recreate the container, then use **Customise → Connect → Send Discord test**. Monitoring and notification delivery continue when the browser is closed.

## Customise

Administrators can configure RogueDashboard from the web interface without manually editing JSON or SQLite. This includes dashboard/page/section titles, cards per row, card placement and span, visibility, icons, URLs, health endpoints, integrations, alert controls, themes, density, accents and backgrounds.

**Customise → Connect** also exposes monitoring status, Discord testing and migration readiness.

## Updating

For the testing channel, keep your existing `.env` and refresh the Compose file before pulling the new image.

Podman:

```bash
cd /opt/media-server/roguedashboard
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/compose.yaml -o compose.yaml
podman compose --env-file .env -f compose.yaml pull
podman compose --env-file .env -f compose.yaml up -d
```

Docker:

```bash
cd /opt/media-server/roguedashboard
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/compose.yaml -o compose.yaml
docker compose --env-file .env -f compose.yaml pull
docker compose --env-file .env -f compose.yaml up -d
```

Do **not** overwrite an existing `.env` with `.env.example`. Compare new variables and merge only settings introduced by the release.

## Persistent files

Keep these between upgrades:

```text
.env
data/
custom/
```

`data/` contains the SQLite database with users, dashboard configuration, health samples, incidents and notification history.

## Security model

RogueDashboard:

- runs as an unprivileged user
- uses a read-only root filesystem
- drops Linux capabilities and enables `no-new-privileges`
- does not mount the Docker or Podman socket
- keeps API credentials and Discord webhook URLs server-side

Use [RogueForge](https://github.com/RogueAssassin/RogueForge) for container lifecycle operations, updates, live logs and terminals.

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
- [Roadmap](docs/ROADMAP.md)
- [Changelog](CHANGELOG.md)

## Release channels

Testing:

```text
ghcr.io/rogueassassin/roguedashboard:testing
ghcr.io/rogueassassin/roguedashboard:2.0.0-testing
```

After 2.0.0 is validated and promoted to `main`, stable releases use:

```text
ghcr.io/rogueassassin/roguedashboard:latest
ghcr.io/rogueassassin/roguedashboard:2.0.0
```

`main` is the stable production branch. `testing` is the proving ground for the next release.
