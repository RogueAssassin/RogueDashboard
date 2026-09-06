# Support matrix

RogueDashboard is engine-neutral and does not use the container-engine API.

| Component | Supported baseline |
| --- | --- |
| Docker Engine | maintained releases |
| Docker Compose | Compose v2 |
| Podman | maintained releases |
| Podman Compose | current `podman compose` / compatible provider |
| Python runtime | version defined by the Dockerfile |
| Architecture | amd64 and arm64 published by CI |
| Host | Linux; WSL 2 supported |

## Deployment model

- one RogueDashboard container
- external shared network
- bind-mounted `data/` and optional `custom/`
- no Docker/Podman socket
- no privileged mode
- read-only root filesystem with dropped capabilities

Container management, updates and log streaming belong to RogueForge.
