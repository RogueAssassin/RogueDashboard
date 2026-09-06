# RogueDashboard Roadmap to v2.0.0

RogueDashboard v2.0.0 is the point where the application becomes the complete always-on visibility, uptime, incident and notification layer for the Rogue media-server stack.

The v2 release must be able to replace Uptime Kuma for day-to-day monitoring while keeping RogueDashboard lightweight, socket-free and clearly separated from RogueForge's privileged container-management responsibilities.

## v2.0 release principles

- No browser dependency for monitoring, history or notifications.
- No hidden configuration: important settings must be editable from the Customise UI.
- No Docker or Podman socket inside RogueDashboard.
- No duplicate container-management features already owned by RogueForge.
- No requirement for Uptime Kuma or Dozzle once their Rogue replacements are validated.
- Persistent configuration and monitoring data must survive upgrades and container restarts.
- Docker and rootless Podman must remain first-class deployment targets.
- The default experience must stay clean; advanced controls belong in Customise rather than cluttering the dashboard.

## v1.4.1 — monitoring foundation

Status: completed.

- Server-side monitoring continues when all browsers are closed.
- Persist health samples and monitor state in SQLite.
- Configurable probe interval, failure threshold and retention.
- Discord webhook outage and recovery notifications.
- Per-service alert enable/disable.
- Background monitor status and Discord test action in Customise → Connect.
- Restore clear Customise access.
- Add RogueMediaValidator branding.
- Use one unified Docker/Podman Compose file.
- Remove stale engine-agent/socket documentation.

Exit criteria:

- 24+ hours of browser-closed monitoring without missed probes.
- Container restart preserves historical samples.
- Confirmed outage and recovery Discord tests succeed against real media-server services.
- No alert storm during normal application/container restarts.
- CPU and memory usage remain negligible for the media-server host.

## v1.5.0 — complete Customise system

Status: completed.

Goal: every visible dashboard structure must be editable without touching JSON or SQLite.

Appearance:

- Dashboard title and subtitle.
- Theme preset, primary/secondary accent, glow and surface opacity.
- Background mode and custom background.
- Density and visual effects.
- Optional visibility controls for dashboard header, search, page tabs, statistics and footer.

Pages:

- Edit page title.
- Add, delete and reorder pages.
- Optional default/start page.
- Move sections between pages.
- Preserve page layout through upgrades/imports.

Sections:

- Edit section title.
- Cards per row from 1–6.
- Reorder sections.
- Move section to another page.
- Collapse-by-default option.
- Section visibility toggle.
- Section type/layout where useful.
- Inline preview while editing.

Cards:

- Edit title, description, icon and launch URL.
- Health endpoint and HTTP method/status range.
- Per-card Discord alerts.
- Favourite and tags.
- Card ordering and drag/drop.
- Move card between sections/pages.
- Optional hide/show latency, status and history per card.
- Card size/span support where it can remain responsive.

Customiser UX:

- Explicit labels such as Page title, Section title and Cards per row.
- Unsaved-change indicator.
- Cancel/discard confirmation.
- Save validation with useful field-level errors.
- Reset individual areas instead of only global appearance defaults.
- Keyboard accessibility and proper focus management.
- Responsive customiser that is fully usable on tablet/mobile.
- Regression tests for every persisted customisation field.

## v1.6.0 — uptime and incident engine

Status: completed in 1.7.x testing.

Goal: replace the monitoring functions currently provided by Uptime Kuma.

- Persistent incidents table separate from raw health samples.
- Confirmed DOWN, DEGRADED and RECOVERED lifecycle.
- Outage start/end/duration.
- Last successful probe and last failure reason.
- Configurable retry/failure threshold globally and per service.
- Grace period for planned application restarts.
- Maintenance windows and temporary alert silencing.
- Manual acknowledge/resolution notes.
- Rolling 1h, 24h, 7d and 30d availability.
- Latency averages and percentile summaries.
- Bounded data retention and periodic cleanup.
- Incident timeline UI.
- Service detail view with historical availability and latency.
- Monitor self-health watchdog so a dead monitor thread is visible immediately.
- Startup recovery so services already offline before RogueDashboard restarts are handled correctly without false recovery messages.

## v1.7.0 — notification centre

Status: completed in 1.7.1 testing.

Goal: make RogueDashboard self-sufficient for outbound operational alerts.

Discord webhook:

- Outage notification.
- Recovery notification.
- Degraded-state notification.
- Configurable recovery/outage toggles.
- Per-service notification override.
- Test notification.
- Notification history and delivery result.
- Deduplication/cooldown.
- Retry/backoff for temporary Discord failures.
- Clean Rogue-branded embed formatting.
- No secret/webhook exposure to the browser.

Notification rules:

- Global quiet hours.
- Maintenance suppression.
- Minimum outage duration before notification.
- Optional repeat notification for prolonged incidents.
- Alert grouping to avoid floods when many dependent services fail together.
- Notification channels designed behind a common interface so email/other providers can be added later without rewriting the monitor.

Optional Discord bot — not required for v2.0:

A bot should only be introduced for two-way commands such as:

- `/status`
- `/incidents`
- `/uptime <service>`
- `/silence <service> <duration>`

Privileged container actions such as restart/log access must remain delegated to RogueForge rather than implemented directly in RogueDashboard.

## v1.8.0 — Rogue ecosystem integration

Status: active testing.

RogueForge:

- Read-only RogueForge status integration remains the management bridge.
- Link directly from an unhealthy service to the relevant RogueForge log/container view where possible.
- Surface stack/container state without granting RogueDashboard engine access.
- Keep all restart/update/log control inside RogueForge.
- Validate RogueForge live logs before removing Dozzle from the media-server stack.

RogueMediaValidator:

- Approved logo and icon aliases.
- Native health card defaults.
- Optional lightweight API metrics if RogueMediaValidator exposes useful safe read-only endpoints.
- Link validation incidents without duplicating validator functionality inside Dashboard.

RogueRoute GPX:

- Preserve native private-health endpoint handling.
- Maintain separate web/OSRM/manager states.
- Improve grouping/presentation as one logical RogueRoute application when useful.

## v1.9.0 — migration and container removal release candidate

Goal: prove the Rogue stack can operate without duplicate utility containers.

Uptime Kuma removal gate:

- RogueDashboard monitoring remains stable with all browsers closed.
- 7+ days of persistent uptime data validated.
- Real outage/recovery notifications verified.
- Maintenance and alert suppression verified.
- Restart/reboot persistence verified.
- Notification failures are visible and retried appropriately.
- No material monitoring feature still requires Uptime Kuma.

Once all gates pass:

- Remove the Uptime Kuma card/integration from the default dashboard.
- Remove Uptime Kuma from the media-server Compose stack.
- Remove obsolete Uptime Kuma-specific code/docs after a migration grace period.

Dozzle removal gate:

- RogueForge live logs are stable under Docker and rootless Podman.
- Follow, pause, search/filter, timestamp and reconnect behavior verified.
- Large logs do not cause unbounded browser/server memory growth.
- Stack-wide and single-container logs are reliable.

Once those gates pass:

- Remove Dozzle from the media-server stack.
- Use RogueForge as the single container-log interface.

## v2.0.0 — production release

v2.0.0 ships only when the following are true:

Monitoring:

- Always-on server-side monitor proven stable.
- Persistent availability/history survives restarts and upgrades.
- Incident lifecycle is reliable and tested.
- Maintenance/silence controls work.
- Monitoring self-health is visible.

Notifications:

- Discord webhook outage/recovery notifications are production-ready.
- Delivery retry/deduplication works.
- Per-service and global alert controls work.
- Notification history is available.

Customisation:

- Dashboard, page and section titles are editable.
- Cards per row is directly configurable per section.
- Pages/sections/cards are addable, removable, reorderable and movable.
- Appearance controls are complete and persistent.
- All important customisation is available from the UI.
- Responsive layout remains correct from desktop to mobile.

Operations:

- One unified Docker/Podman Compose file.
- No engine socket in RogueDashboard.
- Safe read-only container runtime.
- Clean upgrade path from 1.x databases/configuration.
- Backup/export and restore tested.
- CI validates Python, JavaScript, Compose, migrations and container build.
- AMD64 and ARM64 testing images publish successfully.
- Documentation matches the actual runtime.

Stack consolidation:

- Uptime Kuma removed after validation.
- Dozzle removed after RogueForge logging validation.
- RogueDashboard remains monitoring/visibility/notifications.
- RogueForge remains management/logs/updates.
- RogueMediaValidator remains media validation/protection.

## Post-v2 ideas

These are explicitly not blockers for v2.0.0:

- Optional Discord bot with read-only commands.
- Additional notification providers.
- Multi-host read-only RogueDashboard agents.
- Public/private status-page views.
- SSL certificate expiry monitoring.
- Dependency-aware incident grouping.
- Scheduled reports and uptime summaries.
- Prometheus/OpenMetrics export.
