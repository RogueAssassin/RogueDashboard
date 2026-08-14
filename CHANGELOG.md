# Changelog

Rogue Dashboard follows semantic versioning for published GHCR tags.

## 1.1.2

- Fixed engine-agent separation so the web dashboard no longer probes or requires an engine socket.
- Simplified production deployment to GHCR + `.env` + one engine-specific Compose manifest.
- Removed Linux install/upgrade/migration helper shell scripts and obsolete Compose overlays.
- Added clean Docker and Podman manifests using the same private `engine-agent` architecture.
- Refreshed browser, app, website, README and release branding as one synchronized visual set.
- Added favicon ICO/PNG sizes, Apple touch icon, 192/512 app icons and web manifest.
- Updated Dockerfile, CI/publish workflows, documentation and examples for 1.1.2.
- Preserved native Podman socket use without `/var/run/docker.sock` compatibility links.

## 1.1.0

- Introduced first-class Docker and Podman engine detection and native Podman API support.
- Added the engine-neutral `CONTAINER_*` configuration contract and Podman Compose deployment.

## 1.0.1

- Improved container health handling and RogueRoute health integration.

## 1.0.0

- Added administrator-session review, action history and migration support.
