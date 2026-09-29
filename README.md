# Skybound 2.0 — Clean Rebuild

This is a fresh Skybound codebase. It does **not** use the old v15 simulator bundle, external CDNs, npm, a service worker, or external assets.

## Upload to GitHub Pages
Delete the old repository contents and upload **everything inside this folder** to the repository root. `index.html` must be at the root beside `styles.css` and the `js` folder.

No build step is required.

## What is in this rebuild
- New navy / steel / cyan / amber visual identity
- GeoFS-inspired low-friction flow, but original Skybound code and UI
- PLAY → interactive world map → airport → clickable gate → hangar → spawn
- Northpoint, Coral Bay and distant Supersonic Island
- Supersonic Island restricted to Concorde for spawning
- Two fictional interceptor aircraft appear if a normal civil jet enters the restricted zone
- JX-90, JX-200 and a dedicated low-poly Concorde model
- New raw WebGL renderer with no third-party dependency
- Dense city world, roads and moving block traffic
- Few, fast NPC aircraft
- Manual ATC radio with Ground / Tower / Departure / Approach
- Configurable heading / altitude / speed autopilot
- Auto Land and deliberately forgiving touchdown logic
- Chase / cockpit / tower camera modes, with drag camera and wheel zoom
- Follow-aircraft minimap with + / − zoom and expandable mode
- Synthesized engine sound and optional faint ambient music
- Menu button genuinely returns to the new main menu
- HUD zones designed to avoid overlap

## Controls
- W / S — throttle
- Left / Right — roll
- Up / Down — pitch
- A / D — rudder / ground steering
- P — pushback toggle
- Mouse drag — orbit chase camera
- Mouse wheel — camera zoom

## Design note
GeoFS was used only as general inspiration for a simple flight-first experience. This project does not contain GeoFS code, assets, branding, or a copied interface.
