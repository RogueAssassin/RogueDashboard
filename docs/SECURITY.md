# Security

Rogue Dashboard uses a restricted agent boundary.

- The browser never receives access to a container-engine socket.
- The `dashboard` container does not mount Docker or Podman sockets.
- Only `engine-agent` mounts the selected engine socket.
- Dashboard-to-agent requests use `CONTAINER_AGENT_TOKEN` over the private Compose network.
- Both services run read-only root filesystems with dropped Linux capabilities and `no-new-privileges`.
- Keep `.env` private and use a long random agent token.
- Publish the web service through a trusted reverse proxy when exposing it outside the LAN.
