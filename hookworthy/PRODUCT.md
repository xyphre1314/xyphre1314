# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Creators who write in public, for creators by creators. Confirmed by the owner as "all of them equally":

- **Crypto and trading writers (largest group, per the owner)**: traders, on-chain analysts and educators posting market takes, trade journals and lessons on X first. Their pains are timing (being early on a narrative), standing out in a crowded niche, and turning charts and P&L into posts without looking like shills. Onboarding lists Crypto & trading first, and Niche radar opens on it.
- **Solo audience builders**: writers, educators, indie makers growing a following on X, Threads, LinkedIn and Bluesky.
- **Founders who post**: operators building in public for their company.
- **Ghostwriters and small teams**: people writing for clients, who need more than one voice, account and approval step.

The shared job: turn a half-formed thought into a post people stop scrolling for, in their own voice, then get it out on time without living in four apps.

## Product Purpose

Hookworthy is a writing and scheduling app for social posts and threads. It learns how you write, grades every first line (the hook), hands you ideas, rewrites on request with a visible word-level diff, adapts one post per platform and schedules it. Success is a creator posting more often, with stronger first lines, in a voice their audience recognizes as theirs.

## Positioning

A scheduler with a writing coach built in, not a scheduler with a text box. The hook is the product's unit of value: every draft is graded on its first line, with a reason. Rewrites are shown as edits you accept word by word, so nothing ships that the creator didn't choose.

## Operating Context

- Drafting happens in bursts: early morning, late night, between meetings, on a phone.
- Ideas arrive as links, screenshots, voice memos, replies and saved posts (the swipe file).
- Creators post to several platforms with different lengths and norms (X 280 chars, Threads, LinkedIn's "see more" fold, Bluesky 300).
- Ghostwriters switch between client voices and need approvals before anything ships.

## Capabilities and Constraints

Built in the prototype (`index.html`, all mocked locally): landing page, onboarding from an @handle, composer with threads, ghost text (Tab), riffs with word diff, hook score, live previews for four platforms, media/GIF/poll, idea capture and engine, hook grader (formulas offered inside the hook panel), pre-post checks (blanks, links, repeats, hashtags, alt text, never-say words, cringe lines, "you said this before"), undo send (8 seconds, Esc or ⌘Z), a 1 AM guard that offers the next morning slot, drafts tidy-up (one at a time: finish, schedule, let go), reruns of old top posts, streak rest days, a first-hour reply desk, Plan my week, share target, review links with comments, LinkedIn carousel PDF, a "sounds like you" meter, hook shootout, evergreen reruns, a Sunday note/email, encrypted sync, focus mode, appearance (light / dark / system), queue calendar with best-time slots, insights, voice profile, pricing, brand page, ⌘K palette.

Constraints:
- Single-file HTML/CSS/JS, PWA-ready, no build step. Everything must work, no dead buttons.
- AI is real Claude when available: the viewer's own account inside claude.ai (sample capability), or the Node server (`server/`, Sonnet 5.5 for writing, Opus 5.5 for voice study). Offline heuristics remain as the fallback.
- Publishing to X and LinkedIn, X reads and Typefully import run through `server/` with the user's own keys; history import (X archive, CSV, paste) runs in the browser.
- Shared logic (hook score, importers, analytics, prompts) lives in `core.js`, used by the app, the server and the MCP server.
- Undecided: real pricing, real integrations, team/workspace backend.

## Brand Commitments

- Name: **Hookworthy** (hookworthy.com). Promise: "Good ideas die in bad first lines."
- Voice: creator to creator. Direct, a little dry, on your side. Short sentences. Specific beats clever. No hype words (unlock, supercharge, leverage, elevate, seamless, game-changer, delve, "AI-powered").
- Owner-stated visual preferences (latest round): colors minimal like Linear and Arc, not bare like Craft; type in the spirit of Wispr Flow. Rounds 7–9: the owner rejected yellow, icon logos and generic SaaS blue, then pointed at Wispr Flow as the reference ("their colors and typography, but blue"). Then (round 10) "that blue is horrible": brand color became a switchable palette (20 options, rainbows included), then (round 12) the owner locked **Lilac & Plum** and gave the demo account their own avatar (`assets/people/you.jpg`), with a Wispr-style near-black dark mode. Structure: wordmark hook*worthy* in EB Garamond; EB Garamond display (32px+) with Figtree UI; cream canvas, ink text, pastel bordered buttons, colored section blocks.
- Illustration: owner asked to see three styles (editor's pen marks, product as illustration, generative) with examples before choosing.

## Evidence on Hand

None. No real users, testimonials, usage numbers, customer logos or press exist. Any numbers, names or quotes on the landing page are illustrative and must be labeled as examples or removed. Prices are placeholders.

## Product Principles

1. The first line is the product. Every surface should make the hook more visible, more measurable or easier to improve.
2. The creator stays the author. Suggestions are shown as edits to accept, never silent replacements.
3. Built for the way creators actually work: capture fast, draft in bursts, post everywhere, learn from what landed.
4. Every feature earns its place for a creator. If a solo writer, a founder and a ghostwriter can't each say why it matters, it goes.
5. Speed is a feature. Keyboard first, instant feedback, no loading theater.

## Accessibility & Inclusion

WCAG 2.2 AA contrast, full keyboard use, visible focus, `prefers-reduced-motion` respected.
