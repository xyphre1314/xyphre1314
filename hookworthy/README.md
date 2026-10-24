# Hookworthy

**Write posts people stop for.** A writing and scheduling app for X, Threads, LinkedIn and Bluesky. It's a single HTML file and PWA-ready.

## Run it

```sh
cd hookworthy
python3 -m http.server 8000
# open http://localhost:8000
```

Opening `index.html` directly also works. Serving over HTTP turns on the service worker and manifest.

## What's inside

| Route | What it is |
|---|---|
| `#home` | Landing page: a live feed that stops when your first line is good enough, the hook grader wall, a creator's morning, who it's for, one post in four feeds, pricing |
| `#start` | Onboarding: paste your @, get your voice and five posts in about 4 seconds |
| `#write` | Composer: thread editor, ghost text (Tab), riffs with a word-level diff, hook score, live previews, media, GIFs, polls, drag to reorder |
| `#ideas` | Capture (link → five angles, screenshot, voice memo), idea engine, inbox, remix top posts |
| `#hooks` | Hook grader plus a 36-hook library |
| `#queue` | Week calendar with drag between slots, golden slots, approvals for client posts, momentum, autopilot. Agenda view on phones |
| `#insights` | Insight-first analytics |
| `#voice` | Voice profile, tone sliders, never-say list |
| `#upgrade` | Pricing |
| `#brand` | Logo, color, type, motion and every component state |

Press `⌘K` / `Ctrl K` for the palette and `?` for all shortcuts.

## Files

- `index.html`: the whole app. Design tokens are documented at the top of the `<style>` block.
- `DESIGN.md`: name, brand, voice, type, color, spacing, motion and screen list.
- `CRITIQUE.md`: the review and what it changed.
- `brand/logo-directions.html`: six logo and brand directions to pick from.
- `PRODUCT.md`: who it's for and what it must never claim.
- `NAMES.md`: the naming search and domain checks (hookworthy.com).
- `assets/`: icon, wordmark, app icon (SVG and PNG).
- `manifest.webmanifest`, `sw.js`: PWA.

AI, publishing and analytics are local mocks. The `AI` object in `index.html` is the seam where a real model plugs in.
