<div align="center">

![Rogue Dashboard](docs/assets/hero.png)

# Rogue Dashboard

**A lightweight local-first service dashboard for Docker or Podman hosts.**

**Version 1.1.3** · GHCR deployment · Service monitoring · Integrations · Admin/session controls

</div>

Rogue Dashboard 1.1.3 intentionally removes direct container-engine management. The dashboard now focuses on the features that proved reliable in production: service visibility, widgets, integrations, health monitoring, admin/session controls, reverse-proxy support, persistent configuration and synchronized Rogue branding.

Container and stack management is being separated into **RogueForge**.

## 1.1.3 highlights

- Removed the Docker/Podman engine-agent architecture.
- Removed all Docker/Podman socket mounts.
- Removed container start/stop/restart controls and container inventory APIs.
- Removed engine auto-detection and engine-specific Admin panels.
- Single-container deployment for both Docker and Podman.
- Keeps service/API health monitoring, widgets, integrations and admin/session features.
- Keeps SQLite persistence and custom assets.
- Keeps synchronized Rogue Dashboard branding across README, website, browser tab and app icons.
- Clean GHCR-first deployment; no Git checkout or shell installer required on production hosts.

## Runtime folder

A production host only needs:

```text
rogue-dashboard/
├── .env
├── compose.podman.yaml       # Podman
# or docker-compose.yaml      # Docker
├── data/
└── custom/
```

The application image is:

```text
ghcr.io/rogueassassin/rogue-dashboard:1.1.3
```

## Podman install

```bash
mkdir -p /opt/media-server/rogue-dashboard/{data,custom}
cd /opt/media-server/rogue-dashboard

curl -fsSLO https://raw.githubusercontent.com/RogueAssassin/rogue-dashboard/main/compose.podman.yaml
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/rogue-dashboard/main/.env.example -o .env

sudo podman network inspect media-net >/dev/null 2>&1 || sudo podman network create media-net
sudo chown -R 10001:10001 data

sudo podman-compose --env-file .env -f compose.podman.yaml pull
sudo podman-compose --env-file .env -f compose.podman.yaml up -d
```

## Updating

```bash
cd /opt/media-server/rogue-dashboard
sudo podman-compose --env-file .env -f compose.podman.yaml pull
sudo podman-compose --env-file .env -f compose.podman.yaml up -d
```

No Git checkout is required on the Linux server.

## Architecture

```text
Browser
   ↓
Rogue Dashboard
   ↓
Service APIs / health endpoints
   ↓
qBittorrent / Prowlarr / Radarr / Sonarr / Bazarr / Seerr / Tautulli / RogueRoute / others
```

Rogue Dashboard does **not** mount `/run/podman/podman.sock` or `/var/run/docker.sock`.

## Branding

The 1.1.3 identity remains synchronized across:

- `docs/assets/hero.png`
- `docs/assets/rogue-dashboard-logo.png`
- `app/static/rogue-dashboard-logo.png`
- favicon PNG/ICO files
- Apple touch icon
- 192×192 and 512×512 app icons
- `site.webmanifest`

See the documentation under [`docs/`](docs/).
