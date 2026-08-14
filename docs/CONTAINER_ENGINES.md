# Container engine support

Rogue Dashboard 1.1 introduces an engine-neutral container layer so the same dashboard image can run against Docker Engine or Podman.

## Supported modes

Set `CONTAINER_ENGINE` to one of:

- `auto` — probe the mounted API sockets and detect Docker or Podman.
- `docker` — require Docker Engine.
- `podman` — require Podman.

Set `CONTAINER_SOCKET` when the socket is not in a standard location.

Recommended sockets:

```text
Docker:          /var/run/docker.sock
Podman rootful:  /run/podman/podman.sock
Podman rootless: /run/user/<uid>/podman/podman.sock
```

The compatibility variables `DOCKER_SOCKET`, `DOCKER_AGENT_URL`, and `DOCKER_AGENT_TOKEN` remain accepted during the transition so existing installations do not break on upgrade.

## Podman deployment

Use `compose.podman.yaml` and mount the Podman API socket directly:

```yaml
volumes:
  - /run/podman/podman.sock:/run/podman/podman.sock:ro
```

Do not create a `/var/run/docker.sock` symlink for new Podman installs.

The engine agent uses Podman's Docker-compatible API for the cross-engine container operations Rogue Dashboard already supports: container discovery, state, health, stats, and lifecycle actions. Podman-specific capabilities can be added behind capability detection without breaking Docker hosts.

## Upgrade strategy

The 1.1 compatibility layer deliberately keeps the existing internal `docker_*` route/function names while changing the connection layer underneath. A later cleanup can rename those internals after the external deployment contract has moved to `CONTAINER_*` variables.

This approach avoids a flag-day migration and lets Docker and Podman users run the same release.
