# Installation and networking

Rogue Dashboard 1.1 supports both Docker and Podman. Choose the engine-specific deployment path rather than installing a compatibility shim.

## Requirements

### Docker

- Docker Engine 24+ or current Docker Desktop
- Docker Compose v2

### Podman

- Current Podman with its API socket enabled
- `podman-compose`
- Rootful or rootless deployment with a socket path accessible to the restricted agent

A Linux-style shell is required for helper scripts. WSL 2 is supported.

## Persistent files

| Path | Purpose | Back up? |
| --- | --- | --- |
| `.env` | Runtime settings and service credentials | Yes |
| `data/` | SQLite database, users, sessions and dashboard layout | Yes |
| `custom/` | User icons and backgrounds | Yes |
| `backups/` | Timestamped upgrade backups | As needed |
| `docker-compose.yaml` / `compose.podman.yaml` | Runtime definitions | Re-downloadable |

## Docker deployment

```bash
cp .env.example .env
# edit .env
CONTAINER_ENGINE=docker
CONTAINER_SOCKET=/var/run/docker.sock

docker compose -f docker-compose.yaml config
docker compose -f docker-compose.yaml up -d
```

## Podman deployment

Enable the Podman API socket first. For the rootful server deployment used by the native compose file:

```bash
sudo systemctl enable --now podman.socket
```

Configure:

```dotenv
CONTAINER_ENGINE=podman
CONTAINER_SOCKET=/run/podman/podman.sock
```

Validate and start:

```bash
podman-compose --env-file .env -f compose.podman.yaml config
podman-compose --env-file .env -f compose.podman.yaml up -d
```

The Podman deployment mounts `/run/podman/podman.sock` directly into the restricted agent. Do not create `/var/run/docker.sock` for a new Podman-only install.

## Shared application network

Rogue Dashboard expects a shared application/proxy network, normally `media-net`. Attach the dashboard and monitored services to that same external network when you want DNS-by-container-name.

Docker and Podman use different networking implementations internally, but the application contract is the same: the dashboard must share a network with services it addresses by container name.

## Optional extra network

Set `RGDASH_EXTRA_NETWORK` when an application lives on a second existing network. Only the dashboard service should join it; the privileged engine agent remains isolated from application networks.

## WSL 2 notes

- Keep the project inside the Linux filesystem where practical.
- For headless server use, enable WSL systemd and keep the distribution running with a Windows-side headless task if required by your environment.
- Podman rootful services can be managed by systemd inside WSL.
- Docker Desktop integration is only required for Docker-based WSL deployments.

## Verify

Docker:

```bash
docker compose ps
docker compose logs --tail=100 dashboard
```

Podman:

```bash
podman ps
podman logs --tail=100 rogue-dashboard
podman logs --tail=100 rogue-dashboard-agent
```

Application health:

```bash
curl --fail http://localhost:7805/api/ping
```

For Podman, verify the agent's native socket mount:

```bash
podman inspect rogue-dashboard-agent --format '{{range .Mounts}}{{println .Source "->" .Destination}}{{end}}'
```

Expected rootful mount:

```text
/run/podman/podman.sock -> /run/podman/podman.sock
```
