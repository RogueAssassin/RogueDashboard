# Upgrading

RogueDashboard upgrades are container replacements. Keep the existing `.env`, `data/` and `custom/` paths.

## Before upgrading

```bash
cp .env .env.backup
tar -czf roguedashboard-data-backup.tgz data custom
```

Do not replace your existing `.env` with `.env.example`; compare new variables and merge only what you need.

## Podman

```bash
cd /opt/media-server/roguedashboard
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/compose.yaml -o compose.yaml
podman compose --env-file .env -f compose.yaml pull
podman compose --env-file .env -f compose.yaml up -d
```

## Docker

```bash
cd /opt/roguedashboard
curl -fsSL https://raw.githubusercontent.com/RogueAssassin/RogueDashboard/testing/compose.yaml -o compose.yaml
docker compose --env-file .env -f compose.yaml pull
docker compose --env-file .env -f compose.yaml up -d
```

## After upgrading

Check the running version, Customise pages, background monitor status, Discord delivery status and at least one native integration. Existing SQLite data is migrated in place when required.

For stable releases, use the `main` branch compose file and the release image/tag rather than `testing`.
