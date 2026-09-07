# Support

RogueDashboard is engine-neutral and uses the same application container on Docker and Podman.

| Component | Supported baseline |
| --- | --- |
| Docker | maintained Engine releases with Compose v2 |
| Podman | maintained releases with a working Compose provider |
| Host | Linux and WSL 2 |
| Architecture | amd64 and arm64 |
| Network | external shared network such as `media-net` |

## Deployment model

- one `roguedashboard` container
- `/opt/media-server/roguedashboard` canonical install directory
- persistent `data/` and optional `custom/`
- no engine socket
- no privileged mode
- one `compose.yaml`
- one `update.sh` workflow for Docker and Podman

RogueForge is the supported companion for container management, updates, live logs and terminals.
