# GitHub Desktop local-test workflow

Use this when you test a prepared ZIP locally before pushing it.

1. Keep your current production `.env` and application data outside the source ZIP.
2. Extract the prepared source tree to a test directory.
3. Run the unit/syntax/release validation commands from the README.
4. Deploy the test tree with the engine-specific compose file.
5. Verify login, service widgets, container discovery, stats, start/stop/restart and agent health.
6. For Podman, verify `/run/podman/podman.sock` is mounted directly and `/var/run/docker.sock` is not required.
7. After testing, copy the source tree into the GitHub Desktop checkout **without replacing `.git/`**.
8. Review the diff and ensure `.env`, `data/`, backups, databases and generated tokens are not staged.
9. Commit and push the tested tree.
10. Wait for GitHub Actions before merging/tagging.
