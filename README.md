# Skybound Production Rebuild

This build preserves the known-working v14 simulator/aircraft logic while separating the project into maintainable CSS and JS files.

## Upload
Upload the entire contents of this folder to the root of your GitHub Pages repository. Keep the `css` and `js` folders unchanged.

## Structure
- `index.html` — page shell
- `css/base.css` — original simulator styles
- `css/enhancements.css` — existing v11 styles
- `css/fleet.css` — existing v13 styles
- `css/passenger.css` — passenger mode styles
- `css/v14.css` — v14 styles
- `css/redesign.css` — new visual redesign only
- `js/game.bundle.js` — original working simulator engine bundle
- other JS files preserve the original v14 startup order

No CDN, service worker, npm build, or external assets are required.
