# Hookworthy server

Serves the app and gives it real Claude, real imports and real posting. Nothing is required: each missing key turns one feature off and the app keeps working in the browser.

```bash
cd hookworthy/server
cp .env.example .env    # add the keys you have
npm install
npm start               # http://localhost:8787
npm test                # 28 tests, no keys or network needed
```

## Which Claude does what

| Work | Model | Why |
|---|---|---|
| Rewrites, hook critiques, ideas, post-mortems, people patterns | `claude-sonnet-5-5` (effort low/medium) | Runs many times a day per person; fast and affordable at scale, strong writer |
| Learn my voice (reads up to 120 posts once) | `claude-opus-5-5` (effort high) | One deep read that every later rewrite depends on |

Every request opts into server-side refusal fallbacks (`fallbacks: "default"`). Prompts live in `../core.js`, shared with the browser and the MCP server, so every path asks the same way.

Opened as a claude.ai artifact instead, the app uses the viewer's own Claude (the `sample` capability: `default` tier for writing, `complex` for voice study). No server or key needed.

## Endpoints

| | |
|---|---|
| `GET /api/health` | What's switched on |
| `POST /api/ai` `{prompt, tier, json, docs?}` | Claude, routed by tier (used by the app). `docs`: up to 3 PDFs or images (PNG, JPEG, GIF, WebP, 5 MB each) as base64 (`{name, mime, data}`), sent to Claude as document or image blocks, for briefs and Picture to post |
| `POST /api/media` `{data}` or `{url, alt?}` | Stores a picture or GIF for posting: a base64 data URL, or a GIPHY link (only `*.giphy.com` over https). Images up to 5 MB, GIFs up to 15 MB. Returns `{id, kind, mime, bytes}`; pass the id in `posts[].media` |
| `GET /api/x/radar?handles=a,b` | Reply radar: original posts from those accounts in the last 2 hours, ranked by how much an early reply is worth (freshness, pace, reach, how crowded the replies are), with the reasons. Up to 30 handles, cached 3 minutes. Uses X search, so it counts against your X API plan |
| `GET /api/gifs?q=&offset=` | GIF search through GIPHY (trending when `q` is empty). Needs `GIPHY_API_KEY`; results cached 15 minutes per query because beta keys allow 100 calls an hour |
| `GET /api/x/me` | Re-checks the connected X account's plan (`subscription_type`, falling back to `verified_type`). Paid plans (Basic, Premium, Premium+) get 25,000-character posts; everyone else 280. Also returned as `xTier` in `/api/health` |
| `GET /api/x/posts?handle=&max=` | An account's original posts with public metrics (X API, bearer token) |
| `GET /api/x/people?handles=a,b` | Top recent posts from people you learn from |
| `GET /api/x/metrics?ids=` | Fresh metrics for posts, for post-mortems |
| `POST /api/typefully/import` `{key}` | Your published and scheduled Typefully drafts (key used once, never stored) |
| `POST /api/publish` `{posts, platforms}` | Post now to X (as a thread) and/or LinkedIn. Each post is a string or `{text, media:[ids]}`; X gets up to 4 per post (uploaded in chunks, with alt text), LinkedIn gets every picture in one post |
| `POST /api/schedule` `{posts, at, platforms}`, `GET /api/queue`, `DELETE /api/queue/:id` | The posting queue; checked every 30 s |
| `POST /api/v1/check` `{text, never?, limit?, history?}` | Hook score + pre-post checks, no key needed. Send `history` (your past posts with likes, reposts, replies) and it also returns `mine`: the score tuned to your posts, what helps and hurts this line for you, and how the tuned score did on your newest posts |
| `GET/POST /api/breakout` | Breakout alerts: status, and settings `{on, email, median, voice, subscribe, unsubscribe}`. `median` is your typical post's engagement (the app sends it from your history); `subscribe` is a browser push subscription |
| `GET /api/breakout/alerts?since=` | Alerts so far (the open app checks every minute) |
| `POST /api/breakout/test` | Sends a test alert to your devices and email |
| `POST /api/v1/rewrite` `{text, kind, voice?}` | Three rewrites in a voice |
| `POST /api/v1/ideas` `{niche, notes, top}` | First lines to write today |
| `GET /api/x/replies?id=` | First-hour replies to a post, ranked (questions and reach first) |
| `POST /api/x/reply` `{inReplyTo, text}` | Reply as you |
| `POST /api/review`, `PUT/GET /api/review/:id`, `POST /api/review/:id/comments`, `GET /r/:id` | Review links: a public-by-link draft page with comments per post |
| `POST /api/digest/subscribe` `{email, digest}`, `/api/digest/unsubscribe` | Sunday 9 AM email of the week's note (Resend, or logged) |
| `PUT/GET /api/sync/:id` | End-to-end encrypted sync: the browser encrypts with a key derived from your sync code; the server stores ciphertext only |
| `/auth/x/start`, `/auth/linkedin/start` | Connect accounts for posting |
| `/login?token=` | Signs a device in when `HOOKWORTHY_TOKEN` is set (the server prints the link) |

## MCP (for Claude Desktop, Claude Code, any MCP client)

```bash
claude mcp add hookworthy -- node /path/to/hookworthy/server/mcp.mjs
```

Tools: `grade_hook`, `check_post`, `rewrite_in_voice` (needs `ANTHROPIC_API_KEY`), `schedule_post` (needs the server running; set `HOOKWORTHY_URL`).

## Importing your history

- **X archive** (best: every post, with likes and reposts): x.com → Settings → Your account → Download an archive of your data. Drop the .zip, or `data/tweets.js`, into Bring your posts. Parsed in the browser.
- **@handle**: needs `X_BEARER_TOKEN`. X's API returns roughly your last 3,200 posts; the archive has everything.
- **Typefully**: API key (server) or a CSV export (no server).
- **LinkedIn**: your data export's `Shares.csv`, or any CSV with a text column.
- **People you learn from**: handles (server) or paste their posts.

X doesn't allow scraping, so there is no scraper here; the archive and the official API are the two supported routes.

## Deploy

One container serves the app and the API:

```bash
cd hookworthy
docker build -f server/Dockerfile -t hookworthy .
docker run -p 8787:8787 -v hookworthy-data:/data --env-file server/.env hookworthy
```

Or on Render: New → Blueprint, point it at this repo (`hookworthy/server/render.yaml`), fill the keys. Set `PUBLIC_URL` to your https URL and register `{PUBLIC_URL}/auth/x/callback` and `{PUBLIC_URL}/auth/linkedin/callback` with X and LinkedIn. With `HOOKWORTHY_TOKEN` set, open the `/login?token=…` link the server prints once per device.

## Security notes

- Binds to `127.0.0.1` by default. If you open it up, set `HOOKWORTHY_TOKEN`.
- OAuth tokens live in `server/data/` (mode 600). The Typefully key is never written anywhere.
- Media for posts is stored in `server/data/media/` (mode 600), named by a hash of its bytes. `/api/media` only fetches https links on GIPHY's own hosts, so it can't be used to reach other addresses.
- Breakout alerts: each post sent through Hookworthy is checked at minutes 5, 10, 15, 20, 25, 30, 40, 50 and 60 with one batched X lookup for everything being watched (about nine reads per post, only while alerts are on). It alerts once, between minute 8 and 45, when a post is at 3× your usual engagement for that minute and at least 12. "Usual" comes from your history until five watched posts teach it your real first-hour pace. Push uses Web Push with VAPID keys the server makes on first use (kept in `server/data/vapid.json`); push endpoints must be https. Email goes through Resend when `RESEND_API_KEY` is set, and is only logged otherwise.
- X asks for the `media.write` scope. If you connected X before this was added, connect it again so pictures can post.
- `/api/ai` is rate limited per IP (30 a minute; voice study costs 5).
- Review links are readable by anyone with the link (random 12-character ids); they carry only the draft and the author's name.
- Sync payloads are AES-GCM encrypted in the browser with a key derived (PBKDF2, 200k rounds) from a 100-bit code the server never sees.
- The service worker never caches `/api`, `/auth`, `/login` or review pages.
