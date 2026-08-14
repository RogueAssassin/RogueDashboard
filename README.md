<div align="center">

![Rogue Dashboard — Docker and Podman command centre](docs/assets/hero.svg)

# Rogue Dashboard

**A colourful, local-first command centre for Docker and Podman containers.**

[![Release](https://img.shields.io/badge/release-1.1.x-9b5cff?style=for-the-badge)](https://github.com/RogueAssassin/rogue-dashboard/releases)
[![Docker + Podman](https://img.shields.io/badge/engines-Docker%20%2B%20Podman-00d9ff?style=for-the-badge)](docs/CONTAINER_ENGINES.md)
[![Container](https://img.shields.io/badge/GHCR-ready-41d99b?style=for-the-badge)](https://github.com/RogueAssassin/rogue-dashboard/pkgs/container/rogue-dashboard)

Docker + Podman · GHCR deployment · Browser-based setup · No host build toolchain

</div>

Rogue Dashboard turns a Docker or Podman host into an approachable control panel. It combines service links, live application metrics, container health, safe lifecycle controls, themes, search, pages and configuration in one responsive interface.

## Deployment model

Rogue Dashboard is distributed as a prebuilt GHCR image. Production hosts do **not** need a Git checkout, build scripts, install scripts, or an application toolchain.

Keep only these deployment files on the host:

```text
rogue-dashboard/
├── .env
├── docker-compose.yaml      # Docker
├── compose.podman.yaml      # Podman
├── data/                    # persistent SQLite data
└── custom/                  # optional icons/backgrounds
```

The web dashboard never receives direct Docker or Podman socket access. A private `engine-agent` container owns the engine socket and exposes only the restricted metadata/lifecycle API used by Rogue Dashboard.

## Quick start — Podman

Create a directory and download the Podman manifest plus environment template from the release/repository:

```bash
mkdir -p rogue-dashboard/data rogue-dashboard/custom
cd rogue-dashboard
curl -fsSLO https://raw.githubusercontent.com/RogueAssassin/rogue-dashboard/main/compose.podman.yaml
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/rogue-dashboard/main/.env.example -o .env
```

Set a private agent token in `.env`:

```dotenv
CONTAINER_AGENT_TOKEN=replace-with-a-long-random-secret
RGDASH_IMAGE=ghcr.io/rogueassassin/rogue-dashboard:latest
MEDIA_NETWORK=media-net
```

For the current image user, prepare persistent data:

```bash
sudo chown -R 10001:10001 data
sudo chmod 750 data
```

Ensure the external application network and Podman API socket exist:

```bash
sudo podman network inspect media-net >/dev/null 2>&1 || sudo podman network create media-net
sudo systemctl enable --now podman.socket
```

Start:

```bash
sudo podman-compose --env-file .env -f compose.podman.yaml pull
sudo podman-compose --env-file .env -f compose.podman.yaml up -d
```

Update later with the same two commands:

```bash
sudo podman-compose --env-file .env -f compose.podman.yaml pull
sudo podman-compose --env-file .env -f compose.podman.yaml up -d
```

## Quick start — Docker

```bash
mkdir -p rogue-dashboard/data rogue-dashboard/custom
cd rogue-dashboard
curl -fsSLO https://raw.githubusercontent.com/RogueAssassin/rogue-dashboard/main/docker-compose.yaml
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/rogue-dashboard/main/.env.example -o .env
```

Set `CONTAINER_AGENT_TOKEN` in `.env`, ensure `${MEDIA_NETWORK:-media-net}` exists, then:

```bash
docker compose --env-file .env -f docker-compose.yaml pull
docker compose --env-file .env -f docker-compose.yaml up -d
```

Updates use the same commands.

## Runtime architecture

```text
Browser
  │
  ▼
Rogue Dashboard
  │ private HTTP + token
  ▼
Engine Agent
  │
  ├── /run/podman/podman.sock   (Podman)
  └── /var/run/docker.sock       (Docker)
```

The Podman deployment does not require `/var/run/docker.sock` or a Docker compatibility symlink.

## Main features

- Docker and Podman container discovery, state, health and metrics.
- Safe start, stop and restart controls through the restricted agent.
- qBittorrent, Radarr, Sonarr, Prowlarr, Seerr, Bazarr, Tautulli and Pi-hole integrations.
- Multiple pages, groups, bookmarks, themes and custom backgrounds.
- Local authentication, session revocation and action auditing.
- Persistent SQLite configuration under `data/`.
- Native Podman socket support.
- GHCR images for amd64 and arm64.

## Important files

- `docker-compose.yaml` — complete Docker deployment.
- `compose.podman.yaml` — complete Podman deployment.
- `.env.example` — runtime settings template.
- `docs/CONTAINER_ENGINES.md` — engine behavior and socket model.
- `docs/CONFIGURATION.md` — dashboard and integration configuration.
- `docs/SECURITY.md` — deployment security guidance.
- `CHANGELOG.md` — release history.

## Backups

Back up these host paths before major changes:

```text
.env
data/
custom/
```

The application image is disposable and can always be pulled again from GHCR.

## Philosophy

Rogue Dashboard is intentionally simple to deploy: download the compose file for your engine, keep your `.env` and persistent data, and let GHCR provide the application image. Source checkouts are for development only.
