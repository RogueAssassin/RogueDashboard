# Security model

Rogue Dashboard intentionally separates the public web application from the privileged container-engine API.

## Core boundary

- The browser never receives Docker or Podman socket access.
- The `dashboard` service does not mount the engine socket.
- The internal engine agent has no published host port.
- Dashboard-to-agent calls require a private bearer token.
- Only allow-listed metadata and container lifecycle operations are exposed.
- Service integration credentials remain environment variables and are not written into dashboard cards.

## Engine socket warning

A process with Docker or Podman API socket access should be treated as privileged infrastructure. The restricted agent reduces the application-facing interface, but compromise of that agent can still have host-level consequences.

For Podman, prefer the native socket path and least-privileged deployment mode compatible with the host. Do not create an unnecessary Docker socket compatibility symlink.

## Network separation

Keep the engine agent on its private internal network. Attach only the dashboard service to `media-net` and any optional application network required for service widgets.

## Public exposure

Put Rogue Dashboard behind a trusted reverse proxy for Internet-facing access, enable HTTPS, set secure cookies appropriately and configure `RGDASH_ALLOWED_HOSTS` when practical. Do not expose the engine agent.
