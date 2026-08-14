# Deployment guide

This guide covers release/developer validation for Rogue Dashboard 1.1.0.

## Before publishing

1. Confirm all release metadata reports `1.1.0`.
2. Run the Python tests and syntax validation.
3. Validate both Docker and Podman compose definitions where tooling is available.
4. Test Docker Engine lifecycle operations.
5. Test native Podman lifecycle operations against `/run/podman/podman.sock`.
6. Confirm the dashboard service has no engine socket mount.
7. Confirm the engine agent has no published host port.
8. Verify `.env`, `data/` and `custom/` survive replacement.

## Local validation

```bash
python -m unittest discover -s tests -v
python -m compileall -q app
sh -n install.sh migrate-env.sh upgrade.sh scripts/validate-release.sh
sh scripts/validate-release.sh
```

Docker:

```bash
docker compose -f docker-compose.yaml config
```

Podman:

```bash
podman-compose --env-file .env -f compose.podman.yaml config
```

## GitHub Desktop workflow

For a manually tested source bundle:

1. Extract the prepared 1.1.0 tree outside your repository.
2. Back up the local repository checkout.
3. Copy the prepared tree into the GitHub Desktop checkout, preserving `.git/`.
4. Review every changed file in GitHub Desktop.
5. Ensure no `.env`, database, backup archive or generated secret is staged.
6. Commit the tested source with a clear 1.1.0 dual-engine message.
7. Push to a feature branch and allow Actions to complete before merge/tagging.

Do not tag `v1.1.0` until Docker and Podman live-host validation pass.
