/* r86 v4.7: the on-device Sharpen after blind set 8 (review-hook-v46: hook46-1 to hook46-3) and the round-10 page jurors
   (page, web and UI/UX: engine items only).
   1. page juror: no sentence ends on a word that needs what came after it. "Everyone says ETH is dead but here's my take" never
      becomes "…but here's.": a contraction ("here's", "it's", "they're") never ends a sentence a version makes; an auxiliary,
      a copula or a verb whose object went ends one only where the draft's sentence ended there; and a "that"/subordinate clause
      at the end keeps its verb ("…figured out that the subject line." is refused). "here's my take" at the end is a pointer: kept
   2. page juror: "just my take, but" is a hedge frame, marked and kept with its "just", in every path (alts and put-backs)
   3. page juror: no clean line claims more than a quick check knows ("Nothing here can go…" is gone)
   4. page juror and hook46-3: the run-ups "I wanted to take a moment to…", "So thrilled that…", ", my honest take is that…"
   5. hook46-1/2: strict never ships the verbless "Our $3M seed round to help…"; a put-back after a split keeps the capital
   6. web juror: a figure lead keeps the verb that made it a claim ("we just crossed 1,000 paying users" never becomes "1,000
      paying users which is crazy."), and "just" that means recently stays; the unsure note names the check that refused a cut
   7. UI/UX juror: a long-line split never cuts a compound subject in two; a version never adds a pointer ("here's why:") the
      draft never made
   8. the 80-line v4.7 hunt (pointers and frames at the end, hedges), in every mode with alts and put-backs, against the hard
      guards, the page guard and this file's own reads; and the lines v4.6 broke on it are refused */
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
const HUNT = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-v47-hunt.json'), 'utf8')).lines;
/* every version a line can show: three modes, their alts, and a put-back of each of the first three cuts */
const allVersions = t => { const out = []; for (const [m, o] of MODES) { const r = S(t, o); for (const l of versions(r)) out.push([m, l, r.draft]); } for (const c of (S(t).cut || []).slice(0, 3)) { const r = S(t, { keep: [c.text] }); for (const l of versions(r)) out.push([`keep "${c.text}"`, l, r.draft]); } return out; };

/* this file's own reads, written apart from the engine's guards */
const sents = z => (String(z).match(/(?:[^.!?]|[.!?](?=[^\s.!?"”’)]))+(?:[.!?]+["”’)]*)?/g) || []).map(x => x.trim()).filter(Boolean);
const norm = z => String(z).toLowerCase().replace(/’/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim();
function broken(line, draft) {
  const l = String(line), d = String(draft), out = [], ds = new Set(sents(d).map(norm)), ll = l.toLowerCase().replace(/’/g, "'"), dl = d.toLowerCase().replace(/’/g, "'");
  for (const s of sents(l)) {
    if (ds.has(norm(s))) continue;
    if (!/(?:\.{2,}|…)["”’)]*\s*$/.test(s) && /\b(?:here|there|it|that|what|who|he|she|i|you|we|they)['’](?:s|re|m|ve|ll|d)\s*[.!?]*["”’)]*\s*(?:\p{Extended_Pictographic}️?\s*)*$/iu.test(s)) out.push(`ends on a contraction: ${s}`);
    if (/\b(?:here|there) (?:is|are)\s*[.!?]+["”’)]*$/i.test(s) && !/\b(?:here|there) (?:is|are)\s*[.!?]/i.test(d)) out.push(`ends on "here is": ${s}`);
    if (/\b(?:and|but|or|because|if|than|the|my|your|our)\s*[.!?]["”’)]*$/i.test(s)) out.push(`dangling end: ${s}`);
    const m = s.match(/\b(that|because|if|when)\s+((?:the|a|an|my|our|your|this|most)\s+[^,.!?;:]{2,40}?)[.!?]["”’)]*$/i);
    if (m && !/\b(?:is|are|was|were|has|have|had|do|does|did|can|will|would|could|should|[a-z]+ed|[a-z]+s)\b/i.test(m[2]) && dl.includes(`${m[1]} ${m[2]}`.toLowerCase()) && !new RegExp(`${`${m[1]} ${m[2]}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[.!?,;:]`, 'i').test(d)) out.push(`clause cut short: ${s}`);
    const f = s.match(/^[^\w$€£]*([$€£]?\d[\d,.]*[kKmM%]?)/);
    if (f) { const v = d.match(new RegExp(String.raw`\b(?:i|we|they|you)\s+(?:just\s+|finally\s+|officially\s+)?(hit|crossed|passed|reached|raised|made|lost|sold|signed|closed|got|grew)\s+(?:to\s+|over\s+)?${f[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')); if (v && !new RegExp(`\\b${v[1]}\\b`, 'i').test(s)) out.push(`the figure lost its verb: ${s}`); }
  }
  for (const m of dl.matchAll(/\bjust (hit|crossed|passed|launched|shipped|raised|signed|closed|reached|finished|got|made|won|lost|sold|quit|started|joined|released|published|opened|moved|bought|landed)\b/g)) if (new RegExp(`\\b${m[1]}\\b`).test(ll) && !new RegExp(`\\bjust ${m[1]}\\b`).test(ll)) out.push(`"just" (recently) lost: ${m[0]}`);
  if (/\bjust my (?:take|two cents|2 cents|opinion)\b/.test(dl) && /(?:^|[^\w])my (?:take|two cents|2 cents|opinion)\b/.test(ll) && !/\bjust my (?:take|two cents|2 cents|opinion)\b/.test(ll)) out.push('the hedge lost its "just"');
  for (const m of ll.matchAll(/\bhere's (why|how|what)\b/g)) if (!new RegExp(`\\b${m[1]}\\b`).test(dl) && !/🧵|👇|\bthread (?:on|about)\b|^\W*thread\b|\ba (?:quick |short )?thread\b/i.test(d)) out.push(`pointer added: ${m[0]}`);
  if (/^\W*[A-Z]/.test(d) && !/[.!?]["”’)]*\s+[a-z]/.test(d) && /[.!?]["”’)]*\s+(?!(?:i|iphone|ebay|x|btc|eth|sol)\b)[a-z]/.test(l)) out.push('lowercase after a stop');
  if (/(?<!\.)\.\.(?!\.)|[,;:][.!?]|[.!?][,;:]|,,|\.!|!\.|\s[,.!?]/.test(l) && !/(?<!\.)\.\.(?!\.)|[,;:][.!?]|[.!?][,;:]|,,|\.!|!\.|\s[,.!?]/.test(d)) out.push('punctuation');
  for (const n of d.replace(/\b2 cents\b/gi, '').match(/\$?\d[\d,.]*[kKmM%x]?/g) || []) if (!l.includes(n.replace(/[.,]$/, ''))) out.push(`lost ${n}`);
  return out;
}

/* what v4.6 made on the hunt: 9 lines broken (8 in every mode, 1 on a put-back) and 5 meaning or stance changes */
const V46_BAD = [
  ["Everyone says ETH is dead but here's.", "Everyone says ETH is dead but here's my take"],
  ["Everyone is panicking about the Fed meeting, so here's.", "Everyone is panicking about the Fed meeting, so here's my take"],
  ["Saw a lot of hot takes on the new iPhone today and here's.", "Saw a lot of hot takes on the new iPhone today and here's my take"],
  ["People keep asking what I think about remote work, here's.", "People keep asking what I think about remote work, here's my take"],
  ["Lots of noise about AI replacing designers this week, so here's.", "Lots of noise about AI replacing designers this week, so here is my take"],
  ["Everyone wants to talk about the halving, so here's.", "Everyone wants to talk about the halving, so here's my two cents"],
  ['Since a few people asked about our hiring process, here are.', 'Since a few people asked about our hiring process, here are my 2 cents'],
  ["I don't usually weigh in on Twitter drama but here's.", "I don't usually weigh in on Twitter drama but here's my 2 cents"],
  ["So we just hit $5k MRR. here's everything that worked.", "So we just hit $5k MRR and here's everything that worked"],
  ["1,000 paying users and here's what I learned.", "We just crossed 1,000 paying users and here's what I learned"],
  ["$5k MRR and here's everything that worked.", "So we just hit $5k MRR and here's everything that worked"],
  ["10,000 followers. I'm kind of speechless.", "I just passed 10,000 followers and I'm honestly kind of speechless"],
  ['1,000 paying users which is crazy.', 'so we just crossed 1,000 paying users which is literally crazy'],
  ['My take, but nobody needs a 12-step morning routine.', 'Honestly just my take, but nobody needs a 12-step morning routine']
];

test('v4.7, page juror: "here\'s my take" at the end is kept whole, never cut to "…but here\'s."', () => {
  for (const [m, o] of MODES) {
    for (const t of ["Everyone says ETH is dead but here's my take", 'Everyone is panicking about the Fed meeting, so here\'s my take', "I don't usually weigh in on Twitter drama but here's my 2 cents", 'Lots of noise about AI replacing designers this week, so here is my take', 'Everyone says ETH is dead but this is my take'])
      for (const l of [L(t, o), ...versions(S(t, o))]) assert.match(l, /\b(?:here['’]s|here is|here are|this is) my (?:take|2 cents|two cents)\b/, `${m}: ${t} → ${l}`);
    assert.equal(S("Everyone says ETH is dead but here's my take", o).state, 'clean', m);
  }
  /* a tail that stands on its own after the claim still goes */
  assert.equal(L('ETH is about to rip, just my take'), 'ETH is about to rip.');
  assert.equal(L('ETH will rip. That\'s my take.'), 'ETH will rip.');
});

test('v4.7, page juror: a sentence never ends on a word that needs what came after it', () => {
  const K = (l, d) => struct(l, d);
  /* a contraction never ends a sentence a version makes; the hard guard refuses it too */
  assert.match(K("Everyone says ETH is dead but here's.", "Everyone says ETH is dead but here's my take"), /ends needing more/);
  assert.match(hard("Everyone says ETH is dead but here's.", "Everyone says ETH is dead but here's my take"), /\S/);
  /* an auxiliary or a copula ends one only where the draft's sentence ended there */
  assert.match(K('Everyone says ETH is dead but here is.', 'Everyone says ETH is dead but here is my take'), /ends needing more/);
  assert.match(K('We shipped it. It is.', 'We shipped it and it is live'), /ends needing more/);
  assert.equal(K("Most people won't.", "Most people honestly won't."), '');
  assert.equal(K('Here it is 👀', 'Super pumped to finally share it 👀'), '');
  assert.equal(K('I keep saying "it is what it is". But it is not fine.', 'I keep saying "it is what it is" but honestly it is not fine.'), '');
  /* a verb whose object went */
  assert.match(K('I love.', 'I love my job honestly'), /object cut/);
  assert.equal(K('It works.', 'It honestly works.'), '');
  /* a "that" or subordinate clause at the end keeps its verb, unless the draft's own clause stopped there */
  assert.match(K('After three years, I have finally figured out that the subject line. The first sentence of the email matters most.', 'After three years, I have finally figured out that the subject line and the very first sentence of the email matter most'), /clause cut short/);
  assert.match(K('I quit because the commute.', 'I quit because the commute was killing me.'), /clause cut short/);
  assert.equal(K('I learned that the hard way.', 'I honestly learned that the hard way.'), '');
  /* every v4.6 break on the hunt is refused by the engine and by this file's reads */
  for (const [l, d] of V46_BAD) { assert.ok(hard(l, d) || struct(l, d), `engine lets through: ${l}`); assert.ok(broken(l, d).length, `this file lets through: ${l}`); }
});

test('v4.7, page juror: "just my take, but" is a hedge frame, marked and kept with its "just"', () => {
  for (const [m, o] of MODES) {
    const r = S('just my take, but ETH is about to rip', o);
    assert.equal(r.state, 'unsure', m); assert.equal(r.line, r.draft, m);
    assert.deepEqual(r.marks.map(k => [r.draft.slice(k[0], k[1]), k[3]]), [['just my take, but', 'frame']], m);
    assert.equal(L('Honestly just my take, but nobody needs a 12-step morning routine', o), 'Just my take, but nobody needs a 12-step morning routine.', m);
    assert.equal(S('Not financial advice, just my take, but ETH is about to rip', o).line, 'Not financial advice, just my take, but ETH is about to rip', m);
  }
  /* no path drops the "just" alone: not a cut, not an alt, not a put-back */
  for (const t of ['So just my take, but I think ETH is about to rip', 'Honestly just my take, but nobody needs a 12-step morning routine', 'Not financial advice, just my take, but ETH is about to rip', 'Look, just my opinion, but most founders hire too early'])
    for (const [m, l, d] of allVersions(t)) assert.doesNotMatch(l, /(?<!just )\bmy (?:take|opinion), but\b/i, `${m}: ${d} → ${l}`);
  assert.equal(L('So just my take, but I think ETH is about to rip', { keep: ['So'] }), 'So just my take, but I think ETH is about to rip');
});

test('v4.7, page juror: a clean line says it is a quick check, never that nothing can go', () => {
  assert.doesNotMatch(readFileSync(path.join(here, '../../core.js'), 'utf8'), /Nothing here can go|Nothing safe to cut here/);
  assert.equal(S("We're thrilled to finally announce our $3M seed round to help small teams ship faster! 🚀", { strict: true }).why, 'This quick check found nothing safe to cut. The marked words are your call.');
  const r = S('I wanted to say how far we have come together as a team this year and how proud I am of it');
  for (const t of ['The market doesn\'t owe you a bounce.', 'Everyone says ETH is dead but here\'s my take', 'Hot take incoming, hear me out', 'I think most productivity apps are just procrastination with extra steps, but that\'s just my opinion']) {
    const x = S(t); if (x.state !== 'clean') continue;
    assert.doesNotMatch(x.why, /Nothing here|can go without/, t);
    if (/stays as you wrote it/.test(x.why)) assert.match(x.why, /quick check|Couldn’t sharpen/, t);
  }
  assert.equal(S('Hot take incoming, hear me out').why, 'This quick check found nothing it could cut safely, so it stays as you wrote it.');
  assert.ok(r.state);
});

test('v4.7, page juror and hook46-3: the run-ups, as general forms', () => {
  for (const [m, o] of MODES) {
    assert.equal(L('I wanted to take a moment to reflect on how far we have come this year', o), 'I wanted to reflect on how far we have come this year.', m);
    /* v4.8 (round-11 marketing-1): the whole run-up goes, and the topic keeps its "why" as the pointer */
    assert.equal(L('Let me take a minute to explain why we changed our pricing', o), 'Why we changed our pricing:', m);
    assert.match(L("I'd like to take a moment to thank all of our early customers who believed in us.", o), /^I'd like to thank all (?:of )?our early customers who believed in us\.$/, m);
    assert.equal(L('So thrilled that this newsletter just passed 20,000 readers, thank you all for being here 💛', o), 'This newsletter just passed 20,000 readers, thank you all for being here 💛', m);
    assert.equal(L('So excited that our first hire starts on Monday', o), 'Our first hire starts on Monday.', m);
    assert.equal(L("If you've ever thought about writing online, my honest take is that a newsletter is the best place to start.", o), "If you've ever thought about writing online, a newsletter is the best place to start.", m);
    assert.equal(L("If you're new to lifting, my honest take is that you don't need a program yet", o), "If you're new to lifting, you don't need a program yet.", m);
  }
  /* an order to the reader is no run-up, and a feeling that is the point stays */
  assert.equal(L('Take a moment to check in on your friends today'), 'Take a moment to check in on your friends today');
  assert.equal(L("I'm so happy that my mom finally got to see the ocean"), "I'm so happy that my mom finally got to see the ocean");
  /* the explanation names the cut it made, not the run-up around it */
  const r = S('I wanted to take a moment to talk about something that I think is really important for anyone writing online');
  assert.deepEqual(r.cut.map(c => c.text), ['take a moment to', 'really']);
  assert.doesNotMatch(r.why, /stays: cutting it/);
});

test('v4.7, hook46-1/2: strict never ships the verbless announce cut; a put-back after a split keeps the capital', () => {
  const p26 = "We're thrilled to finally announce our $3M seed round to help small teams ship faster! 🚀";
  /* v4.9 (round-12 uiux-3): no "We raised" the draft never wrote; the writer's own verb leads in its -ing form */
  assert.equal(L(p26), "We're finally announcing our $3M seed round to help small teams ship faster! 🚀");
  const st = S(p26, { strict: true });
  assert.ok(st.state !== 'sharp' || D.mainFin(st.line), `strict: ${st.line}`);
  assert.doesNotMatch(st.line, /^Our \$3M seed round/);
  assert.equal(D.sentKind('Our $3M seed round to help small teams ship faster! 🚀'), 'no verb');
  assert.equal(D.sentKind('So I built a tool to help founders ship faster.'), '');
  assert.doesNotMatch(L(p26, { keep: ['our'] }), /^Our \$3M seed round to help/);
  assert.equal(L('So we rewrote our backend in Rust and our AWS bill basically dropped by 60%.', { keep: ['So'] }), 'So we rewrote our backend in Rust. Our AWS bill basically dropped by 60%.');
  assert.equal(L("We're super excited to share that we just launched our new pricing page and honestly it's the best version yet!", { keep: ["We're super excited to share that"] }), "We're super excited to share that we just launched our new pricing page. It's the best version yet!");
  /* a lowercase writer keeps lowercase sentence starts */
  assert.equal(L('so we rewrote our backend in rust and our aws bill basically dropped by 60%.', { keep: ['so'] }), 'so we rewrote our backend in rust. our aws bill basically dropped by 60%.');
});

test('v4.7, web juror: a figure lead keeps its verb, "just" (recently) stays, and the unsure note is true', () => {
  for (const [m, o] of MODES) {
    for (const t of ['so we just crossed 1,000 paying users which is literally crazy', 'So I just hit 50,000 followers today and I honestly have no idea how this happened lol', 'Big news: we just hit $10k MRR, 14 months after launching', "We're beyond thrilled to share that we just crossed $50k MRR this month! Thank you to every single customer 🙏"])
      for (const l of versions(S(t, o))) { assert.match(l, /\bjust (?:crossed|hit)\b/i, `${m}: ${t} → ${l}`); assert.deepEqual(broken(l, t), [], `${m}: ${t} → ${l}`); }
  }
  assert.equal(L('so we just crossed 1,000 paying users which is literally crazy'), 'we just crossed 1,000 paying users which is crazy.');
  assert.match(hard('1,000 paying users which is crazy.', 'so we just crossed 1,000 paying users which is literally crazy'), /predicate dropped/);
  assert.match(hard('We crossed 1,000 paying users.', 'so we just crossed 1,000 paying users'), /recency lost/);
  /* a stat lead that says what happened, or has its own verb, is fine */
  assert.equal(hard('8 years of coaching runners. If you are new, slow down.', "I've been coaching runners for 8 years and honestly if you are new, slow down."), '');
  assert.equal(hard('0 → $40k MRR in 9 months.', 'We went from 0 to $40k MRR in 9 months. Let that sink in.'), '');
  assert.equal(hard("8 years of design work taught me this: clients don't buy pixels. They buy confidence.", "What I've realized after 8 years of design work is that clients don't buy pixels, they buy confidence"), '');
  /* the score no longer docks, or says to cut, a "just" that means recently */
  assert.doesNotMatch(JSON.stringify(core.hookScore('We just crossed 5,000 readers. Thank you to everyone who subscribed.').reason), /“just” is filler/);
  /* the unsure note: the safe fillers go and only the doubtful word stays marked; "breaks" only when a check refused that cut */
  assert.equal(L('so basically my newsletter just hit 5,000 readers which is honestly wild'), 'my newsletter just hit 5,000 readers which is wild.');
  /* v4.8 (round-11 founder-3): a doubled intensifier collapses or goes; "I think" stays as the one hedge, and the why says what went */
  const rr = S('I really really think you should start a newsletter');
  assert.equal(rr.line, 'I think you should start a newsletter.'); assert.doesNotMatch(rr.why, /breaks/); assert.match(rr.why, /twice/);
  const q = S('Just wanted to share a quick redesign I did of the @Spotify mobile app. Would love to hear your thoughts!');
  assert.equal(q.why, 'Marked “Just wanted to share”, not cut: without it this line breaks. Your call.');
  assert.ok(hard('A quick redesign I did of the @Spotify mobile app. Would love to hear your thoughts!', q.draft));
});

test('v4.7, UI/UX juror: a long-line split keeps compound subjects whole; no pointer the draft never made', () => {
  const long = 'So basically I wanted to share that after three years of writing a newsletter every single week, I have finally figured out that the subject line and the very first sentence of the email matter more than anything else you could possibly do, and honestly the rest is just noise that nobody reads anyway, so here is what I do now every week.';
  for (const [m, o] of MODES) for (const l of versions(S(long, o))) { assert.doesNotMatch(l, /that the subject line\./, `${m}: ${l}`); assert.match(l, /the subject line and the first sentence/, `${m}: ${l}`); }
  const multi = 'honestly i think this thread is literally the most useful thing i wrote\n\n1. size down after a red day\n2. never add to a loser\n3. journal every trade';
  for (const [m, o] of MODES) { const r = S(multi, o); for (const l of versions(r)) assert.doesNotMatch(l, /here['’]s (?:why|how|what)|thread:/i, `${m}: ${l}`); assert.equal(r.line, 'i think this thread is the most useful thing i wrote.', m); }
  assert.match(hard("i think this thread is the most useful thing i wrote. here's why:", 'honestly i think this thread is literally the most useful thing i wrote'), /pointer added/);
  /* a pointer the draft made stays allowed */
  assert.equal(L('Quick thread on how I size my trades'), 'I size my trades. Here’s how:'); /* v4.8 (brand-4): ’ when the draft has none */
  assert.equal(L("I've been writing this newsletter for 200 weeks straight and I want to share what I learned"), "I've been writing this newsletter for 200 weeks straight. Here's what I learned.");
  assert.equal(hard("We doubled demo bookings. Here's how:", "Here's a thread on how we doubled demo bookings"), '');
  /* the news leads a post over 280, with its verb */
  assert.match(L("I've been building in public for almost two years now and I wanted to share something that I really think a lot of people get wrong, which is that they focus way too much on follower count and not nearly enough on whether the people following them actually care about what they're building. We just hit $20k MRR with 3,100 followers."), /^We just hit \$20k MRR with 3,100 followers\. /);
});

test('v4.7: the 80-line hunt, every mode, alts and put-backs: no hard guard, no page read, none of this file\'s shapes', () => {
  assert.equal(HUNT.length, 80);
  const bad = [];
  for (const t of HUNT) for (const [m, l, d] of allVersions(t)) { const h = hard(l, d), w = whole(l, d), b = broken(l, d); if (h || w || b.length) bad.push(`${m}: ${t} → ${l} (${h || w || b.join(', ')})`); }
  assert.deepEqual(bad, []);
  /* pointers and frames at the end stay whole */
  for (const t of HUNT.filter(x => /\b(?:here['’]s|here is|here are) my (?:honest )?(?:take|two cents|2 cents)$/i.test(x)))
    for (const [m, l] of allVersions(t)) assert.match(l, /\b(?:here['’]s|here is|here are) my (?:honest )?(?:take|two cents|2 cents)\.?$/i, `${m}: ${t} → ${l}`);
});
