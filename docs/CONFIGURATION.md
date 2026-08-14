# Configuration reference

Rogue Dashboard reads runtime values from `.env`. The command used to recreate the stack depends on the selected engine.

Docker:

```bash
docker compose up -d --force-recreate
```

Podman:

```bash
podman-compose --env-file .env -f compose.podman.yaml up -d
```

## Core values

| Variable | Default | Purpose |
| --- | --- | --- |
| `TZ` | `Etc/UTC` | Container timezone. Use an IANA timezone name. |
| `RGDASH_PORT` | `7805` | Host port published for the browser. |
| `RGDASH_BACKUP_KEEP` | `0` | Successful upgrade backups to retain; `0` keeps all. |
| `RGDASH_IMAGE` | `ghcr.io/rogueassassin/rogue-dashboard:latest` | Optional tag or digest pin. |
| `PUID` / `PGID` | `1000` | Host ownership used for persistent data where applicable. |
| `CONTAINER_ENGINE` | `auto` | `auto`, `docker`, or `podman`. |
| `CONTAINER_SOCKET` | auto-detected | Native engine socket path. |
| `CONTAINER_AGENT_URL` | deployment-specific | Internal restricted-agent URL. |
| `CONTAINER_AGENT_TOKEN` | generated | Private dashboard-to-agent credential. |
| `MEDIA_NETWORK` | `media-net` | External application/proxy network. |
| `RGDASH_EXTRA_NETWORK` | empty | Optional second application network attached only to the dashboard. |
| `SECURE_COOKIES` | `false` | Force Secure session cookies. |
| `RGDASH_TRUST_PROXY_HEADERS` | `true` | Honour trusted forwarded protocol headers. |
| `RGDASH_ALLOWED_HOSTS` | empty | Optional comma-separated Host allowlist. |

### Native socket examples

```text
Docker:          /var/run/docker.sock
Podman rootful:  /run/podman/podman.sock
Podman rootless: /run/user/<uid>/podman/podman.sock
```

Legacy `DOCKER_SOCKET`, `DOCKER_AGENT_URL`, `DOCKER_AGENT_TOKEN`, and `DOCKER_GID` are retained for compatibility with older Docker deployments. New Podman installations should not create a Docker socket symlink.

## Service credentials

| Integration | Environment variable | Typical private URL |
| --- | --- | --- |
| qBittorrent 5.2+ | `RGDASH_QBITTORRENT_API_KEY` | `http://qbittorrent:8080` or configured WebUI port |
| qBittorrent fallback | `RGDASH_QBITTORRENT_USERNAME`, `RGDASH_QBITTORRENT_PASSWORD` | same |
| Prowlarr | `RGDASH_PROWLARR_KEY` | `http://prowlarr:9696` |
| Radarr | `RGDASH_RADARR_KEY` | `http://radarr:7878` |
| Sonarr | `RGDASH_SONARR_KEY` | `http://sonarr:8989` |
| Seerr | `RGDASH_SEERR_KEY` | `http://seerr:5055` |
| Bazarr | `RGDASH_BAZARR_KEY` | `http://bazarr:6767` |
| Tautulli | `RGDASH_TAUTULLI_KEY` | `http://tautulli:8181` |
| Pi-hole | `RGDASH_PIHOLE_KEY` | Pi-hole HTTP address on the shared network |

Use internal DNS names on a network shared with the dashboard service. Docker and Podman both provide container-network DNS; exact behaviour depends on the selected network backend.

## qBittorrent authentication order

Rogue Dashboard prefers the qBittorrent 5.2+ API key. If the key is absent or rejected and both WebUI credentials are configured, it falls back to cookie authentication.

## Legacy environment migration

`migrate-env.sh` converts recognised Homepage-era variables to `RGDASH_*`. Existing `RGDASH_*` values win and credentials are never printed.

```bash
./migrate-env.sh .env
```
