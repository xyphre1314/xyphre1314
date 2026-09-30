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
| `POST /api/ai` `{prompt, tier, json}` | Claude, routed by tier (used by the app) |
| `GET /api/x/posts?handle=&max=` | An account's original posts with public metrics (X API, bearer token) |
| `GET /api/x/people?handles=a,b` | Top recent posts from people you learn from |
| `GET /api/x/metrics?ids=` | Fresh metrics for posts, for post-mortems |
| `POST /api/typefully/import` `{key}` | Your published and scheduled Typefully drafts (key used once, never stored) |
| `POST /api/publish` `{posts, platforms}` | Post now to X (as a thread) and/or LinkedIn |
| `POST /api/schedule` `{posts, at, platforms}`, `GET /api/queue`, `DELETE /api/queue/:id` | The posting queue; checked every 30 s |
| `POST /api/v1/check` `{text, never?, limit?}` | Hook score + pre-post checks, no key needed |
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
- `/api/ai` is rate limited per IP (30 a minute; voice study costs 5).
- Review links are readable by anyone with the link (random 12-character ids); they carry only the draft and the author's name.
- Sync payloads are AES-GCM encrypted in the browser with a key derived (PBKDF2, 200k rounds) from a 100-bit code the server never sees.
- The service worker never caches `/api`, `/auth`, `/login` or review pages.
