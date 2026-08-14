# Installation and networking

Rogue Dashboard supports both Docker and Podman through prebuilt GHCR images. Production hosts do not need a Git checkout, build toolchain, install script, upgrade script, or migration script.

## Requirements

### Docker

- Docker Engine with Docker Compose v2
- Access to `/var/run/docker.sock` for the restricted engine agent

### Podman

- Podman with its API socket enabled
- `podman-compose`
- Rootful or rootless deployment with a socket accessible to the restricted engine agent

## Files kept on the host

| Path | Purpose | Back up? |
| --- | --- | --- |
| `.env` | Runtime settings and service credentials | Yes |
| `data/` | SQLite database, users, sessions and dashboard layout | Yes |
| `custom/` | User icons and backgrounds | Yes |
| `docker-compose.yaml` | Complete Docker deployment | Re-downloadable |
| `compose.podman.yaml` | Complete Podman deployment | Re-downloadable |

## Podman deployment

```bash
mkdir -p rogue-dashboard/data rogue-dashboard/custom
cd rogue-dashboard
curl -fsSLO https://raw.githubusercontent.com/RogueAssassin/rogue-dashboard/main/compose.podman.yaml
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/rogue-dashboard/main/.env.example -o .env
```

Set a long random `CONTAINER_AGENT_TOKEN` in `.env`, then prepare persistent data for the image user:

```bash
sudo chown -R 10001:10001 data
sudo chmod 750 data
```

Enable the rootful Podman API socket and create the shared application network if required:

```bash
sudo systemctl enable --now podman.socket
sudo podman network inspect media-net >/dev/null 2>&1 || sudo podman network create media-net
```

Start:

```bash
sudo podman-compose --env-file .env -f compose.podman.yaml pull
sudo podman-compose --env-file .env -f compose.podman.yaml up -d
```

The Podman manifest mounts `/run/podman/podman.sock` only into the restricted `engine-agent`. The web dashboard itself has no engine socket mount.

## Docker deployment

```bash
mkdir -p rogue-dashboard/data rogue-dashboard/custom
cd rogue-dashboard
curl -fsSLO https://raw.githubusercontent.com/RogueAssassin/rogue-dashboard/main/docker-compose.yaml
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/rogue-dashboard/main/.env.example -o .env
```

Set `CONTAINER_AGENT_TOKEN` in `.env`, create `${MEDIA_NETWORK:-media-net}` if it does not already exist, then:

```bash
docker compose --env-file .env -f docker-compose.yaml pull
docker compose --env-file .env -f docker-compose.yaml up -d
```

## Shared application network

The manifests expect an external application network, normally `media-net`. Rogue Dashboard joins that network so it can address monitored services by container name. The engine agent remains isolated on the private dashboard network.

## WSL 2

- Keep persistent files inside the Linux filesystem where practical.
- Enable WSL systemd for headless Podman services.
- For a headless Windows Server host, keep the WSL distribution alive using a Windows-side noninteractive task if required.
- Use `sudo podman` and `sudo podman-compose` consistently for a rootful Podman deployment.

## Verify

Docker:

```bash
docker compose --env-file .env -f docker-compose.yaml ps
docker compose --env-file .env -f docker-compose.yaml logs --tail=100
```

Podman:

```bash
sudo podman ps --filter name=rogue-dashboard
sudo podman logs --tail=100 rogue-dashboard
sudo podman logs --tail=100 rogue-dashboard-agent
```

Application health:

```bash
curl --fail http://localhost:7805/api/ping
```

For Podman, verify that only the agent receives the native engine socket:

```bash
sudo podman inspect rogue-dashboard-agent --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
sudo podman inspect rogue-dashboard --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
```

Expected agent mount:

```text
/run/podman/podman.sock -> /run/podman/podman.sock
```

The web dashboard should show only its persistent `/data` and read-only `/custom` mounts.
