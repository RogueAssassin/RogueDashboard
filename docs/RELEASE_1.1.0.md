# Rogue Dashboard 1.1.0

Rogue Dashboard 1.1.0 introduces first-class Docker and Podman support while preserving the existing restricted-agent security boundary.

## Highlights

- Native Podman API socket support at `/run/podman/podman.sock`.
- Docker Engine support remains available through `/var/run/docker.sock`.
- `CONTAINER_ENGINE=auto|docker|podman` engine selection.
- `CONTAINER_SOCKET` and `CONTAINER_AGENT_*` engine-neutral configuration.
- Backward-compatible `DOCKER_*` aliases for existing installations.
- New `compose.podman.yaml` deployment path for Podman hosts.
- Capability/probe-based runtime detection rather than a single hard-coded engine version.

## Podman migration

A Podman host can now mount its native API socket directly into the restricted agent:

```yaml
volumes:
  - /run/podman/podman.sock:/run/podman/podman.sock:ro
```

Recommended environment:

```dotenv
CONTAINER_ENGINE=podman
CONTAINER_SOCKET=/run/podman/podman.sock
```

This removes the requirement for a `/var/run/docker.sock` compatibility symlink on Podman-only systems.

## Compatibility

Existing Docker installations remain supported. Legacy `DOCKER_SOCKET`, `DOCKER_AGENT_URL`, and `DOCKER_AGENT_TOKEN` settings continue to work during the migration period.

## Validation

The 1.1.0 release keeps the existing application regression suite and release-metadata validation gates. Docker and Podman live-host validation should be completed before the draft pull request is merged.


## Branding and documentation

- Updated the full documentation set to describe Docker and Podman rather than a Docker-only deployment.
- Added coordinated Rogue Dashboard and RogueForge visual assets using the shared Midnight/Violet/Cyan theme.
- Added a GitHub Desktop validation workflow for locally tested source bundles.
