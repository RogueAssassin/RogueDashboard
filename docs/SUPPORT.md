# Support matrix

Rogue Dashboard 1.1 targets current Linux container hosts and uses capability probing where possible instead of hard-coding one exact engine patch release.

| Component | Supported baseline |
| --- | --- |
| Docker Engine | 24+ |
| Docker Compose | Compose v2 |
| Podman | Current maintained releases with Docker-compatible API support |
| Podman Compose | Current `podman-compose` |
| Python image | Version defined by the repository Dockerfile |
| Architectures | amd64, arm64 where the published image is available |
| Host | Linux; WSL 2 supported |

## Engine modes

`CONTAINER_ENGINE=auto` probes the mounted socket. Explicit `docker` and `podman` modes fail instead of silently switching to the other engine.

Podman-specific capabilities outside the cross-engine container API are not yet exposed in Rogue Dashboard 1.1; those belong either behind future capability checks or in the companion RogueForge stack manager.
