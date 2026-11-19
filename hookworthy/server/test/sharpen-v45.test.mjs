/* r86 v4.5: the on-device Sharpen after blind set 6 (review-hook-v44: hook44-1 to hook44-4, on-device) and the page marketing
   juror's round 9 (engine items only).
   1. hook44-1 (v-82, the one break): "it/that/there/here is" contracts only where the pronoun opens its clause as the subject,
      never across a cut, and in the writer's apostrophe (straight stays straight; a draft with none gets straight). A hard
      guard rejects a new "it's" after a verb or a preposition, whatever made it. "Let us know" is never "Let's know"
   2. hook44-2 (v-46): a put-back opener stays in front of the words it introduced: a version that moved them away is dropped
      and the next one in the writer's order leads
   3. hook44-3: "really" right before the clause's verb is the writer's degree and stays (v-0); a stance verb's "really" may
      still go. A softener in front of a bare verb of thinking stays (v-87), and a hard guard rejects a new bare "Think…"
   4. hook44-4: the lesson run-up keeps its label (v-28), the newsletter issue becomes the label (v-42), and a run-on over 280
      splits where the story turns (v-114); a hard guard rejects a condition a split cut off
   5. round 9, marketing-1: thread intros said in full and "Let's talk about why…" are run-ups, and the clean state claims only
      what the engine knows: "This quick check found nothing to cut"
   6. the 60-line v4.5 hunt (object pronouns before "is", gerund subjects, quotes, both apostrophe styles), in every mode,
      against the hard guards, the page guard and this file's own break checks */
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
const HUNT = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-v45-hunt.json'), 'utf8')).lines;
const HUNT44 = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-v44-hunt.json'), 'utf8')).lines;
const CLEAN = 'This quick check found nothing to cut, so it stays as you wrote it.';

/* this file's own reads of the break shapes, written apart from the engine's guards */
const cnt = (s, re) => (String(s).match(re) || []).length;
const OBJ = /\b(?:[a-z]+ing|do|does|did|make|made|fix|fixed|use|used|get|got|keep|kept|try|tried|build|built|ship|shipped|google|googled|sell|sold|watch|of|in|on|at|for|with|from|about|into|over|under|by|through|to)\s+(?:it|there|here)['’]s\b/gi;
const OBJ_OK = /\b(?:[a-z]*thing|morning|evening|feeling|meeting|during)\s+(?:it|there|here)['’]s\b/gi;
function broken(line, draft) {
  const l = String(line), d = String(draft), out = [];
  /* the apostrophe is the writer's: straight anywhere in the draft stays straight, curly stays curly; v4.8 (brand-4): a draft
     with none gets the page's typographic ’ */
  const dc = /’/.test(d), ds = /'/.test(d);
  if (ds && !dc && cnt(l, /\p{L}’\p{L}/gu)) out.push('curly apostrophe added');
  if (!ds && cnt(l, /\p{L}'\p{L}/gu)) out.push('straight apostrophe added');
  /* "is" joined to an object pronoun: "googling it's", "getting there's" */
  if (cnt(l, OBJ) - cnt(l, OBJ_OK) > cnt(d, OBJ) - cnt(d, OBJ_OK)) out.push('contraction on an object');
  if (/\blet['’]s (?:know|help|hear)\b/i.test(l) && !/\blet['’]s (?:know|help|hear)\b/i.test(d)) out.push('"let\'s know"');
  /* a sentence that opens on a bare verb of thinking */
  const th = /(?:^|[.!?]\s+)(?:think|believe|reckon|suspect|doubt|suppose)\s/gi; if (cnt(l, th) > cnt(d, th)) out.push('bare thinking verb');
  /* a condition with nothing after it */
  if (/,\s+(?:so\s+|and\s+)?(?:if|when|unless|until)\b[^,.!?]*[.!?](?=\s|$)/i.test(l) && !/,\s+(?:so\s+|and\s+)?(?:if|when|unless|until)\b[^,.!?]*[.!?](?=\s|$)/i.test(d)) out.push('condition cut off');
  if (/(?<!\.)\.\.(?!\.)|[,;:][.!?]|[.!?][,;:]|,,|\.!|!\.|\s[,.!?]/.test(l) && !/(?<!\.)\.\.(?!\.)|[,;:][.!?]|[.!?][,;:]|,,|\.!|!\.|\s[,.!?]/.test(d)) out.push('punctuation');
  for (const n of d.match(/\$?\d[\d,.]*[kKmM%x]?/g) || []) if (!l.includes(n.replace(/[.,]$/, ''))) out.push(`lost ${n}`);
  return out;
}

test('v4.5, hook44-1: "is" contracts only onto a clause-opening subject, never across a cut, in the writer\'s apostrophe', () => {
  const v82 = 'Reading the whole error message before googling it is honestly a skill that took me years to learn.';
  for (const [m, o] of MODES) assert.equal(L(v82, o), 'Reading the whole error message before googling it is a skill that took me years to learn.', m);
  /* the class, in the shared table: an object pronoun stays spelled out; a subject still contracts */
  const C = t => core.SHARPEN.sub(t, core.SHARPEN.CONTRACT_W);
  assert.equal(C('before googling it is a skill'), 'before googling it is a skill');
  assert.equal(C('getting there is half the fun'), 'getting there is half the fun');
  assert.equal(C('Doing that is rare'), 'Doing that is rare');
  assert.equal(C('Honestly it is a skill'), 'Honestly it’s a skill');
  assert.equal(C('I think it is fine'), 'I think it’s fine');
  assert.equal(C('If you build it, it is yours'), 'If you build it, it’s yours');
  assert.equal(C('and there is a catch'), 'and there’s a catch');
  assert.equal(C('Let us know what you think'), 'Let us know what you think');
  assert.equal(C('Let us begin'), 'Let’s begin');
  /* never across a cut: "I honestly am" → "I am", not "I'm" */
  assert.equal(L('I honestly am not sure we will make payroll next month.'), 'I am not sure we’ll make payroll next month.');
  /* the writer's apostrophe: straight → straight; curly only → curly; v4.8 (brand-4): none → the page's ’ */
  assert.equal(L('After ghostwriting for 40+ SaaS founders, I can confidently say most of them are honestly way too scared to post their real opinions.'), 'I’ve ghostwritten for 40+ SaaS founders. Most of them are way too scared to post their real opinions.');
  assert.equal(L("After ghostwriting for 40+ SaaS founders, I can confidently say most of them are honestly way too scared to post their 'real' opinions."), "I've ghostwritten for 40+ SaaS founders. Most of them are way too scared to post their 'real' opinions.");
  assert.equal(L("I'll be real with you guys, this launch did not go the way I planned."), "This launch didn't go the way I planned.");
  assert.equal(L('I’ve been saying this for months and honestly it is finally happening.'), 'I’ve been saying this for months. It’s finally happening.');
  /* the hard guard reads the class, whatever made it */
  assert.equal(hard('Reading the whole error message before googling it’s a skill that took me years to learn.', v82), 'contraction off its subject');
  assert.equal(hard("Getting there's half the fun.", 'Honestly getting there is half the fun.'), 'contraction off its subject');
  assert.equal(hard("Every morning it's the same.", 'Honestly every morning it is the same.'), '');
  assert.equal(hard("I have a feeling it's fine.", 'I have a feeling it is fine.'), '');
  assert.equal(hard("It feels like it's working.", 'It feels like it is working.'), '');
  /* a draft's own shape is the writer's */
  assert.equal(hard("Getting there's half the fun.", "Honestly getting there's half the fun."), '');
});

test('v4.5, hook44-2: a put-back opener stays in front of the words it introduced', () => {
  const v46 = 'So I finally cleaned my list and removed about 3,000 inactive subscribers and my open rate basically doubled.';
  assert.equal(L(v46), 'My open rate basically doubled. What changed: I finally cleaned my list and removed about 3,000 inactive subscribers.');
  const r = S(v46, { keep: ['So'] });
  assert.equal(r.line, 'So I finally cleaned my list and removed about 3,000 inactive subscribers. My open rate basically doubled.');
  assert.match(r.why, /You kept “So”/);
  for (const o of [{ keep: ['So'] }, { keep: ['So'], hybrid: false }, { keep: ['So'], strict: true }]) for (const l of [r.line, ...versions(S(v46, o))]) assert.doesNotMatch(l, /^So my open rate/, JSON.stringify(o));
  /* a put-back label still brings back its joining word (v4.4) */
  assert.equal(L("Just a quick tip for founders: you don't need a perfect landing page to start selling.", { keep: ['Just a quick tip'] }), "Just a quick tip for founders: you don't need a perfect landing page to start selling.");
  /* the put-back sweep: a thread label put back keeps the "how" it introduced (v4.4 gave "Here's a thread on we doubled…") */
  for (const [t, k] of [["Here's a thread on how we doubled demo bookings for 3 fintech clients using nothing but founder-led posts", "Here's a thread on"], ['Here is a thread about how I grew my newsletter to 10k subscribers in 6 months', 'Here is a thread about'], ['Really quick thread on why I think @jessepollak and the Base team are basically building the next Coinbase inside of Coinbase', 'Really quick thread on']]) {
    const l = L(t, { keep: [k] }); assert.ok(l.startsWith(k + (/how|why/.exec(t.slice(k.length))[0] ? ' ' + /how|why/.exec(t.slice(k.length))[0] : '')), l);
  }
  /* and "I think" put back before the lesson run-up never heads an order */
  const v28 = "I think one of the biggest lessons I've learned as a founder this year is to basically never assume you know what customers want.";
  for (const l of [L(v28, { keep: ['I think'] }), ...versions(S(v28, { keep: ['I think'] }))]) assert.doesNotMatch(l, /^I think (?:basically )?never assume/, l);
  assert.equal(hard('I think basically never assume you know what customers want.', v28), 'opinion verb before an order');
});

test('v4.5, hook44-3: "really" before the verb stays; a softener before a bare verb of thinking stays', () => {
  for (const [m, o] of MODES) assert.equal(L('Honestly feels like the market is just waiting for the Fed to say something before anything really moves.', o), 'Feels like the market is just waiting for the Fed to say something before anything really moves.', m);
  /* v5.0 (round-13 uiux-2): "really need to" + a verb is propped up, not a degree: "need to" says it. Inside a belief someone holds
     or a question it stays ("why do founders think they really need to raise?"), and "really need" + a thing is still a degree */
  assert.equal(L('I really need to start sleeping more honestly.'), 'I need to start sleeping more.');
  assert.equal(L('We really need to talk about how much time meetings eat every week.'), 'We need to talk about how much time meetings eat every week.');
  for (const t of ['Do you really need to raise a seed round?', 'I really need a break']) { const c = S(t); assert.equal(c.state, 'clean', t); assert.match(c.why, /Kept “[^”]*really/, t); }
  /* a stance verb's "really" and a degree on an adjective may still go */
  assert.equal(L('I really think stablecoins are basically the story of 2027.'), 'I think stablecoins are the story of 2027.');
  assert.equal(L('I think a lot of designers really overthink their portfolios when they should just show 3 really good case studies.'), 'I think a lot of designers really overthink their portfolios when they should just show 3 good case studies.');
  /* a run-up's "really" goes with its run-up */
  assert.equal(L('I just wanted to take a moment to really thank everyone who has supported us over the past three years.'), 'Thank you to everyone who has supported us over the past three years.');
  assert.equal(L('I really want to emphasize how important it is to reply to every comment in the first hour'), 'Reply to every comment in the first hour.');
  /* v-87 */
  const v87 = 'Kind of think most side projects would be better off as one HTML file and zero build steps tbh.';
  for (const [m, o] of MODES) assert.equal(L(v87, o), 'Kind of think most side projects would be better off as one HTML file and zero build steps.', m);
  assert.equal(hard('Think most side projects would be better off as one HTML file and zero build steps.', v87), 'thinking verb lost its subject');
  const h = S('Honestly think the best marketing is just a product people talk about.'); assert.equal(h.state, 'clean');
  assert.equal(h.why, 'Kept “Honestly”: without it the line opens on “Think”, which reads like an order.');
});

test('v4.5, hook44-4: the lesson keeps its label, the issue becomes the label, a long run-on splits where the story turns', () => {
  const v28 = "I think one of the biggest lessons I've learned as a founder this year is to basically never assume you know what customers want.";
  assert.equal(L(v28), "One of the biggest lessons I've learned as a founder this year: basically never assume you know what customers want.");
  assert.equal(L("One of the biggest lessons I've learned in fundraising is to never take the first term sheet."), "One of the biggest lessons I've learned in fundraising: never take the first term sheet.");
  /* the r86 pass-4 lesson cut ("is that") is unchanged */
  assert.equal(L("As a designer, one of the most important lessons I've learned is that you're not designing for yourself, you're designing for the user."), "You're not designing for yourself. You're designing for the user.");
  const v42 = S("In this week's issue I wrote about why I think most creators should probably stop chasing virality.");
  assert.equal(v42.line, "This week's issue: why I think most creators should probably stop chasing virality.");
  assert.equal(v42.why, 'The run-up went. “This week\'s issue” stays as the label, so the topic comes right after it.');
  assert.equal(L('In my latest video I break down how I edit thumbnails in 10 minutes.'), 'My latest video: how I edit thumbnails in 10 minutes.');
  const v114 = "I don't usually share stuff like this, but a year ago I was completely burned out, barely sleeping, and honestly pretty convinced that I'd made a huge mistake by leaving my job, and today I woke up rested, did work I actually care about, and had dinner with people I love, so if you're in the hard part right now, I promise it really does get better.";
  const r = S(v114);
  assert.equal(r.line, "I don't usually share stuff like this, but a year ago I was completely burned out, barely sleeping, and pretty convinced that I'd made a huge mistake by leaving my job. Today I woke up rested, did work I actually care about, and had dinner with people I love. So if you're in the hard part right now, I promise it really does get better.");
  assert.match(r.say, /three beats/);
  /* a real series is still never split (v4.4) */
  assert.doesNotMatch(L("Most retail traders lose because they don't have a plan, they don't size their positions properly, and they chase whatever coin is pumping."), /properly\. And/);
  /* the hunt's first-contact break: a split that cut a condition off from its main clause */
  const q58 = "I spent 3 years building in public, and today I finally hit $10k MRR, and honestly the biggest lesson is that consistency beats talent every single time, so if you're just starting out and nobody is reading your posts yet, keep going because it really does compound faster than you think it will.";
  assert.equal(hard("I spent 3 years building in public, and today I finally hit $10k MRR. The biggest lesson is that consistency beats talent every single time, so if you're just starting out. Nobody is reading your posts yet, keep going because it really does compound faster than you think it will.", q58), 'condition cut off');
  assert.equal(L(q58), "I spent 3 years building in public. Today I finally hit $10k MRR. The biggest lesson is that consistency beats talent every single time. So if you're just starting out and nobody is reading your posts yet, keep going because it really does compound faster than you think it will.");
});

test('v4.5, round 9 marketing-1: thread intros and "Let\'s talk about why" are run-ups; the clean state claims only what it knows', () => {
  for (const t of ['This is a thread about how I grew from 0 to 50k followers in 6 months', "Let's talk about why your open rates are lying to you", 'This thread is about the 5 tools I use every single day', 'So this is a thread about what I learned shipping 12 apps in 12 months']) {
    const r = S(t); assert.equal(r.state, 'sharp', t); assert.notEqual(r.why, CLEAN, t);
  }
  assert.equal(L('This is a quick thread on why I stopped using Notion for everything 🧵'), 'Why I stopped using Notion for everything 🧵');
  assert.equal(L('So this is a thread about what I learned shipping 12 apps in 12 months'), 'Thread: what I learned shipping 12 apps in 12 months.');
  /* v4.8 (round-11 marketing-1): with nothing under it, the topic keeps its "why" and stays a pointer */
  assert.equal(L("Let's talk about why your open rates are lying to you"), 'Why your open rates are lying to you:');
  assert.equal(L("Let's talk about why your open rates are lying to you\n\n1. Apple MPP inflates opens\n2. Bots click everything"), "Your open rates are lying to you. Here's why:");
  /* a talk about a thing (not a why) is marked, never called clean */
  const st = S('Let me tell you a story about the worst trade I ever made'); assert.equal(st.state, 'unsure');
  /* the clean copy */
  const c = S('Selling it is the part nobody warns you about when you start a business.');
  assert.equal(c.state, 'clean'); assert.equal(c.why, CLEAN);
  assert.ok(!Object.values(core.SHARPEN).some(v => typeof v === 'string' && /reads as filler/.test(v)));
});

test('v4.5: the 60-line hunt, every mode: no hard guard, no page guard, none of this file\'s break shapes', () => {
  assert.equal(HUNT.length, 60);
  /* this file's checks see the shapes v4.4 made (v-82, w-58, v-87) and the hunt's first contact */
  for (const [l, d] of [
    ['Reading the whole error message before googling it’s a skill that took me years to learn.', 'Reading the whole error message before googling it is honestly a skill that took me years to learn.'],
    /* v4.8 (brand-4): a draft with no apostrophe now gets ’, so the shape is a curly one on a draft that types straight ones */
    ["I’ve ghostwritten for 40+ SaaS founders. Most of them are way too scared to post their 'real' opinions.", "After ghostwriting for 40+ SaaS founders, I can confidently say most of them are honestly way too scared to post their 'real' opinions."],
    ['Think most side projects would be better off as one HTML file and zero build steps.', 'Kind of think most side projects would be better off as one HTML file and zero build steps tbh.'],
    ["The biggest lesson is that consistency beats talent every single time, so if you're just starting out. Nobody is reading your posts yet, keep going.", "honestly the biggest lesson is that consistency beats talent every single time, so if you're just starting out and nobody is reading your posts yet, keep going."],
    ["Let's know what you think in the replies!", 'Let us know what you think in the replies!'],
  ]) assert.ok(broken(l, d).length, l);
  const bad = [];
  for (const t of HUNT) for (const [m, o] of MODES) { const r = S(t, o); for (const l of versions(r)) { const h = hard(l, r.draft), w = whole(l, r.draft), b = broken(l, r.draft); if (h || w || b.length) bad.push(`${m}: ${t} → ${l} (${h || w || b.join(', ')})`); } }
  assert.deepEqual(bad, []);
  /* and the v4.4 hunt reads clean to this file's checks too */
  for (const t of HUNT44) for (const [m, o] of MODES) { const r = S(t, o); for (const l of versions(r)) { const b = broken(l, r.draft); if (b.length) bad.push(`v4.4 hunt, ${m}: ${t} → ${l} (${b.join(', ')})`); } }
  assert.deepEqual(bad, []);
  /* the object pronouns of the hunt stay spelled out */
  for (const t of HUNT.filter(x => /^(?:Shipping|Debugging|Getting there|Explaining|Pricing|Talking to them|Running there|Learning|Making|Doing this|Reading the docs)/.test(x))) for (const [m, o] of MODES) for (const l of versions(S(t, o))) assert.doesNotMatch(l, /^(?:\S+\s+){1,2}(?:it|there|them|this)['’]s\b/, `${m}: ${l}`);
});
