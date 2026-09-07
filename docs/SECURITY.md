# Security

RogueDashboard stays outside the container-engine privilege boundary.

- no Docker or Podman socket
- no privileged mode
- unprivileged container user
- read-only root filesystem
- Linux capabilities dropped
- `no-new-privileges`
- health checks limited to configured HTTP/HTTPS endpoints
- integration secrets remain server-side
- administrator passwords use scrypt-derived hashes
- session tokens are stored as hashes

Keep `.env`, `data/` and backups private.

When exposing RogueDashboard outside the LAN, use HTTPS through a trusted reverse proxy or tunnel and enable secure cookies.

Container lifecycle, terminals and engine-level logs intentionally remain in RogueForge so a monitoring compromise does not automatically become container-engine access.
