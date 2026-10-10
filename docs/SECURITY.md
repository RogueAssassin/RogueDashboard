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

## Operational safeguards

- request threads have a 15 second socket timeout and the number of simultaneous connections is bounded
- unexpected errors return a JSON `500` instead of silently dropping the connection
- failed logins are throttled per real client address (see [Reverse proxy](REVERSE_PROXY.md))
- `/api/ping` and the container healthcheck fail when background monitoring stalls
- `reset-password` is a local CLI action; it requires access to the container, not the network
- status endpoints (`/api/bootstrap`, `/api/health`, `/api/system`, `/api/widgets` …) are readable without
  signing in by design. They reveal service names, internal URLs and host details, so do not expose the
  dashboard publicly without an access-control layer (VPN, Cloudflare Access, proxy authentication).
