<div align="center">

![Rogue Dashboard — your colourful Docker and Podman home base](docs/assets/hero.svg)

# Rogue Dashboard

**A colourful, local-first command centre for the containers you run.**

[![Release](https://img.shields.io/badge/release-1.1.0-9b5cff?style=for-the-badge)](https://github.com/RogueAssassin/rogue-dashboard)
[![Container](https://img.shields.io/badge/GHCR-ready-00d9ff?style=for-the-badge&logo=docker&logoColor=white)](https://github.com/RogueAssassin/rogue-dashboard/pkgs/container/rogue-dashboard)
[![No Node](https://img.shields.io/badge/frontend-no_build_step-ff2bd6?style=for-the-badge)](#why-rogue-dashboard)
[![Platforms](https://img.shields.io/badge/platform-amd64%20%7C%20arm64-41d99b?style=for-the-badge)](#install-from-scratch)

Version **1.1.0** · Docker + Podman deployment · Browser-based setup

</div>

Rogue Dashboard turns a Docker or Podman host into an approachable control panel. It brings service links, live application metrics, container health, safe lifecycle controls, themes, search and configuration into one responsive page—without requiring Node.js, TypeScript, pnpm or a frontend build on your server.

## Why Rogue Dashboard?

| | What you get |
| --- | --- |
| 🎨 | **Make it yours** — six colour presets, two accent colours, neon glow, card opacity, density and custom backgrounds. |
| 📦 | **See containers clearly** — discover every container, see its networks and state, and create duplicate-safe cards. |
| ⚡ | **Live service data** — metrics for qBittorrent, Radarr, Sonarr, Prowlarr, Seerr, Bazarr, Tautulli and Pi-hole. |
| 🧩 | **Edit in the browser** — add cards, rearrange groups, change columns and preview appearance changes live. |
| 🗂️ | **Build focused pages** — separate media, infrastructure, networking and links without running another dashboard. |
| 🛡️ | **A safer engine boundary** — the web app never mounts the engine socket; a private, restricted agent handles approved operations. |
| 🔐 | **Stay in control** — review active administrator sessions, revoke old sign-ins and inspect a bounded local action history. |
| 🚚 | **Simple upgrades** — pull a prebuilt GHCR image while keeping the database, settings and custom assets on the host. |
| 🧭 | **Bring an existing layout** — optionally import Homepage YAML files or a configuration ZIP during setup. |
| 📴 | **Local-first** — no cloud account, analytics service, subscription or remote icon dependency is required. |

## Install from scratch

### Requirements

- Docker Engine + Docker Compose v2, **or** Podman + podman-compose
- Git for the recommended installation method
- Linux, WSL 2, or another supported container host that supports bind mounts

### 1. Download the deployment files

```bash
git clone https://github.com/RogueAssassin/rogue-dashboard.git
cd rogue-dashboard
```

### 2. Choose the engine

Docker users can continue using `docker-compose.yaml`. Podman users can use `compose.podman.yaml` with the native Podman API socket.

For Podman, configure `.env` with:

```dotenv
CONTAINER_ENGINE=podman
CONTAINER_SOCKET=/run/podman/podman.sock
```

For Docker:

```dotenv
CONTAINER_ENGINE=docker
CONTAINER_SOCKET=/var/run/docker.sock
```

`CONTAINER_ENGINE=auto` probes the mounted engine socket. Legacy `DOCKER_*` variables remain supported for compatibility during the transition.

### 3. Open the dashboard

Visit [http://localhost:7805](http://localhost:7805), create the first local administrator and either start with a blank dashboard or import an existing Homepage configuration.

## Runtime architecture

The same prebuilt image runs in two modes:

- `dashboard` serves the interface, login, imports, SQLite data, health checks and integrations.
- `engine-agent` is internal-only and permits container listing plus start, stop and restart operations.

On Podman the agent mounts `/run/podman/podman.sock` directly. No `/var/run/docker.sock` compatibility symlink is required.

## Pin this release

```dotenv
RGDASH_IMAGE=ghcr.io/rogueassassin/rogue-dashboard:1.1.0
```

## Container engine documentation

See [Container Engines](docs/CONTAINER_ENGINES.md) for auto-detection, native socket paths and migration behavior.

## Documentation

- [Container engines](docs/CONTAINER_ENGINES.md)
- [Installation and networking](docs/INSTALLATION.md)
- [Configuration reference](docs/CONFIGURATION.md)
- [Reverse proxy guide](docs/REVERSE_PROXY.md)
- [Upgrading and recovery](docs/UPGRADING.md)
- [Security model](docs/SECURITY.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Deployment guide](docs/DEPLOYMENT_GUIDE.md)
- [Migration policy](docs/MIGRATIONS.md)
- [Support matrix](docs/SUPPORT.md)
- [Changelog](CHANGELOG.md)
- [1.1.0 release notes](docs/RELEASE_1.1.0.md)
- [Roadmap](docs/ROADMAP.md)

## Contributing and local builds

Repository contributors can build the exact source tree with the explicit developer override and run the regression suite:

```bash
cp .env.example .env
python -m unittest discover -s tests -v
```

The browser interface is plain HTML, CSS and JavaScript served by Python. There is no Node-based build step.

## Acknowledgements

Rogue Dashboard is an original implementation shaped by useful ideas from several self-hosted dashboard projects. See [Third-party inspiration](THIRD_PARTY_INSPIRATION.md) for the design review record. Product names and trademarks belong to their respective owners.
