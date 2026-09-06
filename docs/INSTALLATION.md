# Installation

RogueDashboard runs as one unprivileged container and uses the same `compose.yaml` with Docker Compose or Podman Compose. It does not mount a Docker or Podman socket.

## Requirements

- Linux or WSL 2 host
- Docker Engine + Docker Compose v2, or Podman + Podman Compose
- an external container network such as `media-net`
- persistent `data/` and `custom/` directories
- host port 7805 available, or set another `RGDASH_PORT`

The container runs as UID/GID `10001:10001`. Ensure the bind-mounted `data/` directory is writable by that account.

## Directory layout

```text
roguedashboard/
├── .env
├── compose.yaml
├── data/
└── custom/
    ├── backgrounds/
    └── icons/
```

## Podman installation

Example for a media stack under `/opt/media-server`:

```bash
sudo mkdir -p /opt/media-server/roguedashboard/{data,custom/backgrounds,custom/icons}
sudo chown -R 10001:10001 /opt/media-server/roguedashboard/data
cd /opt/media-server/roguedashboard

curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/compose.yaml -o compose.yaml
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/.env.example -o .env

podman network inspect media-net >/dev/null 2>&1 || podman network create media-net
podman compose --env-file .env -f compose.yaml pull
podman compose --env-file .env -f compose.yaml up -d
```

Open `http://HOST:7805` and complete the initial administrator setup.

For a stable/main release, replace `/testing/` in the two download URLs with `/main/` and set `RGDASH_IMAGE` to the stable image tag documented in the release.

## Docker installation

```bash
sudo mkdir -p /opt/roguedashboard/{data,custom/backgrounds,custom/icons}
sudo chown -R 10001:10001 /opt/roguedashboard/data
cd /opt/roguedashboard

curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/compose.yaml -o compose.yaml
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/.env.example -o .env

docker network inspect media-net >/dev/null 2>&1 || docker network create media-net
docker compose --env-file .env -f compose.yaml pull
docker compose --env-file .env -f compose.yaml up -d
```

Open `http://HOST:7805` and complete the initial administrator setup.

## Existing shared media stack

If Radarr, Sonarr, RogueForge, RogueMediaValidator, RogueRoute GPX, Nginx Proxy Manager or other monitored services already use another external network, set:

```env
MEDIA_NETWORK=your-network-name
```

RogueDashboard and the services it monitors must share a network for container-name health/API URLs such as `http://sonarr:8989`.

## Discord notifications

Create a webhook in the Discord channel you want to receive alerts, then set:

```env
RGDASH_DISCORD_ENABLED=true
RGDASH_DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
RGDASH_DISCORD_NOTIFY_DOWN=true
RGDASH_DISCORD_NOTIFY_RECOVERY=true
```

Recreate the container, then use **Customise → Connect → Send Discord test**.

## Reverse proxy

The container listens on port `8080` internally. A reverse proxy on the same container network should forward to:

```text
http://roguedashboard:8080
```

See `docs/REVERSE_PROXY.md` for Nginx Proxy Manager and Cloudflare guidance.

## Verify

Podman:

```bash
podman ps --filter name=roguedashboard
podman logs --tail 100 roguedashboard
curl -fsS http://127.0.0.1:7805/api/health
```

Docker:

```bash
docker ps --filter name=roguedashboard
docker logs --tail 100 roguedashboard
curl -fsS http://127.0.0.1:7805/api/health
```
