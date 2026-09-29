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

Built in the prototype (`index.html`, all mocked locally): landing page, onboarding from an @handle, composer with threads, ghost text (Tab), riffs with word diff, hook score, live previews for four platforms, media/GIF/poll, idea capture and engine, hook grader (formulas offered inside the hook panel), pre-post checks, focus mode, appearance (Sky / Midnight), queue calendar with best-time slots, insights, voice profile, pricing, brand page, ⌘K palette.

Constraints:
- Single-file HTML/CSS/JS, PWA-ready, no build step. Everything must work, no dead buttons.
- AI, publishing and analytics are local mocks; the `AI` object is the seam for a real model.
- Undecided: real pricing, real integrations, team/workspace backend.

## Brand Commitments

- Name: **Hookworthy** (hookworthy.com). Promise: "Write posts people stop for."
- Voice: creator to creator. Direct, a little dry, on your side. Short sentences. Specific beats clever. No hype words (unlock, supercharge, leverage, elevate, seamless, game-changer, delve, "AI-powered").
- Owner-stated visual preferences (latest round): colors minimal like Linear and Arc, not bare like Craft; type in the spirit of Wispr Flow. Rounds 7–9: the owner rejected yellow, icon logos and generic SaaS blue, then pointed at Wispr Flow as the reference ("their colors and typography, but blue"). Current brand ("Harbor & Cream"): wordmark hook*worthy* in EB Garamond; EB Garamond display (32px+) with Figtree UI; cream canvas, ink text, periwinkle bordered buttons, harbor-blue and ink section blocks.
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
