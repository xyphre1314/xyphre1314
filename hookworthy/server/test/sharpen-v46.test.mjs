/* r86 v4.6: the on-device Sharpen after blind set 7 (review-hook-v45: hook45-1 to hook45-4, on-device) and the page pass 11
   engine items.
   1. hook45-1 (q-31, the one break): a positive whole-sentence read. Every sentence a version creates or changes needs its own
      main clause (a subject and a finite verb, an order, or a question); it is never only a subordinate clause ("(So) if…",
      "And when…", "Because…"), whatever discourse marker opens it; it never ends on a joining word or a preposition whose object
      went; and its subjects and verbs agree. A fragment passes only when the draft already had it, or as a label or a pointer.
      A version with a sentence that fails is dropped, in every mode and on every alt, so the cut-only version or the draft ships
   2. hook45-2 and founder-6: "basically" a few words before a number or a value ("dropped to zero", "went up by 30%",
      "break-even") and "very few" keep their word, and the note says it says nearly, not exactly
   3. hook45-3: a hedge frame is cut or kept as a comma frame, never made its own sentence; "what they really think" keeps "really"
   4. hook45-4: "Just a friendly reminder to", "and I wanted to share what changed:", "so I figured I'd just share" are run-ups
   5. page pass 11: the two-beat why is short; the homepage's Try default and starters are warmed first
   6. the 80-line v4.6 hunt (structure: conditionals after a discourse marker, "because", relative clauses, lists, questions,
      run-ons), in every mode, against the hard guards (the positive read among them), the page guard and this file's own reads;
      and the six lines v4.5 broke on it are refused by both */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const core = createRequire(import.meta.url)('../../core.js');
const S = (t, o) => core.sharpenLine(t, o), L = (t, o) => S(t, o).line;
const D = core.SHARPEN._dbg, hard = D.hard, whole = D.whole, struct = D.struct;
const versions = r => r.state === 'sharp' ? [r.line, ...(r.alts || []).map(a => a.line)] : [];
const MODES = [['default', {}], ['v4.1', { hybrid: false }], ['strict', { strict: true }]];
const HUNT = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-v46-hunt.json'), 'utf8')).lines;
const HUNT45 = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-v45-hunt.json'), 'utf8')).lines;

/* this file's own reads of the structure breaks, written apart from the engine's guards */
const sents = z => (String(z).match(/(?:[^.!?]|[.!?](?=[^\s.!?"”’)]))+(?:[.!?]+["”’)]*)?/g) || []).map(x => x.trim()).filter(Boolean);
const norm = z => String(z).toLowerCase().replace(/’/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
const DM = String.raw`(?:(?:so|and|but|honestly|then|now|plus|basically|actually)[,]?\s+)*`;
function broken(line, draft) {
  const l = String(line), d = String(draft), out = [], ds = new Set(sents(d).map(norm));
  for (const s of sents(l)) {
    if (ds.has(norm(s))) continue;
    /* a subordinate clause with no main clause: it opens the sentence (after any discourse marker) and no comma follows it */
    if (new RegExp(String.raw`^${DM}(?:if|when|whenever|unless|because|although|though|while|once|until|as long as|as soon as|even if|even though)\b[^,;:]*[.!?]?["”’)]*$`, 'i').test(s)) out.push(`subordinate clause alone: ${s}`);
    /* a condition joined on with and/but/so that ends the sentence */
    if (/\b(?:and|but|so)\s+(?:when|if|as long as|once|unless|until)\b[^,.!?]*[.!?]["”’)]*$/i.test(s)) out.push(`condition cut off: ${s}`);
    /* a purpose clause on its own */
    if (/^so (?:that )?(?:i|we|you|they) (?:could|can|would|might)\b/i.test(s)) out.push(`purpose clause alone: ${s}`);
    /* a question split from its mark */
    if (/^(?:do|does|did|is|are|can|have|has) (?:you|we|i|anyone|they)\b/i.test(s) && !/\?["”’)]*$/.test(s) && /\?\s*$/.test(d)) out.push(`question lost its mark: ${s}`);
    /* a clause whose verb a move ate: "Once I down to 3 times a week" */
    if (/\b(?:once|when|if|after)\s+(?:i|we|you|they)\s+(?:up|down|to)\b/i.test(s)) out.push(`verb lost: ${s}`);
    /* a joining word or an article left at the end */
    if (/\b(?:and|but|or|because|if|than|the|a|an|my|your|our)\s*[.!?]["”’)]*$/i.test(s)) out.push(`dangling end: ${s}`);
  }
  if (/(?<!\.)\.\.(?!\.)|[,;:][.!?]|[.!?][,;:]|,,|\.!|!\.|\s[,.!?]/.test(l) && !/(?<!\.)\.\.(?!\.)|[,;:][.!?]|[.!?][,;:]|,,|\.!|!\.|\s[,.!?]/.test(d)) out.push('punctuation');
  for (const n of d.match(/\$?\d[\d,.]*[kKmM%x]?/g) || []) if (!l.includes(n.replace(/[.,]$/, ''))) out.push(`lost ${n}`);
  return out;
}

/* the six lines v4.5 made on the hunt that break a sentence */
const V45_BROKEN = [
  ["If you're a first-time founder and you're not talking to customers every week. You're guessing.", "So if you're a first-time founder and you're not talking to customers every week, you're basically guessing."],
  ['We stopped doing weekly all-hands meetings and when we asked the team a month later. Nobody wanted them back.', 'So we stopped doing weekly all-hands meetings and honestly, when we asked the team a month later, nobody wanted them back.'],
  ['I spent two hours setting up a new workflow. So I could save ten minutes a week, which is on brand for me.', 'I spent two hours setting up a new workflow so I could save ten minutes a week, which is very on brand for me.'],
  ['Do you ever open your laptop to do one thing. Then forget what it was?', 'Do you ever open your laptop to do one thing and then forget what it was?'],
  ["I've been running the same ads for 6 months and as long as the numbers hold. I'm not touching them.", "So I've been running the same ads for 6 months and honestly, as long as the numbers hold, I'm not touching them."],
  ['Once I down to 3 times a week, my replies doubled. What changed: I used to post 5 times a day.', 'I used to post 5 times a day and honestly, once I dropped to 3 times a week, my replies doubled.']
];

test('v4.6, hook45-1: q-31 keeps "If X, Y" together, in every mode', () => {
  const q31 = "I've been building in public for about a year now, and if I'm being completely honest, I didn't expect it to change anything, but it's brought us our first 40 customers, two angel investors, and honestly some of the best friends I've made as an adult, so if you've been on the fence about sharing your journey, this is your sign.";
  for (const [m, o] of MODES) {
    /* v5.5 (Fable round 4, H1): over 280, the beats open a thread of whole sentences, in every mode */
    const r = S(q31, o), l = (r.thread || [r.line]).join(' ');
    assert.equal(l, "I've been building in public for about a year now, and I didn't expect it to change anything. But it's brought us our first 40 customers, two angel investors, and some of the best friends I've made as an adult. So if you've been on the fence about sharing your journey, this is your sign.", m);
  }
  /* the v4.5 line is refused by the positive read, and by this file's own */
  const v45 = "I've been building in public for about a year now, and I didn't expect it to change anything, but it's brought us our first 40 customers, two angel investors, and some of the best friends I've made as an adult. So if you've been on the fence about sharing your journey. This is your sign.";
  assert.match(struct(v45, q31), /subordinate clause alone/); assert.match(hard(v45, q31), /not a whole sentence/); assert.ok(broken(v45, q31).length);
});

test('v4.6, hook45-1: the positive read, by kind, against its clean twin', () => {
  const K = D.sentKind;
  /* a subordinate clause alone, after any discourse marker */
  for (const s of ['So if you have been on the fence about sharing your journey.', 'And when you finally ship it.', 'Because I think nobody reads it.', 'Honestly, unless you track your sleep.', 'But even though we tried.'])
    assert.equal(K(s), 'subordinate clause alone', s);
  for (const s of ['So if you have been on the fence, this is your sign.', 'If you are new to running, slow down.', 'If you build it they will come.', 'When I started I had no idea.', 'Just because you can doesn\'t mean you should.', 'What if we just stopped scheduling meetings on Fridays?', 'When do you post?'])
    assert.equal(K(s), '', s);
  /* a condition joined on with "and" needs its own main clause */
  assert.equal(K('We stopped the meetings and when we asked the team a month later.'), 'subordinate clause alone');
  assert.equal(K('We stopped the meetings and when we asked the team, nobody wanted them back.'), '');
  assert.equal(K('I will do it, but only if you pay.'), '');
  /* a subordinate clause has a verb of its own; an elliptical one ("If not,") is whole */
  assert.equal(K('Once I down to 3 times a week, my replies doubled.'), 'no verb');
  assert.equal(K('If not, you lose.'), '');
  /* no verb, no subject, a relative alone, a conjunction up front */
  assert.equal(K('Not sure if this is controversial.'), 'no verb');
  assert.equal(K('Feels like everyone is just waiting.'), 'no subject');
  assert.equal(K('Think most side projects would be better off as one file.'), 'no subject');
  assert.equal(K('Which is why I quit.'), 'relative clause alone');
  assert.equal(K('Or anything like that.'), 'conjunction start');
  /* orders, labels and pointers are whole */
  for (const s of ['Stop chasing virality.', 'Squat 3x a week for 12 weeks.', 'Here’s how:', 'What changed: I redesigned our pricing page last week.', 'The fix: patience.', 'Thread: what I learned shipping 12 apps 🧵', '3 stretches that fixed my lower back pain:', 'Huge thanks to @supabase for saving our launch 🙏'])
    assert.equal(K(s), '', s);
  /* a version is read sentence by sentence against the draft: the writer's own fragment stays allowed */
  const d1 = 'Got asked what my newsletter stack is so I figured I\'d just share everything I use, it\'s pretty simple:';
  assert.equal(struct('Got asked what my newsletter stack is. Here\'s everything I use, it\'s pretty simple:', d1), '');
  assert.equal(struct('I\'m kind of surprised how quiet the market has been. Feels like everyone is waiting.', 'Honestly I\'m kind of surprised how quiet the market has been, feels like everyone is waiting.'), '');
  assert.match(struct('I\'ve been building for 2 years. Haven\'t made a dollar.', 'I\'ve been building for 2 years and haven\'t made a dollar.'), /no subject/);
  /* a short question and its answer, a stat up front with its body, a tag question */
  assert.equal(struct('Best part of posting online? The people you meet.', 'The best part of posting online is honestly the people you meet.'), '');
  assert.equal(struct('$50k MRR this month. Thank you to every single customer 🙏', 'We\'re beyond thrilled to share that we just crossed $50k MRR this month! Thank you to every single customer 🙏'), '');
  assert.equal(struct('This market is boring right now. Anyone else?', 'Does anyone else feel like this market is really boring right now?'), '');
  assert.match(struct('This market is boring right now.', 'This market is boring right now, but nobody wants to admit it.'), /^$/);
  /* a dangling preposition or joining word at the end, when the draft had more after it */
  assert.match(struct('This is your sign to.', 'Honestly this is your sign to start.'), /dangling end/);
  assert.equal(struct('I finally called my grandma back after weeks of meaning to. We talked for 2 hours.', 'So I finally called my grandma back after weeks of meaning to and we talked for 2 hours.'), '');
  /* agreement */
  assert.match(struct('They was right. I is wrong.', 'Honestly they were right and I am wrong.'), /agreement/);
  /* a purpose clause and a question split off */
  assert.match(struct(V45_BROKEN[2][0], V45_BROKEN[2][1]), /subordinate clause alone/);
  assert.match(struct(V45_BROKEN[3][0], V45_BROKEN[3][1]), /question lost its mark/);
});

test('v4.6, hook45-2 and founder-6: "basically" near a value and "very few" stay, with a true note', () => {
  const q2 = S('So I finally set up alerts instead of staring at charts all day and my stress levels have basically dropped to zero.');
  assert.equal(q2.line, 'I finally set up alerts instead of staring at charts all day. My stress levels have basically dropped to zero.');
  assert.equal(q2.note, 'Left “basically” in: it says nearly, not exactly.'); /* v5.1 */
  const q95 = S('So I redesigned our pricing page last week and conversions basically went up by 30%.');
  for (const l of versions(q95)) assert.match(l, /basically went up by 30%/);
  assert.match(q95.note, /it says nearly, not exactly/);
  assert.match(L('Honestly we are basically break-even after 8 months.'), /basically break-even/);
  const vf = S('Very few founders talk about this.'); assert.equal(vf.state, 'clean'); assert.equal(vf.why, 'Kept “Very few”: here it’s part of what you mean, not filler.');
  assert.match(L('I really didn\'t expect our tiny Discord to turn into the main way we find customers, but it basically did.'), /it basically did\.$/);
  /* "basically" as filler still goes ("basically putting together 9 templates", juror 4's "basically going to hit") */
  assert.doesNotMatch(L('Spent the weekend basically putting together 9 hook templates that I personally use with my clients, and I\'m giving them all away for free:'), /basically/);
  assert.equal(L("I think we're basically going to hit $50k MRR this month."), "I think we're going to hit $50k MRR this month.");
});

test('v4.6, hook45-3: a hedge frame is cut, never its own sentence; "what they really think" keeps "really"', () => {
  for (const [m, o] of MODES) {
    assert.equal(L('Not sure if this is controversial, but I think most LinkedIn advice is basically written for people who sell LinkedIn advice.', o), 'Most LinkedIn advice is written for people who sell LinkedIn advice.', m); /* v5.4 (Fable round 3, step 3): one rule: on a plain view a stance or a hedge is cut; on a forecast or a call it is the writer's call */
    /* v5.3 (Fable g-16, step 5): "I feel like" on a plain view is a run-up too, so both hedges go */
    assert.equal(L('Not sure if this is just me, but I feel like every new JavaScript tool has a 10-step setup process now.', o), 'Every new JavaScript tool has a 10-step setup process now.', m);
    assert.equal(L("Most B2B founders I talk to would honestly get way more inbound if they'd just say what they really think.", o), "Most B2B founders I talk to would get way more inbound if they'd just say what they really think.", m);
  }
  /* the frame alone as a sentence is refused, whatever made it */
  const d = 'Not sure if this is controversial, but I think most LinkedIn advice is written for people who sell it.';
  assert.match(hard('Not sure if this is controversial. But I think most LinkedIn advice is written for people who sell it.', d), /no verb/);
  assert.equal(L('Most people who say they want to start a business really just want to quit their job, and that\'s okay.'), 'Most people who say they want to start a business really just want to quit their job, and that\'s okay.');
});

test('v4.6, hook45-4: the three set-7 run-ups', () => {
  for (const [m, o] of MODES) assert.equal(L('Just a friendly reminder to take some profits on the way up, future you will thank you.', o), 'Take some profits on the way up, future you will thank you.', m);
  assert.equal(L("So I've been doing 10,000 steps a day for the last 90 days and I wanted to share what changed:"), "I've been doing 10,000 steps a day for the last 90 days. Here's what changed:");
  assert.equal(L("Got asked what my newsletter stack is so I figured I'd just share everything I use, it's pretty simple:"), "Got asked what my newsletter stack is. Here's everything I use, it's pretty simple:");
  /* a one-line draft with no colon keeps its full stop */
  assert.equal(L("I've been writing this newsletter for 200 weeks straight and I want to share what I learned"), "I've been writing this newsletter for 200 weeks straight. Here's what I learned.");
});

test('v4.6, page pass 11: a short two-beat why, and the homepage lines warmed first', () => {
  const r = S('So I tried three different note-taking apps this year and honestly I\'m back to a plain text file.');
  assert.equal(r.why, 'The full stop before “I\'m back” gives it its own beat.');
  assert.ok(r.why.split(/\s+/).length <= 12, r.why);
  const steps = core.SHARPEN.warmSteps(), src = steps.map(f => String(f));
  /* their whole paths run once the tables and the moves are compiled, before the rest of the warm-up's lines and full paths */
  const home = src.reduce((k, s, i) => /sharpenLine\(t, \{ keep: \[\] \}\)/.test(s) ? i : k, -1), rest = src.findIndex(s => /softMarks\(short\(t\)/.test(s));
  assert.ok(home > 0 && rest > 0 && home < rest, `home lines done at step ${home}, the rest starts at ${rest}`);
  assert.equal(src.filter(s => /sharpenLine\(t, \{ keep: \[\] \}\)/.test(s)).length, 6);
});

test('v4.6: the 80-line hunt, every mode: no hard guard, no page guard, none of this file\'s break shapes', () => {
  assert.equal(HUNT.length, 80);
  /* the six lines v4.5 broke: the positive read refuses each, and so do this file's own reads */
  for (const [l, d] of V45_BROKEN) { assert.match(struct(l, d), /not a whole sentence/, l); assert.ok(broken(l, d).length, l); }
  const bad = [];
  for (const t of HUNT) for (const [m, o] of MODES) { const r = S(t, o); for (const l of versions(r)) { const h = hard(l, r.draft), w = whole(l, r.draft), b = broken(l, r.draft); if (h || w || b.length) bad.push(`${m}: ${t} → ${l} (${h || w || b.join(', ')})`); } }
  assert.deepEqual(bad, []);
  /* and the v4.5 hunt reads clean to this file's checks too */
  for (const t of HUNT45) for (const [m, o] of MODES) { const r = S(t, o); for (const l of versions(r)) { const b = broken(l, r.draft); if (b.length) bad.push(`v4.5 hunt, ${m}: ${t} → ${l} (${b.join(', ')})`); } }
  assert.deepEqual(bad, []);
  /* the three meaning changes v4.5 made on the hunt stay fixed */
  assert.equal(L('I stopped posting every day because I was burning out, and honestly my engagement actually went up.'), 'I stopped posting every day because I was burning out. My engagement actually went up.');
  for (const [m, o] of MODES) assert.doesNotMatch(L('I used to post 5 times a day and honestly, once I dropped to 3 times a week, my replies doubled.', o), /What changed/, m);
});
