<div align="center">

<table>
  <tr>
    <td width="220" align="center">
      <img src="https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/app/static/icons/roguedashboard-approved-128.png" width="128" height="128" alt="RogueDashboard logo">
    </td>
    <td align="left">
      <h1>RogueDashboard</h1>
      <p><strong>Fast, local-first visibility for Docker and Podman services.</strong></p>
      <p>Health monitoring • API widgets • RogueForge integration • Local authentication • No engine socket required</p>
    </td>
  </tr>
</table>

[![Release](https://img.shields.io/badge/RELEASE-1.3.5%20TESTING-8b5cf6?style=for-the-badge&labelColor=45464d)](https://github.com/RogueAssassin/RogueDashboard/tree/testing)
[![GHCR](https://img.shields.io/badge/GHCR-PACKAGE-5c6ac4?style=for-the-badge&logo=github&logoColor=white&labelColor=45464d)](https://github.com/RogueAssassin/RogueDashboard/pkgs/container/roguedashboard)
[![Build](https://img.shields.io/github/actions/workflow/status/RogueAssassin/RogueDashboard/ci.yml?branch=testing&style=for-the-badge&label=BUILD&labelColor=45464d)](https://github.com/RogueAssassin/RogueDashboard/actions/workflows/ci.yml?query=branch%3Atesting)
![Runtime](https://img.shields.io/badge/RUNTIME-PYTHON%203.13-ff4fc8?style=for-the-badge&labelColor=45464d)
![Engine](https://img.shields.io/badge/ENGINE-DOCKER%20%7C%20PODMAN-00cbe6?style=for-the-badge&labelColor=45464d)
![Platform](https://img.shields.io/badge/PLATFORM-AMD64%20%7C%20ARM64-42d6a4?style=for-the-badge&labelColor=45464d)

</div>

RogueDashboard is a fast, local-first homepage and service-monitoring dashboard for self-hosted Docker and Podman environments. It gives you a clean view of your services, health, latency and application metrics without mounting the Docker or Podman engine socket.

RogueDashboard is designed to complement **[RogueForge](https://github.com/RogueAssassin/RogueForge)**. Use RogueDashboard for visibility and service monitoring; use RogueForge when you want full Docker/Podman stack and container management.

## What RogueDashboard does

- Displays your self-hosted services in configurable pages and groups.
- Checks private HTTP/HTTPS health endpoints and shows live latency.
- Collects lightweight application metrics from supported services.
- Keeps API keys and secrets server-side through `RGDASH_*` environment variables.
- Stores dashboard configuration, accounts and sessions in SQLite.
- Supports Docker and Podman from one engine-neutral `compose.yaml`.
- Runs without a Docker/Podman socket or privileged container-engine access.
- Supports remote-first service artwork with local `/custom/icons` overrides.
- Includes native RogueForge monitoring for version, engine, stack and container summaries.
- Uses a responsive, low-overhead interface designed to stay lightweight on media and home servers.

## Supported live integrations

RogueDashboard includes native collectors for:

```text
qBittorrent
Prowlarr
Radarr
Sonarr
Seerr
Bazarr
Tautulli
Pi-hole
RogueForge
```

Other services can still be added as normal health-checked cards.

## Rogue ecosystem

### RogueDashboard

Visibility, service health, latency, application widgets and your day-to-day self-hosted homepage.

### RogueForge

For full Docker/Podman container and Compose-stack management, install RogueForge alongside RogueDashboard:

**[Download / view RogueForge on GitHub](https://github.com/RogueAssassin/RogueForge)**

Both applications can share the same `media-net` network. RogueRoute GPX testing also joins this network using the aliases `rogueroute-gpx-web`, `rogueroute-gpx-manager` and `rogueroute-gpx-osrm`, so the dashboard can use its built-in private health URLs without publishing the manager or OSRM endpoints. RogueDashboard can then read RogueForge's lightweight status APIs without receiving Docker/Podman socket access or RogueForge administrator credentials.

## Container images

Production:

```text
ghcr.io/rogueassassin/roguedashboard:1.3.0
```

Latest stable:

```text
ghcr.io/rogueassassin/roguedashboard:latest
```

Testing:

```text
ghcr.io/rogueassassin/roguedashboard:testing
```

## Runtime layout

A normal installation only needs:

```text
roguedashboard/
├── .env
├── compose.yaml
├── data/
└── custom/
```

- `.env` — persistent `RGDASH_*` configuration and integration secrets.
- `data/` — SQLite database and application state.
- `custom/` — optional local icons and artwork overrides.
- `compose.yaml` — the same deployment definition for Docker or Podman.

## Install with Podman

```bash
mkdir -p /opt/media-server/roguedashboard/{data,custom}
cd /opt/media-server/roguedashboard

curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/main/compose.yaml -o compose.yaml
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/main/.env.example -o .env

podman network inspect media-net >/dev/null 2>&1 || podman network create media-net
podman compose --env-file .env -f compose.yaml pull
podman compose --env-file .env -f compose.yaml up -d
```

## Install with Docker

```bash
mkdir -p /opt/roguedashboard/{data,custom}
cd /opt/roguedashboard

curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/main/compose.yaml -o compose.yaml
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/main/.env.example -o .env

docker network inspect media-net >/dev/null 2>&1 || docker network create media-net
docker compose --env-file .env -f compose.yaml pull
docker compose --env-file .env -f compose.yaml up -d
```

## Updating without losing settings

Keep your existing `.env`, `data/` and `custom/` directories. Do not overwrite an existing `.env` with `.env.example`.

Podman:

```bash
cd /opt/media-server/roguedashboard
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/main/compose.yaml -o compose.yaml
podman compose --env-file .env -f compose.yaml pull
podman compose --env-file .env -f compose.yaml up -d
```

Docker:

```bash
cd /opt/roguedashboard
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/main/compose.yaml -o compose.yaml
docker compose --env-file .env -f compose.yaml pull
docker compose --env-file .env -f compose.yaml up -d
```

Existing settings, users, pages, groups, integrations and custom artwork remain persistent. Older `data/rogue-dashboard.sqlite` databases are migrated to `data/roguedashboard.sqlite`.

## RogueForge card

When RogueForge shares the same container network, create a card with:

```text
Name: RogueForge
Open URL: https://manage.example.com
Live integration: RogueForge
Private API URL: http://rogueforge:7810
Private health URL: http://rogueforge:7810/health
Icon: rogueforge
```

The card can display RogueForge version, container engine, running/total stacks and running/total containers.

## Branding and icons

RogueDashboard uses the approved high-detail **RD** artwork from the RogueDashboard icon pack. The web UI uses an optimised bundled WebP for the header, setup and administrator surfaces, plus dedicated PNG assets for service cards and browser icons.

```text
app/static/branding/
├── roguedashboard-approved.webp
└── branding-switch.js

app/static/icons/
└── roguedashboard-approved-128.png

app/static/
└── favicon-32.png
```

The source icon pack remains the design authority; runtime copies are optimised so the dashboard does not decode multi-megabyte masters on every page load. Service-card artwork can still use GitHub-hosted assets or local overrides.

Icon resolution:

1. local `/custom/icons` override,
2. configured HTTPS/GitHub asset,
3. bundled fallback,
4. initials fallback.

## Architecture

```text
Browser
  ↓
RogueDashboard
  ├─ HTTP/HTTPS health probes
  ├─ API widget collectors
  ├─ SQLite configuration
  └─ RogueForge read-only status integration

RogueForge
  └─ Docker / Podman stack and container management
```

This separation keeps RogueDashboard fast and avoids giving a homepage unnecessary control over the container engine.

## 1.3.5 testing preview

The current testing branch includes a visual polish pass focused on alignment and administration UX. The BUILD badge above is driven directly by the `testing` CI workflow, so it changes with each push. The RELEASE badge is tied to the active testing version and is updated whenever the testing version advances:

- approved RogueDashboard icon-pack artwork throughout the live UI,
- tighter title/group/stat alignment,
- cleaner card spacing and responsive behaviour,
- rebuilt Appearance, Layout, Connect and Admin customiser sections,
- unified setup/login/customiser visual styling,
- clearer authentication feedback and session management.

## Testing channel


Development is validated through the `testing` branch. Successful CI publishes:

```text
ghcr.io/rogueassassin/roguedashboard:testing
ghcr.io/rogueassassin/roguedashboard:1.3.5-testing
```

The pipeline runs application tests, Python validation, Compose validation, an amd64 build and a multi-architecture amd64/arm64 publish.

See [docs/TESTING.md](docs/TESTING.md).

## License

MIT
