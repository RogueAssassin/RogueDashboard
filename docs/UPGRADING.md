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
./update.sh 2.0.0
```

A leading `v` is also accepted.

## What the updater does

The updater:

1. detects Docker or Podman
2. backs up `compose.yaml`, `.env`, the updater and custom assets
3. downloads the requested Compose/updater files
4. preserves the administrator's existing environment configuration
5. updates the `RGDASH_IMAGE` tag
6. pulls and verifies the requested image
7. recreates RogueDashboard
8. verifies `/api/health`
9. refreshes `update.sh` for the next run

Persistent SQLite data in `data/` is never replaced by the updater.

Do not overwrite your existing `.env` with `.env.example`. New environment settings should be merged only when a release introduces them.
