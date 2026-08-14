# Roadmap

Rogue Dashboard 1.1 establishes the dual-engine foundation: one dashboard, one restricted agent contract, native Docker and Podman sockets.

## 1.1 foundation

- Docker + Podman engine detection and native sockets.
- Container discovery, networks, runtime health/stats and confirmed lifecycle actions.
- Browser setup, local authentication, pages, widgets and themes.
- Narrow privileged agent boundary.

## Next Dashboard milestones

- Rename remaining historical internal `docker_*` implementation labels to engine-neutral names without breaking migrations.
- Surface engine identity/version/capabilities in the Admin UI.
- Add regression tests dedicated to Docker and Podman detection paths.
- Improve rootless Podman documentation and validation.
- Add optional multi-host read-only agents with explicit identity and permissions.

## RogueForge companion

RogueForge is the stack-management companion using the same Rogue visual language. Planned capabilities include compose editing, `.env` management with secret masking, stack lifecycle, logs, updates, networks, volumes, Podman pods, rollback snapshots and controlled multi-host management.

Rogue Dashboard should remain focused on visibility and safe service controls rather than becoming a full privileged orchestration console.
