# Updating

RogueDashboard includes `update.sh` so Docker and Podman installations use the same update workflow as RogueForge.

Run it from:

```bash
cd /opt/media-server/roguedashboard
```

## Stable production

```bash
./update.sh latest
```

## Testing channel

```bash
./update.sh testing
```

## Pinned release

```bash
./update.sh 2.3.0
```

A leading `v` is also accepted.

## What the updater does

The updater:

1. detects Docker or Podman
2. takes a consistent database backup and backs up `compose.yaml`, `.env`, the updater and custom assets to `backups/update/` (the newest 10 are kept)
3. downloads the requested Compose/updater files (nothing is installed yet)
4. pulls and verifies the requested image — if the tag does not exist, nothing has been changed
5. shows what will change in `compose.yaml`, then installs it
6. preserves the administrator's existing environment configuration and updates the `RGDASH_IMAGE` tag
7. recreates RogueDashboard
8. verifies `/api/ping`; if the new version does not become healthy it **rolls back** to the previously running image
9. refreshes `update.sh` for the next run

Only one update can run at a time. Keep local compose customisations (ports, labels, extra networks) in `compose.override.yaml`; the updater loads it automatically and never overwrites it.

Persistent SQLite data in `data/` is never replaced by the updater.

Do not overwrite your existing `.env` with `.env.example`. New environment settings should be merged only when a release introduces them.
