# Rogue Dashboard 1.1.2

1.1.2 is the clean-deployment and branding synchronization release.

## Fixed

The web dashboard no longer executes container-engine detection when it is configured to use the private engine agent. This removes the 1.1.2 failure where the web container could exit with `No Docker or Podman API socket is reachable` despite a healthy agent.

## Deployment

Production hosts do not need a Git checkout or helper scripts. Keep only `.env`, persistent `data/` and `custom/`, and the engine-specific Compose manifest. Pull the application from GHCR.

## Security boundary

Only `engine-agent` receives `/run/podman/podman.sock` on Podman or `/var/run/docker.sock` on Docker. The dashboard communicates with the agent over the private Compose network using `CONTAINER_AGENT_TOKEN`.

## Branding

The README hero, website logo, favicon, Apple icon, 192/512 icons and release artwork all derive from the same Rogue Dashboard 1.1.2 identity.
