# Changelog

RogueDashboard follows semantic versioning for published GHCR releases.

## 1.4.0

- Promoted the fully validated 1.4.0 testing cycle to stable.
- Stable images publish as `ghcr.io/rogueassassin/roguedashboard:1.4.0` and `:latest`.
- Preserves existing `.env`, data-volume configuration and local custom assets during container upgrades.
- Added a lightweight keyboard command palette with `Ctrl+K` / `/` shortcuts.
- Added per-card favourites and tags with `fav:` and `tag:<name>` search filters.
- Added per-card launch modes for new tab, same tab and copy-URL workflows.
- Added configurable endpoint health method, timeout and accepted HTTP status range.
- Preserved the existing 30-second browser refresh, 15-second health cache and bounded health worker pool to avoid increasing monitoring load.
- Changed imported/default dashboard wording from Docker-specific naming to `My RogueDashboard`.
- Removed obsolete dead container-management JavaScript from the socket-free frontend.
- Added regression tests for the new dashboard schema fields and configurable health probes.
- Added a dependency-free Custom API widget for mapping up to four JSON dot-path values onto a service card.
- Added optional Bearer-token and X-Api-Key authentication using server-side `RGDASH_*` environment references.
- Bounded Custom API response size, metric count, label/path length and output length to protect dashboard performance.
- Reused the existing cached widget refresh path; Custom API widgets add no separate timer or background polling loop.
- Added regression tests for nested/list JSON paths, secret non-disclosure and configuration bounds.
- Added native Nginx Proxy Manager metrics for proxy-host totals, enabled hosts, certificate totals and 30-day certificate expiry.
- Added server-side NPM bearer-token support through `RGDASH_NPM_TOKEN`.
- Added native Uptime Kuma status-page metrics for monitor totals, up/down state and average 24-hour uptime.
- Uptime Kuma integration deliberately uses published status-page JSON endpoints instead of its unstable internal Socket.IO administration API.
- Reused the existing widget cache/refresh path for both integrations; no new background timer or container-engine dependency was introduced.
- Added import auto-detection and regression tests for NPM and Uptime Kuma.
- Added lightweight runtime storage, memory-scope, normalized load and local network information to the dashboard information layer.
- Added a bounded in-memory one-hour health history with availability percentage and average latency per monitored service.
- Capped history at 120 samples per service and deliberately avoided SQLite history writes to preserve storage and CPU performance.
- Added compact dashboard-wide availability and data-storage summary tiles plus per-card one-hour availability context.
- Added Admin runtime storage/network details without introducing Docker/Podman socket access.
- Added regression tests for runtime information fields, socket-free behavior and bounded health-history summaries.
- Added explicit degraded/offline card styling and last-failure/last-recovery health context.
- Improved responsive behavior for the expanded runtime information strip across desktop, tablet and mobile widths.
- Added refresh de-duplication so a slow monitoring cycle cannot overlap with the next scheduled cycle.
- Paused normal monitoring requests while the dashboard tab is hidden and resume-refreshes when visible again.
- Added a 10-second shared runtime-stat cache to avoid repeated filesystem, storage and network reads across multiple browser clients.
- Kept widget, health, system and history request failures isolated so one unavailable service cannot block the rest of the dashboard.
- Added regression coverage for runtime snapshot caching and recovery timestamps.

## 1.3.5

- Integrated the corrected approved RogueDashboard icon-pack artwork into the runtime UI.
- Standardized all active RogueDashboard branding on the corrected `roguedashboard-approved-128.png` asset so GitHub README rendering, browser icons and runtime UI all use the same source.
- Reworked the main shell for tighter header, stats, group-title and service-card alignment.
- Reduced unnecessary blur/shadow work while retaining the Rogue purple/cyan visual identity.
- Rebuilt the Customise experience into clearer Appearance, Layout, Connect and Admin sections.
- Grouped related settings into consistent editor cards with improved descriptions and responsive spacing.
- Reworked the administrator sign-in modal to match the RogueDashboard setup/customiser design.
- Added explicit sign-in progress/error feedback and consistent session messaging.
- Removed the remaining obsolete pre-socket-free container discovery binding from the customiser.
- Replaced stale engine-agent administration presentation with RogueDashboard runtime/session information.
- Improved mobile/tablet behaviour for the dashboard, customiser and authentication surfaces.
- Updated the README banner to load the corrected RogueDashboard PNG from an absolute raw GitHub URL with cache-busting, avoiding GitHub's unreliable nested/relative image rendering.
- Replaced the old README badge row with container-release style release, GHCR, live build, runtime, engine and platform badges.
- The README build badge now follows the testing CI workflow live on every push.
- Removed superseded RogueDashboard SVG branding assets so all active core branding resolves to the approved artwork.
- Fixed the README header so the approved RogueDashboard artwork renders directly in GitHub instead of relying on an SVG that referenced another repository asset.
- Advanced the testing line from 1.3.1 to 1.3.5 to clearly identify this broader visual/authentication/README refresh.
- Kept existing `RGDASH_*`, `.env`, database and custom-asset compatibility intact.

## 1.3.0

- Promoted the polished socket-free dashboard architecture to the next stable feature release.
- Finalized a new interlocked metallic **RD** monogram with dedicated base, dark, light and compact SVG variants.
- Kept RogueDashboard branding independent from RogueForge while aligning both products to the same Rogue visual language.
- Removed release/runtime/platform/license badges and legacy engine-agent presentation from the live dashboard.
- Added native RogueForge service-card monitoring for application version, engine, stacks and container summaries.
- Kept RogueDashboard free of Docker/Podman socket access and administrator credentials from RogueForge.
- Improved the main status layout and removed obsolete container-management UI left over from the pre-1.1.3 architecture.
- Standardized the runtime folder, container, Compose project and GHCR identity around `roguedashboard`.
- Retained `RGDASH_*` as the stable environment-variable contract.
- Preserved existing `.env`, SQLite data, users, pages, groups, integrations and local custom assets during upgrades.
- Continued unified Docker/Podman deployment through one `compose.yaml`.
- Added cache-busted bundled core branding so testing and production builds cannot display stale artwork from another branch.
- Cleaned and simplified the README around what RogueDashboard does, how it works and how it complements RogueForge.
- Added a prominent RogueForge GitHub link for users who also want container and Compose-stack management.
- Updated the testing channel and release workflows for `1.3.0`.

## 1.2.1

- Removed the version/runtime/platform/license badge strip from the live dashboard; release metadata now lives in the README.
- Removed the remaining stale engine-agent status presentation from the socket-free interface.
- Added a native RogueForge card integration for version, engine, stack and container summary metrics.
- Reworked the RD logo into a higher-detail metallic Rogue-style monogram with segmented purple/cyan illumination.
- Added dedicated base, dark, light and compact SVG variants and cache-busted all live branding references.
- Removed legacy PNG favicon references from the live page and web manifest so browsers consistently use the current RD SVG identity.
- Switched the core RogueDashboard icon to a bundled 1.2.1 asset instead of fetching the older `main` logo during testing.
- Added a new version-neutral README banner and simplified installation, upgrade, architecture and testing documentation.
- Updated the testing channel to publish `1.2.1-testing`.
- Preserved `RGDASH_*`, `.env`, SQLite data and custom assets across upgrades.


## 1.2.0

- Standardized product naming from **Rogue Dashboard** to **RogueDashboard**.
- Standardized the canonical internal container/network identity as `roguedashboard`.
- Replaced separate Docker and Podman compose files with a single engine-neutral `compose.yaml`.
- Standardized the GHCR image path as `ghcr.io/rogueassassin/roguedashboard`.
- Retained the existing `RGDASH_*` environment-variable contract for compatibility with 1.1.3 installations.
- Added the legacy `rogue-dashboard` network alias as a transition compatibility alias.
- Kept the proven 1.1.3 socket-free architecture; container and stack management remains owned by RogueForge.
- Prepared RogueForge-style remote-first branding and image resolution with local `/custom` overrides.
- Updated documentation and deployment examples for the renamed GitHub repository and runtime folder.
- Removed the stale 1.1.3 engine-agent health/system calls that could break socket-free deployments.
- Added lightweight runtime/platform metadata without mounting Docker or Podman sockets.
- Added an in-place SQLite filename migration from `rogue-dashboard.sqlite` to `roguedashboard.sqlite`.
- Added dual GHCR publishing so existing `RGDASH_IMAGE=ghcr.io/rogueassassin/rogue-dashboard:...` values remain valid during upgrades.
- Added remote-first service artwork with local `/custom/icons` overrides and bundled fallbacks.
- Added RogueForge artwork for RogueForge service cards.
- Refreshed the interface with the cleaner RogueForge surface, border and typography treatment while keeping animations and effects lightweight.
- Added migration and socket-free health regression tests.
- Removed version/runtime/platform/license badges from the live dashboard and kept build metadata in project documentation.
- Removed the remaining engine-agent status tile and obsolete container-management editor surface from the socket-free UI.
- Added a native RogueForge widget that reads public RogueForge status/stack summaries without exposing engine sockets or credentials.
- Upgraded the RogueDashboard RD branding to a higher-detail vector set with segmented Rogue neon rings, metallic depth, dark/light variants and a compact service-card mark.
- Tightened the dashboard status row and reduced unnecessary UI work for a cleaner, faster live view.

## 1.1.3

- Removed direct Docker and Podman container-engine management from RogueDashboard.
- Removed the engine-agent service and all engine socket mounts.
- Removed container lifecycle controls and engine inventory APIs.
- Simplified Docker and Podman deployments to one RogueDashboard container.
- Retained service integrations, HTTP/API health monitoring, widgets, admin/session controls and persistent configuration.
- Kept synchronized RogueDashboard branding and browser/app icon assets.
- Simplified server upgrades to Compose `pull` + `up -d`.
- Established RogueForge as the home for container/stack management.

## 1.1.2

- Introduced synchronized Rogue branding and browser/app icon assets.
- Added Docker/Podman engine abstraction work that was later removed in 1.1.3 after production testing showed the management layer added unnecessary deployment complexity.

## 1.1.0

- Added first-class Docker and Podman experiments and engine-neutral configuration.

## 1.0.1

- Improved container health and RogueRoute integration.

## 1.0.0

- Initial stable public release series.
