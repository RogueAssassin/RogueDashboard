# Testing channel

The `testing` branch is the integration channel used before promotion to `main`.

Every push runs:

- Python unit tests
- Python syntax validation
- JavaScript syntax validation
- unified Compose validation
- container image build
- multi-architecture image publication after validation

Testing images:

```text
ghcr.io/rogueassassin/roguedashboard:testing
ghcr.io/rogueassassin/roguedashboard:1.8.1-testing
```

## Live Podman validation

Keep your existing `.env`, `data/` and `custom/`:

```env
RGDASH_IMAGE=ghcr.io/rogueassassin/roguedashboard:testing
```

```bash
podman compose --env-file .env -f compose.yaml pull
podman compose --env-file .env -f compose.yaml up -d
```

## Live Docker validation

```bash
docker compose --env-file .env -f compose.yaml pull
docker compose --env-file .env -f compose.yaml up -d
```

Validate Customise, background monitoring, incident persistence, Discord DOWN/RECOVERED delivery, notification history and native Rogue integrations before promotion.
