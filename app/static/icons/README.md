# Bundled offline icons

RogueDashboard ships compact local artwork for recognised services so normal dashboard use does not depend on an external icon provider.

- Service artwork is selected from the service name, widget type or configured icon filename.
- User-provided artwork belongs in `custom/icons/` and overrides bundled assets.
- The app header, setup/login/admin surfaces and browser tab use the 2.4 monogram `/icons/roguedashboard.svg`, which adapts to light and dark.
- `/icons/roguedashboard-approved-128.png` remains for the installable app icon, service cards and the README.
- `/icons/roguemediavalidator-approved-128.png` is bundled so RogueMediaValidator cards have a local icon.
- RogueRoute GPX, OSRM and Manager retain separate route, engine and protected-manager glyphs.
- Initials are used when no bundled, remote or custom match exists.

The bundled third-party-style glyphs are convenience artwork and are not presented as official product logos. Product names and trademarks belong to their respective owners.
