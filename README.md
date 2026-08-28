<div align="center">

![RogueDashboard](https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/main/docs/assets/hero.png)

# RogueDashboard

**A lightweight local-first service dashboard for Docker and Podman hosts.**

**Version 1.2.0** · GHCR deployment · Service monitoring · Integrations · Admin/session controls

</div>

RogueDashboard 1.2.0 builds directly on the stable 1.1.3 architecture. Direct container-engine management remains intentionally separated into **RogueForge**; RogueDashboard stays focused on service visibility, health monitoring, widgets, integrations, reverse-proxy use, persistent configuration and local administration.

## 1.2.0 highlights

- Product identity is standardized as **RogueDashboard**.
- Internal runtime/container naming is standardized as `roguedashboard`.
- Docker and Podman use one engine-neutral `compose.yaml` deployment definition.
- GHCR image path is standardized as `ghcr.io/rogueassassin/roguedashboard`.
- Existing `RGDASH_*` environment variables remain supported so 1.1.3 installations can upgrade without rewriting secrets.
- Branding follows the RogueForge model: GitHub-hosted canonical assets with local `/custom` overrides available for operators.
- The dashboard remains socket-free: no Docker or Podman socket is mounted.
- Service/API health monitoring, widgets, integrations, SQLite persistence, admin/session controls and reverse-proxy support are retained.

## Runtime folder

A production host only needs:

```text
roguedashboard/
├── .env
├── compose.yaml
├── data/
└── custom/
```

The application image is:

```text
ghcr.io/rogueassassin/roguedashboard:1.2.0
```

## Install with Podman

```bash
mkdir -p /opt/media-server/roguedashboard/{data,custom}
cd /opt/media-server/roguedashboard

curl -fsSLO https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/main/compose.yaml
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/main/.env.example -o .env

podman network inspect media-net >/dev/null 2>&1 || podman network create media-net
podman compose --env-file .env -f compose.yaml pull
podman compose --env-file .env -f compose.yaml up -d
```

If your host uses `podman-compose` rather than `podman compose`, the same `compose.yaml` can be used:

```bash
podman-compose --env-file .env -f compose.yaml pull
podman-compose --env-file .env -f compose.yaml up -d
```

## Install with Docker

```bash
mkdir -p /opt/roguedashboard/{data,custom}
cd /opt/roguedashboard

curl -fsSLO https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/main/compose.yaml
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/main/.env.example -o .env

docker network inspect media-net >/dev/null 2>&1 || docker network create media-net
docker compose --env-file .env -f compose.yaml pull
docker compose --env-file .env -f compose.yaml up -d
```

## Updating

Keep the current `.env`, `data/` and `custom/` directories. Only refresh the Compose definition and image:

```bash
cd /opt/media-server/roguedashboard   # or your existing /opt/media-server/rogue-dashboard folder
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/main/compose.yaml -o compose.yaml
podman compose --env-file .env -f compose.yaml pull
podman compose --env-file .env -f compose.yaml up -d
```

Do not re-download `.env.example` over an existing `.env`. No Git checkout is required on the production host.

## Migration from 1.1.3

The application data format is retained and upgrades must preserve the existing `.env`, `data/`, and `custom/` contents. Do **not** overwrite an existing `.env` with `.env.example` during an upgrade. Existing installations may remain in their current `/opt/media-server/rogue-dashboard` host folder; new installs can use `/opt/media-server/roguedashboard`.

If an existing `.env` still sets `RGDASH_IMAGE=ghcr.io/rogueassassin/rogue-dashboard:<tag>`, 1.2.0 remains compatible because releases are published under both the canonical `roguedashboard` package name and the legacy `rogue-dashboard` package name. This lets the remaining settings and secrets stay untouched.

On first 1.2.0 start, an existing `data/rogue-dashboard.sqlite` database is migrated in place to `data/roguedashboard.sqlite`. Dashboard configuration, administrator accounts, sessions and saved settings are retained.

If other services address the dashboard by its old network alias, 1.2.0 keeps `rogue-dashboard` as a compatibility alias while making `roguedashboard` the canonical internal name.

## Architecture

```text
Browser
   ↓
RogueDashboard
   ↓
Service APIs / health endpoints
   ↓
qBittorrent / Prowlarr / Radarr / Sonarr / Bazarr / Seerr / Tautulli / RogueRoute / others
```

RogueDashboard does **not** mount `/run/podman/podman.sock` or `/var/run/docker.sock`. Container and stack operations belong in **RogueForge**.

## Branding and images

Canonical RogueDashboard branding is hosted from this GitHub repository, following the same model used by RogueForge. Operators can still override assets locally under `custom/` without modifying the container image.

Service cards resolve artwork in this order:

1. explicit local/custom icon,
2. configured external HTTPS icon,
3. RogueDashboard GitHub-hosted canonical service artwork,
4. bundled lightweight fallback,
5. generated initials tile.

This keeps the container image small while preserving offline/local override support.

## Why 1.2.0 stays on the 1.1.3 architecture

The earlier engine-agent design added Docker/Podman socket access and deployment complexity. 1.1.3 removed that layer. 1.2.0 keeps that separation and improves naming, deployment and branding instead of restoring container-engine control to the dashboard.

See the documentation under [`docs/`](docs/).


## RogueForge integration

RogueDashboard 1.2.0 includes a lightweight RogueForge service-card integration. Both containers must share the same Compose network (the default examples use `media-net`).

Create or edit a service card and use:

```text
Name: RogueForge
Open URL: https://manage.example.com
Private health-check URL: http://rogueforge:7810/health
Live integration: RogueForge
Private API URL: http://rogueforge:7810
Icon: rogueforge
```

The card reads RogueForge's public status and stack summary endpoints and displays:

- RogueForge application version
- active container engine/version
- discovered stack count
- running stack count

No Docker/Podman socket is exposed to RogueDashboard and no RogueForge administrator credentials are stored in RogueDashboard. Widget results use the same short cache as the other integrations to keep the monitoring load small.

## Build information

Runtime/build metadata belongs in project documentation rather than the live dashboard UI. The 1.2.0 web interface intentionally keeps version/runtime/platform/license badges out of the main dashboard surface.

```text
version   1.2.0
runtime   Docker / Podman
platform  Linux amd64 / arm64
license   MIT
```

## Branding

RogueDashboard has its own original **RD** identity. The 1.2.0 branding set is vector-based and includes high-detail base/dark/light artwork plus a compact service-card mark. RogueForge retains its own independent **RF** identity so each Rogue product is visually related without sharing the same logo.
