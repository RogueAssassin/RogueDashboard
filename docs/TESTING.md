# RogueDashboard testing channel

The `testing` branch is the integration branch for features that need live validation before they are promoted to a release branch or `main`.

Every push to `testing` runs the full application test suite, Python validation, Compose validation and a local amd64 container build. If validation passes, GitHub Actions publishes multi-architecture testing images:

- `ghcr.io/rogueassassin/roguedashboard:testing`
- `ghcr.io/rogueassassin/roguedashboard:1.2.0-testing`
- immutable SHA tag
- equivalent legacy-package testing tags under `ghcr.io/rogueassassin/rogue-dashboard`

For a live Podman test, keep the existing `.env`, `data/` and `custom/` directories and temporarily set:

```env
RGDASH_IMAGE=ghcr.io/rogueassassin/roguedashboard:testing
```

Then use the normal unified Compose file:

```bash
podman compose --env-file .env -f compose.yaml pull
podman compose --env-file .env -f compose.yaml up -d
```

Do not replace the existing `.env` with `.env.example` during testing. Promote tested changes from `testing` back to the release branch, then merge the release branch to `main` when live validation is complete.
