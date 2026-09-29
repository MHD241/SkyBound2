# Skybound 2.1 — Visual Recovery

This build intentionally restores the richer proven Skybound rendering/game foundation after the experimental 2.0 rewrite was too visually basic.

## Upload
Delete the current repository contents and upload the contents of this folder to the repository root. GitHub Pages needs no build step.

## What this build prioritises
- Proven self-contained renderer that already worked in Safari/GitHub Pages
- Rich airport environment and terminal layout
- Dense cities and traffic
- Three-country world and sea
- JX aircraft plus Concorde/supersonic gameplay
- Manual ATC frequencies and Ground/Tower/Departure/Approach
- Engine audio and optional faint music
- Existing flight systems preserved

This is the new visual baseline. New menu/passenger/autopilot features should be rebuilt incrementally on top of this baseline rather than replacing the renderer again.


## Split-file package
This package includes `assets/styles.css` and separate JavaScript files in `assets/`. Upload **all files and folders** together to GitHub Pages.
