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

```bash
cd /opt/media-server/roguedashboard
podman compose --env-file .env -f compose.yaml pull
podman compose --env-file .env -f compose.yaml up -d
```

No Git checkout is required on the production host.

## Migration from 1.1.3

The application data format is retained. Copy or move the existing `data/` and `custom/` directories into the new `roguedashboard/` runtime folder, download the new `compose.yaml`, and keep your existing `.env` file. `RGDASH_*` integration variables remain valid.

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
