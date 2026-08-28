<div align="center">

![RogueDashboard](docs/assets/hero.svg)

![Version](https://img.shields.io/badge/version-1.2.1-b45332)
![Runtime](https://img.shields.io/badge/runtime-Docker%20%7C%20Podman-2a69a6)
![Platform](https://img.shields.io/badge/platform-Linux%20amd64%20%7C%20arm64-355f9c)
![License](https://img.shields.io/badge/license-MIT-258b65)

</div>

RogueDashboard is a lightweight, local-first service dashboard for Docker and Podman hosts. It focuses on fast service visibility, HTTP/API health monitoring, integrations, persistent configuration and a clean Rogue ecosystem experience. Container and stack lifecycle management remains in [RogueForge](https://github.com/RogueAssassin/RogueForge).

## Highlights

- Fast service cards with HTTP/API health and latency monitoring.
- Native widgets for qBittorrent, Prowlarr, Radarr, Sonarr, Seerr, Bazarr, Tautulli, Pi-hole and RogueForge.
- Native RogueForge card showing RogueForge version, engine, running/total stacks and running/total containers.
- Socket-free architecture: RogueDashboard does not mount Docker or Podman engine sockets.
- One engine-neutral `compose.yaml` for Docker and Podman.
- Persistent SQLite configuration with admin/session controls.
- Remote-first service artwork with local `/custom/icons` overrides.
- Original RogueDashboard **RD** branding with base, dark, light and compact SVG variants.
- Existing `RGDASH_*` environment variables remain the supported configuration contract.

## Runtime layout

```text
roguedashboard/
├── .env
├── compose.yaml
├── data/
└── custom/
```

The production image is:

```text
ghcr.io/rogueassassin/roguedashboard:1.2.1
```

The testing channel is:

```text
ghcr.io/rogueassassin/roguedashboard:testing
```

## Install

### Podman

```bash
mkdir -p /opt/media-server/roguedashboard/{data,custom}
cd /opt/media-server/roguedashboard

curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/main/compose.yaml -o compose.yaml
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/main/.env.example -o .env

podman network inspect media-net >/dev/null 2>&1 || podman network create media-net
podman compose --env-file .env -f compose.yaml pull
podman compose --env-file .env -f compose.yaml up -d
```

### Docker

```bash
mkdir -p /opt/roguedashboard/{data,custom}
cd /opt/roguedashboard

curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/main/compose.yaml -o compose.yaml
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/main/.env.example -o .env

docker network inspect media-net >/dev/null 2>&1 || docker network create media-net
docker compose --env-file .env -f compose.yaml pull
docker compose --env-file .env -f compose.yaml up -d
```

## Updating safely

Keep your existing `.env`, `data/` and `custom/`. Never overwrite an existing `.env` during an upgrade.

```bash
cd /opt/media-server/roguedashboard
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/main/compose.yaml -o compose.yaml
podman compose --env-file .env -f compose.yaml pull
podman compose --env-file .env -f compose.yaml up -d
```

Existing 1.1.x/1.2.0 installations retain their settings. A legacy `data/rogue-dashboard.sqlite` file is migrated in place to `data/roguedashboard.sqlite`.

## RogueForge card

RogueDashboard and RogueForge should share the same container network, normally `media-net`.

Use:

```text
Name: RogueForge
Open URL: https://manage.example.com
Live integration: RogueForge
Private API URL: http://rogueforge:7810
Private health URL: http://rogueforge:7810/health
Icon: rogueforge
```

The widget reads RogueForge's read-only public status APIs and does not store RogueForge administrator credentials or expose the Podman/Docker socket to RogueDashboard.

## Branding and icons

RogueDashboard 1.2.1 uses its own RD identity:

```text
app/static/branding/
├── roguedashboard.svg
├── roguedashboard-dark.svg
├── roguedashboard-light.svg
└── branding-switch.js

app/static/icons/
└── roguedashboard.svg
```

Service artwork resolves in this order:

1. local `/custom/icons` override,
2. configured HTTPS/GitHub asset,
3. bundled fallback,
4. initials fallback.

Core RogueDashboard branding is bundled and cache-busted so a testing or production image never depends on an older logo still hosted on `main`.

## Architecture

```text
Browser
  ↓
RogueDashboard
  ├─ HTTP health probes
  ├─ API widget collectors
  ├─ SQLite configuration
  └─ RogueForge read-only status integration

RogueForge
  └─ Docker/Podman stack and container management
```

## Testing

The `testing` branch publishes `ghcr.io/rogueassassin/roguedashboard:testing` after tests, Python validation, Compose validation and container builds succeed. See [docs/TESTING.md](docs/TESTING.md).

## License

MIT
