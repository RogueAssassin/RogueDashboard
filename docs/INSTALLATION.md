# Installation

RogueDashboard runs as one unprivileged container and uses the same `compose.yaml` with Docker Compose or Podman Compose. No Docker or Podman socket is required.

## Requirements

- Linux or WSL 2
- Docker + Compose v2, or Podman + a Compose provider
- an external network such as `media-net`
- host port `7805` available, or another `RGDASH_PORT`

The container runs as UID/GID `10001:10001`.

## Install directory

```text
/opt/media-server/roguedashboard/
├── compose.yaml
├── update.sh
├── .env
├── data/
└── custom/
    ├── backgrounds/
    └── icons/
```

Create it:

```bash
sudo mkdir -p /opt/media-server/roguedashboard/{data,custom/backgrounds,custom/icons}
sudo chown -R 10001:10001 /opt/media-server/roguedashboard/data
cd /opt/media-server/roguedashboard
```

Download the deployment files from the branch you want to run:

```bash
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/compose.yaml -o compose.yaml
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/.env.example -o .env
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/update.sh -o update.sh
chmod 600 .env
chmod +x update.sh
nano .env
```

For stable production after release, use `main` instead of `testing`.

## Start with Podman

```bash
podman network inspect media-net >/dev/null 2>&1 || podman network create media-net
podman compose --env-file .env -f compose.yaml pull
podman compose --env-file .env -f compose.yaml up -d
```

## Start with Docker

```bash
docker network inspect media-net >/dev/null 2>&1 || docker network create media-net
docker compose --env-file .env -f compose.yaml pull
docker compose --env-file .env -f compose.yaml up -d
```

Open `http://HOST:7805` and complete administrator setup.

## Shared media network

RogueDashboard and services addressed by container name must share the same external network. The default is:

```env
MEDIA_NETWORK=media-net
```

For example, a Sonarr health URL can then use `http://sonarr:8989`.

## Verify

```bash
curl -fsS http://127.0.0.1:7805/api/health
```

Podman logs:

```bash
podman logs --tail 100 roguedashboard
```

Docker logs:

```bash
docker logs --tail 100 roguedashboard
```
