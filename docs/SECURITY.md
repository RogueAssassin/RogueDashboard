# Security

RogueDashboard is designed to remain outside the container-engine privilege boundary.

- The dashboard container does not mount Docker or Podman sockets.
- The browser never receives container-engine credentials.
- The container runs as an unprivileged user with a read-only root filesystem, all Linux capabilities dropped and `no-new-privileges`.
- Health monitoring is limited to configured HTTP/HTTPS endpoints.
- Integration secrets remain server-side in `RGDASH_*` environment variables and are not returned through the API.
- Administrator passwords are stored using scrypt-derived hashes and session tokens are stored as hashes.
- Keep `.env` and the `data/` directory private.
- Use HTTPS through a trusted reverse proxy or tunnel when exposing RogueDashboard outside the LAN.
- Set secure cookies when the public endpoint is HTTPS and restrict trusted proxy headers to your controlled proxy path.

RogueForge is the separate privileged companion for Docker/Podman management. Keeping monitoring and engine control in separate containers limits the impact of a dashboard compromise.
