/* v5.7 (page pass 22, founder-5): the engine adds no end stop and no contraction the writer didn't type, so expected lines here end as the draft ends and keep the draft's own "we are"/"I have". */
/* r86 v4.8: the on-device Sharpen after the round-11 page jurors (UI/UX, marketing, founder, brand and web: engine items only).
   1. uiux-1: the announcement frame is one grammar. A subject (we/I + are/am/'re/'m, or none), any run of intensifiers ("so
      incredibly", "really really", "so, so"), a feeling (or two joined by "and"), "to", an optional finally/officially/now, and
      the verb (share, announce, launch, introduce, tell you, say, let you know, reveal, unveil, release, present, debut). News
      said as a clause goes whole and leads; a thing named after a verb that is the news keeps that verb, in the writer's order
      ("We’re finally launching X", "Launching X."), and never becomes "X is live". The 40-variant table below
   2. marketing-1: a why/how/whether/what topic a run-up introduced keeps its question word ("Why most traders lose money:"), so
      the line stays the pointer the writer made and never becomes a claim they didn't; a story ("a story about how…") and a
      "Can we talk about how…?" are claims and stay so
   3. founder-1: the plain cut is version 1; the "Asked, then answered" flip is the other take, never the default, unless the
      draft was already a question
   4. founder-2/3, marketing-2: "without it this line breaks" only when slHard refused that word's own cut; a doubled
      intensifier collapses or goes; "i just want to say that", "This is huge:", "just a reminder that" are cut
   5. brand-4: a contraction the engine writes uses ’ when the draft has no apostrophe at all; a straight one anywhere keeps it
      straight; a curly one keeps it curly
   6. the 60-line v4.8 hunt (announcements and topic intros), in every mode with alts and put-backs, against the hard guards,
      the page read and this file's own reads */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const core = createRequire(import.meta.url)('../../core.js');
const S = (t, o) => core.sharpenLine(t, o), L = (t, o) => S(t, o).line;
const D = core.SHARPEN._dbg, hard = D.hard, whole = D.whole;
const versions = r => r.state === 'sharp' ? [r.line, ...(r.alts || []).map(a => a.line)] : [];
const MODES = [['default', {}], ['v4.1', { hybrid: false }], ['strict', { strict: true }]];
const HUNT = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-v48-hunt.json'), 'utf8')).lines;
const allVersions = t => { const out = []; for (const [m, o] of MODES) { const r = S(t, o); for (const l of versions(r)) out.push([m, l, r.draft]); } for (const c of (S(t).cut || []).slice(0, 3)) { const r = S(t, { keep: [c.text] }); for (const l of versions(r)) out.push([`keep “${c.text}”`, l, r.draft]); } return out; };

/* this file's own reads, written apart from the engine's guards */
const sents = z => (String(z).match(/(?:[^.!?]|[.!?](?=[^\s.!?"”’)]))+(?:[.!?]+["”’)]*)?/g) || []).map(x => x.trim()).filter(Boolean);
const norm = z => String(z).toLowerCase().replace(/’/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const ANV = /\b(?:launch|introduce|unveil|reveal|release|announce|present|debut)\b/i;
function broken(line, draft) {
  const l = String(line), d = String(draft), out = [], ds = new Set(sents(d).map(norm)), ll = l.toLowerCase().replace(/’/g, "'"), dl = d.toLowerCase().replace(/’/g, "'");
  for (const s of sents(l)) {
    if (ds.has(norm(s))) continue;
    if (/\b(?<!\b(?:series|plan|grade|round|class|type|tier)\s)(?:and|but|or|because|if|than|the|a|an|my|your|our)\s*[.!?:]["”’)]*$/i.test(s)) out.push(`dangling end: ${s}`);
    /* two subjects run together where a frame went: "We're our app is…", "I'm my newsletter…" */
    if (/^\W*(?:we|i|they)(?:['’](?:re|m)|\s+(?:are|am))\s+(?:our|my|the|their|a|an)\s+[^,.!?]*?\b(?:is|are|was|were|has|have|just|hit|crossed)\b/i.test(s) && !/^\W*(?:we|i|they)(?:['’](?:re|m)|\s+(?:are|am))\s+(?:our|my|the|their|a|an)\b/i.test(d)) out.push(`two subjects: ${s}`);
    /* a question run into the word that governed its clause: "…write about should you raise…?" */
    if (/\b(?:about|on|of|share|explain|that)\s+(?:should|does|do|did|is|are|can|will|would|could)\s+(?:you|we|i|they|it|he|she)\b/i.test(s)) out.push(`question run into its frame: ${s}`);
    /* a bare verb left where its feeling went: "We are finally launch our…" */
    if (/\b(?:we|i)(?:['’](?:re|m)|\s+(?:are|am))\s+(?:(?:finally|officially|now)\s+)?(?:launch|introduce|unveil|reveal|release|announce|present|debut|share)\b(?!ing)/i.test(s)) out.push(`bare verb after its subject: ${s}`);
    /* a topic said flat: the draft pointed at why/how, the version states it with neither the question word nor a pointer */
    { const m = dl.match(/\b(?:thinking|wondering|talk|talking|write|writing|explain|share|tell you|break down|thoughts) (?:a lot |lately |about |on |so much )*(?:about |on )?(why|whether)\b/); if (m && !new RegExp(`\\b${m[1]}\\b|\\bhere's ${m[1]}\\b|\\?`).test(ll) && sents(l).length === 1) out.push(`topic said as a claim: ${s}`); }
  }
  /* a launch never becomes "is live" */
  if (/\bis live\b/i.test(l) && !/\bis live\b/i.test(d) && /\blaunch/i.test(d)) out.push('"is live" invented');
  /* the writer's verb of the news stays (in any form) when the frame before it went */
  for (const m of dl.matchAll(/\bto (?:(?:finally|officially|now) )*(launch|introduce|unveil|reveal|release|present|debut)\b(?! that)/g)) if (!new RegExp(`\\b${m[1].replace(/e$/, '')}`).test(ll) && !ANV.test(ll)) out.push(`news verb lost: ${m[1]}`);
  if (/(?<!\.)\.\.(?!\.)|[,;:][.!?]|[.!?][,;:]|,,|\.!|!\.|\s[,.!?]|:\s*\S[^:]*:$/.test(l) && !/(?<!\.)\.\.(?!\.)|[,;:][.!?]|[.!?][,;:]|,,|\.!|!\.|\s[,.!?]/.test(d)) out.push('punctuation');
  for (const n of d.match(/\$?\d[\d,.]*[kKmM%x]?/g) || []) if (!l.includes(n.replace(/[.,]$/, ''))) out.push(`lost ${n}`);
  for (const h of d.match(/[@#][\w]+/g) || []) if (!l.includes(h)) out.push(`lost ${h}`);
  /* the apostrophe the engine writes: straight anywhere in the draft → straight; none or curly only → curly */
  const dc = /’/.test(d), dst = /'/.test(d);
  if (dst && !dc && /\p{L}’\p{L}/u.test(l)) out.push('curly apostrophe on a straight draft');
  if (!dst && /\p{L}'\p{L}/u.test(l)) out.push('straight apostrophe on a draft with none');
  return out;
}

/* 1. the announcement grammar, in any combination: the default line for each draft */
const ANN40 = [
  ["We are super excited to finally launch our new feature that lets you schedule posts", "We’re finally launching our new feature that lets you schedule posts"],
  ["I'm so incredibly proud to share that our team just shipped v2", "Our team just shipped v2"],
  ["We're thrilled to announce that we raised a $3M seed round", "We raised a $3M seed round"],
  ["I am beyond grateful to say that I've been accepted into YC", "I've been accepted into YC"],
  ["We’re so excited to unveil the new dashboard", "We’re unveiling the new dashboard"],
  ["I am super excited to now launch our affiliate program", "I’m now launching our affiliate program"],
  ["So excited to launch our app today", "Launching our app today"],
  ["Super excited to finally launch our new website!", "Finally launching our new website!"],
  ["Thrilled to introduce Hookworthy, a writing tool for X", "Introducing Hookworthy, a writing tool for X"],
  ["We are excited to introduce Hookworthy, a writing tool for X", "We’re introducing Hookworthy, a writing tool for X"],
  ["We're pumped to finally reveal our new logo", "We're finally revealing our new logo"],
  ["I'm stoked to let you know that the waitlist is open", "The waitlist is open"],
  ["We are very happy to tell you that we hit 10k users", "We hit 10k users"],
  ["I'm humbled to announce that I'm joining Stripe", "I'm joining Stripe"],
  ["We're really really excited to finally launch the beta", "We're finally launching the beta"],
  ["I'm so so proud to share that we closed our seed round", "We closed our seed round"],
  ["we are thrilled to share that our app is live", "our app is live"],
  ["i'm so excited to finally launch my newsletter", "i'm finally launching my newsletter"],
  ["We're incredibly excited to launch Hookworthy on Product Hunt today!", "We're launching Hookworthy on Product Hunt today!"],
  ["We're excited to now introduce dark mode", "We're now introducing dark mode"],
  ["I am really proud to announce that we closed our Series A", "We closed our Series A"],
  ["We are so proud to officially launch our new website", "We’re officially launching our new website"],
  ["We're super stoked to finally unveil our new brand", "We're finally unveiling our new brand"],
  ["Honored to share that I'll be speaking at SaaStr next month", "I'll be speaking at SaaStr next month"],
  ["I'm genuinely so happy to say that our podcast is back", "Our podcast is back"],
  ["We are so excited to officially announce that we're hiring", "We're hiring"],
  ["I'm excited and honored to share that I joined Vercel", "I joined Vercel"],
  ["We're thrilled and grateful to finally launch v3 today", "We're finally launching v3 today"],
  ["So pumped to officially release our first course", "Officially releasing our first course"],
  ["I am so very excited to share that my book is out today", "My book is out today"],
  ["We're beyond excited to finally reveal that we're rebranding", "We're rebranding"],
  ["I'm super super excited to launch my first product", "I'm launching my first product"],
  ["We are absolutely thrilled to introduce our new pricing", "We’re introducing our new pricing"],
  ["Excited to finally debut our new podcast this Friday", "Finally debuting our new podcast this Friday"],
  ["I'm proud to let everyone know that we're profitable", "We're profitable"],
  ["We are so excited to tell you all that the app is live", "The app is live"],
  ["I'm happy to finally share that I passed the bar exam", "I passed the bar exam"],
  ["We're so excited to announce our new podcast", "We're announcing our new podcast"],
  ["I am really excited to be speaking at Token2049 next week", "I’m speaking at Token2049 next week"],
  ["I am very excited and honored to be speaking at Token2049 next week in Singapore", "I’m speaking at Token2049 next week in Singapore"]
];

test('v4.8, uiux-1: the announcement frame is one grammar (40 variants)', () => {
  assert.equal(ANN40.length, 40);
  for (const [t, want] of ANN40) {
    assert.equal(L(t), want, t);
    for (const [m, l, d] of allVersions(t)) { const h = hard(l, d), w = whole(l, d), b = broken(l, d); assert.ok(!h && !w && !b.length, `${m}: ${t} → ${l} (${h || w || b.join(', ')})`); }
  }
  /* the verb that is the news stays the writer's, in their order; nothing is said that they didn't say */
  assert.equal(L('We are super excited to finally launch our new feature that lets you schedule posts'), 'We’re finally launching our new feature that lets you schedule posts');
  assert.equal(L("I'm so incredibly proud to share that our team just shipped v2"), 'Our team just shipped v2');
  for (const t of ['We are super excited to finally launch our new feature that lets you schedule posts', 'So excited to launch our app today', "We're excited to announce the launch of our new dashboard", 'Excited to announce the launch of our new dashboard next week'])
    for (const [m, l] of allVersions(t)) { assert.doesNotMatch(l, /\bis live\b/i, `${m}: ${t} → ${l}`); assert.match(l, /\blaunch/i, `${m}: ${t} → ${l}`); }
  assert.equal(L('Excited to announce the launch of our new dashboard next week'), 'Launching our new dashboard next week');
  /* the frame is marked as the feeling alone, so what is struck is what went */
  const m = S('We are super excited to finally launch our new feature that lets you schedule posts').marks.map(x => x[3]);
  assert.deepEqual(m, ['announce']); assert.deepEqual(S('We are super excited to finally launch our new feature that lets you schedule posts').cut.filter(c => c.kind !== 'reshape').map(c => c.text), ['super excited to']);
  /* the reshapes the frame already had stay ("We're partnering…", "We raised…"), and a feeling with no verb after it stays */
  assert.equal(L("We're thrilled to announce our partnership with Coinbase"), 'We’re partnering with Coinbase'.replace('’', "'")); /* v5.7: no end stop the writer didn't type */
  /* v4.9 (round-12 uiux-3): a round named keeps the writer's verb, never "We raised" (a word the draft never had) */
  assert.equal(L("We're super excited to announce our $2.5M pre-seed led by Hustle Fund!"), "We're announcing our $2.5M pre-seed led by Hustle Fund!");
  assert.equal(S("I'm so happy that my mom finally got to see the ocean").state, 'clean');
  /* "sharing" and "shipping" are words the page's own guard doesn't know, so a shared thing stays marked */
  assert.equal(S("I'm so excited to share our new newsletter with you all!").state, 'unsure');
  /* an announcement that leaves a whole two-word clause leaves a post */
  assert.equal(L("We are so excited to officially announce that we're hiring"), "We're hiring");
  /* strict ships only a plain cut: a verb in its -ing form is a reshape, so strict keeps the line as written */
  assert.equal(S('So excited to launch our app today', { strict: true }).state, 'unsure');
});

test('v4.8, marketing-1: a why/how topic keeps its question word, so the line stays a pointer', () => {
  const cases = [
    ['I have been thinking about why most traders lose money', 'Why most traders lose money:'],
    ['So I have been thinking a lot lately about why people quit their jobs', 'Why people quit their jobs:'],
    ['I want to talk about why people unfollow you', 'Why people unfollow you:'],
    ['Let me tell you about why I stopped day trading', 'Why I stopped day trading:'],
    ['Let me tell you why I quit my job', 'Why I quit my job:'],
    ['In this post I want to share why I sold all my ETH', 'Why I sold all my ETH:'],
    ['quick thoughts on why altcoins keep bleeding', 'why altcoins keep bleeding:'],
    ['been thinking a lot about how founders raise money', 'how founders raise money:'],
    ['today i want to talk about how i size my trades', 'how i size my trades:'],
    ["In this week's issue: why the 60/40 portfolio is back", 'Why the 60/40 portfolio is back:'],
    ['Let me explain why I think ETH is undervalued right now', 'Why I think ETH is undervalued right now:'],
    ['gm. so i\'ve been thinking a lot about how to price a newsletter sponsorship', 'gm. how to price a newsletter sponsorship:'],
    /* v5.4 (step 1): never a "?" the writer didn't type, so the indirect question stays theirs */
    ['I wanted to write about whether you should quit your job', 'I wanted to write about whether you should quit your job']
  ];
  for (const [t, want] of cases) for (const [m, o] of MODES.slice(0, 2)) assert.equal(L(t, o), want, `${m}: ${t}`);
  /* the receipt counts a cut, never "Said it straight" */
  assert.doesNotMatch(S('I have been thinking about why most traders lose money').say, /straight/i);
  /* with a body under it, the pointer is the loop it was */
  assert.equal(L("Let's talk about why your open rates are lying to you\n\n1. Apple MPP inflates opens\n2. Bots click everything"), "Your open rates are lying to you. Here's why:");
  /* a story and a "Can we talk about how…?" say what happened: they stay claims */
  assert.equal(L('I wanted to share a quick story about how we lost our biggest customer'), 'We lost our biggest customer');
  assert.equal(L('Can we talk about how nobody reads the terms of service?'), 'Nobody reads the terms of service.');
  /* an exclamative "how" is not a topic, and nothing promises what nobody wrote */
  assert.doesNotMatch(L("I've been thinking a lot lately about how important it is to ship fast"), /:$/);
  /* a topic that already points at a link keeps its own end */
  assert.equal(L('New blog post: how we cut our cloud bill in half → blog.tinyapi.dev/cloud-bill'), 'How we cut our cloud bill in half → blog.tinyapi.dev/cloud-bill');
  /* a put-back run-up keeps what follows it as written (never "…about should you…?") */
  for (const [t, k] of [['I wanted to write about whether you should raise a seed round', 'I wanted to write about'], ["So in this week's issue I wanted to talk about how I find sponsors", 'So']])
    for (const l of versions(S(t, { keep: [k] }))) { assert.doesNotMatch(l, /\babout should\b/i, l); assert.doesNotMatch(l, /^so how i find sponsors\.$/i, l); }
});

test('v4.8, founder-1: the plain cut is version 1; "Asked, then answered" is the other take', () => {
  /* (v5.3, Fable H9: a lowercase draft with no end stop gets none, in its alts too) */
  for (const [t, want, flip] of [
    /* v5.4: on a plain view "imo" is cut (step 3), and no take adds a "?" the writer didn't type (step 1): no flip is offered */
    ['basically SOL is the only chain that matters rn imo', 'SOL is the only chain that matters rn', null],
    ["tbh ETH is the only L1 i'd hold for 5 years", "ETH is the only L1 i'd hold for 5 years", null],
    ['honestly, patience is the only edge most traders never build', 'patience is the only edge most traders never build', null],
    ['you should really be tracking your protein if you want to build muscle', 'you should be tracking your protein if you want to build muscle', null]
  ]) {
    const r = S(t); assert.equal(r.line, want, t); assert.doesNotMatch(r.say, /Asked, then answered/, t);
    assert.ok(!r.alts.some(x => /\?/.test(x.line)), `${t}: ${JSON.stringify(r.alts.map(x => x.line))}`);
  }
  /* with nothing to cut, the flip never overrides "Nothing to cut" */
  for (const t of ['SOL is the only chain that matters', 'Most B2B content fails because it is written for the company, not the customer.']) assert.equal(S(t).state, 'clean', t);
  /* a draft that was already a question may lead with it */
  assert.match(S('Can I just say that customer support is honestly the most underrated growth channel for early-stage startups?').say, /Asked, then answered/);
  /* the hunts: no default is a flip of a draft with no question mark */
  for (const t of HUNT) { const r = S(t); if (!/\?/.test(r.draft)) assert.doesNotMatch(r.say, /Asked, then answered/, t); }
});

test('v4.8, founder-2/3 and marketing-2: true reasons, doubled intensifiers, and the run-ups the demo missed', () => {
  /* "Basically" before an "if" clause goes; "breaks" only when slHard refused that cut */
  assert.equal(L('Basically if your landing page has more than one CTA you\'re losing signups'), "If your landing page has more than one CTA you're losing signups");
  const sweep = [...HUNT, ...JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-v47-hunt.json'), 'utf8')).lines, ...ANN40.map(r => r[0])];
  for (const t of sweep) { const r = S(t); const q = (r.why.match(/^Marked “([^”]+)”, not cut: without it this line breaks/) || [])[1]; if (!q || q.endsWith('…')) continue;
    const others = r.marks.map(m => r.draft.slice(m[0], m[1])).filter(w => w !== q); let l = core.softCut(r.draft, others).s; if (/[\p{L}\p{N}%)$]$/u.test(l)) l += '.';
    assert.ok(hard(l, r.draft), `${t}: says "breaks", but slHard takes "${l}"`); }
  /* a doubled intensifier collapses or goes; on a hard feeling, a negation or a verb the doubling is the meaning */
  assert.equal(L('Really really proud of the team for shipping this'), 'Really proud of the team for shipping this');
  assert.match(S('Really really proud of the team for shipping this').why, /twice/);
  assert.equal(L('Very very important: never risk more than 1% on a trade'), 'Important: never risk more than 1% on a trade');
  assert.equal(L('This is so so good'), 'This is so good');
  assert.equal(L("We're really really excited to finally launch the beta"), "We're finally launching the beta");
  assert.equal(L('I really, really think you should write every day if you want to grow.'), 'I think you should write every day if you want to grow.');
  for (const t of ['I really, really needed this win.', "It's been a really, really hard year for me and my family.", "everyone says it's fine when it really, really isn't"]) assert.match(L(t), /really, really/, t);
  /* the run-ups */
  assert.equal(L("i just want to say that if you're new to crypto please don't use leverage"), "if you're new to crypto please don't use leverage");
  assert.equal(L('This is huge: Solana just flipped Ethereum in daily active users'), 'Solana just flipped Ethereum in daily active users');
  assert.equal(L('gm frens, just a reminder that $BTC is still in a bull market'), 'gm frens, $BTC is still in a bull market');
  assert.equal(L('My newsletter just crossed 10,000 subscribers and I am so grateful for each and every one of you'), 'My newsletter just crossed 10,000 subscribers. I am so grateful for every one of you');
  /* "Series A" ends on a name, not an article */
  assert.equal(L('I am really proud to announce that we closed our Series A'), 'We closed our Series A');
});

test('v4.8, brand-4: the apostrophe the engine writes matches the draft, and the page when the draft has none', () => {
  assert.equal(L('We are super excited to finally launch our new feature'), 'We’re finally launching our new feature');
  assert.equal(L("We are super excited to finally launch our 'new' feature"), "We're finally launching our 'new' feature");
  assert.equal(L('We’re so excited to unveil the new dashboard'), 'We’re unveiling the new dashboard');
  assert.equal(L("i think it is basically done and we are honestly so ready"), 'it is basically done and we are so ready'); /* v5.4 (Fable round 3, step 3): one rule: on a plain view a stance or a hedge is cut; on a forecast or a call it is the writer's call */
  /* the writer's own characters are never changed: a mixed draft keeps each as typed */
  const mx = L("I'm so excited to finally launch my app and it’s free");
  assert.ok(mx.includes("I'm") && mx.includes('it’s'), mx);
  /* across the hunts, no version writes the other kind */
  for (const t of [...HUNT, ...ANN40.map(r => r[0])]) for (const [m, l, d] of allVersions(t)) { const b = broken(l, d).filter(x => /apostrophe/.test(x)); assert.deepEqual(b, [], `${m}: ${t} → ${l}`); }
});

test('v4.8: the 60-line hunt, every mode, alts and put-backs: no hard guard, no page read, none of this file\'s shapes', () => {
  assert.equal(HUNT.length, 60);
  /* this file's reads see the shapes v4.7 made on it */
  for (const [l, d] of [
    ["We're our app is now on Android.", "We're really, really excited to announce that our app is now on Android"],
    ['I wanted to write about should you raise a seed round?', 'I wanted to write about whether you should raise a seed round'],
    ['Most traders lose money.', 'I have been thinking about why most traders lose money'],
    ['We are finally launch our new feature.', 'We are super excited to finally launch our new feature'],
    ['Our new dashboard is live.', 'We are excited to announce the launch of our new dashboard']
  ]) assert.ok(broken(l, d).length || hard(l, d), l);
  const bad = [];
  for (const t of HUNT) for (const [m, l, d] of allVersions(t)) { const h = hard(l, d), w = whole(l, d), b = broken(l, d); if (h || w || b.length) bad.push(`${m}: ${t} → ${l} (${h || w || b.join(', ')})`); }
  assert.deepEqual(bad, []);
  /* the families the jurors named come back sharpened, not "Nothing to cut" */
  for (const t of HUNT.slice(0, 30).filter(x => !/sharpen|share my|so, so|really excited to share|thrilled to be/i.test(x))) assert.notEqual(S(t).state, 'clean', t);
});
