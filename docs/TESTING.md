# Testing

The `testing` branch is the proving ground before a release is promoted to `main`.

Every push validates:

- Python tests and syntax
- JavaScript syntax
- unified Compose configuration
- container image build
- multi-architecture publication after validation

## Run the testing channel

Existing installations can switch with:

```bash
cd /opt/media-server/roguedashboard
./update.sh testing
```

For a first testing installation, follow [Installation](INSTALLATION.md) and download files from the `testing` branch.

## Release validation

Before promotion to `main`, verify:

- administrator login and Customise
- browser-closed monitoring
- health and incident persistence after container restart
- Discord test, DOWN and RECOVERED delivery
- notification history
- maintenance and per-service silence
- RogueForge, RogueMediaValidator and RogueRoute integrations
- Docker and rootless Podman deployment behavior

The exact testing image/version belongs in the changelog rather than the general documentation.
