/* r86 v4.9: the on-device Sharpen after the P0 report (a run-up stacked before an announcement frame) and the round-12 page jurors
   (engine items only).
   1. P0: a run-up before an announcement frame ("Just wanted to say [that] I'm excited to announce our new app") is cut in the same
      pass as the frame, so the frame's grammar reads what is left after the run-up: "I'm announcing our new app.", never "I'm
      announce our new app.". A time word up front ("Today I'm excited to announce…") stays, and the frame after it is read
   2. slStruct, the positive whole-sentence read, rejects a be-auxiliary before a bare verb ("I'm announce", "we're launch", "she's
      share"), I/we/they + an -s verb past an adverb, a run-up left without its clause ("I have to say v2."), an infinitive after a
      feeling made into an order ("Launch our new app."), and a noun phrase with only its participle ("Our $2.5M pre-seed led by…")
   3. the exhaustive cross-product: 12 run-ups × 8 announcement frames × 6 objects = 576 lines, every version in every mode passes
      slHard and this file's own reads (written apart from the engine), and at most ~5% stay as written
   4. round 12: founder-1 ("In today's newsletter, I want to talk about the 5 mistakes every new trader makes" → "The 5 mistakes
      every new trader makes:"), "Some thoughts on pricing:", "Big announcement:" is hype and goes, "breaks" never where a header
      would stand, uiux-4 (one hedge per clause: "i think that maybe we should…" → "i think that we should…"), uiux-3 (no "We
      raised" the draft never wrote) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const core = createRequire(import.meta.url)('../../core.js');
const S = (t, o) => core.sharpenLine(t, o), L = (t, o) => S(t, o).line;
const D = core.SHARPEN._dbg, hard = D.hard, struct = D.struct;
const versions = r => r.state === 'sharp' ? [r.line, ...(r.alts || []).map(a => a.line)] : [];
const MODES = [['default', {}], ['v4.1', { hybrid: false }], ['strict', { strict: true }]];

/* ---------------- this file's own reads, written apart from the engine (no engine function is used) ---------------- */
const BASE = new Set(('announce share launch introduce unveil reveal release debut tell say show build ship raise join start create make write give take '
  + 'bring see get have hire thank invite celebrate sell buy teach learn explore grow decide offer add find keep know think want need try use '
  + 'become begin choose deliver discover enjoy expect explain follow hope imagine improve invest leave meet pay unlock publish send speak talk sign expand reach return').split(' '));
const S3 = new Set(('announces shares launches introduces unveils reveals releases debuts tells says shows builds ships raises joins starts creates makes '
  + 'writes gives takes brings sees gets has hires thanks invites celebrates sells buys teaches learns explores grows decides offers adds finds keeps '
  + 'knows thinks wants needs tries uses becomes begins chooses delivers discovers enjoys expects explains follows hopes imagines improves invests '
  + 'leaves meets pays publishes sends speaks talks signs expands reaches returns does is was').split(' '));
const ADV = '(?:(?:really|just|so|finally|officially|now|also|still|actually|not|never|always|very|super|truly|honestly)\\s+)*';
const NOUNNEXT = /^(?:day|days|week|weeks|month|time|season|night|party|date|mode|o'clock|team|page|post|video|thread|plan|update|list|event|stream)\b/;
const nz = z => ' ' + String(z).toLowerCase().replace(/[’‘]/g, "'").replace(/[^a-z0-9' $]+/g, ' ').replace(/\s+/g, ' ') + ' ';
const sents = z => (String(z).match(/(?:[^.!?:]|[.!?:](?=[^\s.!?"”’)]))+(?:[.!?:]+["”’)]*)?/g) || []).map(x => x.trim()).filter(Boolean);
function counts(z) {
  const t = nz(z), o = { aspect: 0, agree: 0, he: 0, dbl: 0 };
  for (const m of t.matchAll(new RegExp(String.raw`(?<=\s)(?:(?:i|we|you|they|he|she|it|that|there|who)'(?:m|re|s)|am|is|are|was|were|be)\s+${ADV}([a-z]+)\s+(\S*)`, 'g'))) if (BASE.has(m[1]) && !NOUNNEXT.test(m[2])) o.aspect++;
  for (const m of t.matchAll(new RegExp(String.raw`(?<=\s)(i|we|they|you)\s+${ADV}([a-z]+)(?=\s)`, 'g'))) if (S3.has(m[2]) && !(m[1] === 'i' && m[2] === 'was')) o.agree++;
  for (const m of t.matchAll(new RegExp(String.raw`(?<=\s)(\S+)\s+(he|she|it)\s+${ADV}([a-z]+)(?=\s)`, 'g'))) if (BASE.has(m[3]) && !/^(?:did|does|do|will|would|can|could|should|might|may|must|to|let|make|made|help|watch|see|saw|hear|have|had|why|how|when|what)$/.test(m[1])) o.he++;
  for (const m of t.matchAll(/(?<=\s)(?:i'm am|we're are|you're are|they're are|it's is|i am am|we are are)(?=\s)/g)) o.dbl += m ? 1 : 0;
  return o;
}
const RUN = /^\W*(?:(?:so|ok|okay|and|but)\W+)*(?:(?:i|we)(?:'m| am|'re| are) (?:just )?here to (say|tell you)|(?:(?:i|we) )?(?:(?:just|really|also) )*(?:wanted|want|have|had|got|gotta|would like|'d like|need) to (?:(?:quickly|just) )*(say|share|announce|tell you|tell everyone|let you know|let everyone know))( that)?,? (.+?)\W*$/;
const FEELW = /^(?:(?:so|super|really|very|beyond|incredibly|truly|extremely|absolutely) )*(?:excited|thrilled|proud|happy|pleased|delighted|stoked|pumped|grateful|honou?red|humbled|blessed) to\b/;
const FIN = /\b(?:am|is|are|was|were|has|have|had|do|does|did|will|would|can|could|should|'m|'re|'s|'ve|'ll|'d|[a-z]{2,}ed|raised|shipped|joined|built|made|got|hit|won|lost|sold|launched)\b|\b(?:i|we|you|they)\s+[a-z]+\b/;
const runups = z => sents(z).map(s => nz(s).trim().match(RUN)).filter(Boolean).map(m => { const v = m[1] || m[2], r = m[4]; return { r, bad: FEELW.test(r) || (BASE.has(r.split(' ')[0]) && !/^(?:thank|welcome)$/.test(r.split(' ')[0])) || ((!!m[3] || /^(?:say|tell|let)/.test(v)) && !FIN.test(r) && !/^(?:hi|hello|thanks|thank you|no|yes|goodbye|it|this|that|something|sorry|congrats|what|how|why|when|who)\b/.test(r)) }; });
const VERBISH = /\b(?:is|are|was|were|am|be|been|has|have|had|do|does|did|will|would|can|could|should|'m|'re|'s|'ve|'ll|[a-z]{3,}ing|[a-z]{3,}ed|raised|joined|launched)\b/;
const npOnly = s => { const w = nz(s).trim(); if (!/^(?:our|my|the|a|an|their|his|her|its|your|this|v\d[\w.]*)\b/.test(w) || VERBISH.test(w)) return false; const ws = w.split(' '); return ws.length <= 4 && !ws.some(x => BASE.has(x) || S3.has(x)); };
/* every problem the line has that its draft doesn't */
function agree(line, draft) {
  const a = counts(line), b = counts(draft), out = [];
  for (const k of Object.keys(a)) if (a[k] > b[k]) out.push(k);
  const ds = new Set(sents(draft).map(x => nz(x).trim()));
  if (sents(line).length === 1 && !ds.has(nz(line).trim()) && npOnly(line)) out.push('fragment');
  { const dr = new Set(runups(draft).map(x => x.r)); for (const x of runups(line)) if (x.bad && !dr.has(x.r)) out.push('run-up without its clause'); }
  { const d = nz(draft), d0 = sents(draft).map(x => nz(x).trim().split(' ')[0]); for (const s of sents(line)) { const v = nz(s).trim().split(' ')[0]; if (BASE.has(v) && !d0.includes(v) && new RegExp(`(?:excited|thrilled|proud|happy|pleased|delighted|stoked|pumped|grateful) to (?:(?:finally|officially|now) )*${v}\\b`).test(d)) out.push('order made'); } }
  return out;
}
const allVersions = t => { const out = []; for (const [m, o] of MODES) { const r = S(t, o); for (const l of versions(r)) out.push([m, l, r.draft]); } for (const c of (S(t).cut || []).slice(0, 3)) { const r = S(t, { keep: [c.text] }); for (const l of versions(r)) out.push([`keep “${c.text}”`, l, r.draft]); } return out; };
const failsOf = t => allVersions(t).flatMap(([m, l, d]) => [hard(l, d) && `${m}: ${hard(l, d)}`, ...agree(l, d).map(x => `${m}: ${x}`)].filter(Boolean).map(f => `${f} | ${t} → ${l}`));

/* ---------------- 1. P0 ---------------- */
test('v4.9 P0: a run-up stacked before an announcement frame is cut with it, and the verb keeps its -ing', () => {
  for (const [t, want] of [
    ["Just wanted to say I'm excited to announce our new app", "I'm announcing our new app."],
    ["So I just wanted to say that I'm thrilled to announce our new course", "I'm announcing our new course."],
    ["I wanted to share that I'm really excited to announce my new job", "I'm announcing my new job."],
    ['I just wanted to say that I am really excited to announce our new feature', 'I’m announcing our new feature.'],
    ["Today I'm excited to announce our new feature", "Today I'm announcing our new feature."],
    ['Hey everyone, so thrilled to launch our new app', 'Launching our new app.'],
    ['Ok so we are happy to introduce v2', 'We’re introducing v2.'],
    ['Quick update: beyond happy to announce v2', 'Announcing v2.'],
    ["I have to say I'm excited to announce that I'm joining X", "I'm joining X."],
    ['Wanted to let you know I am thrilled to share our new app', 'I am thrilled to share our new app.'],
    ["Today I'm excited to announce that we raised a seed round", 'Today we raised a seed round.'],
  ]) { const r = S(t); assert.equal(r.state, 'sharp', t); assert.equal(r.line, want, t); assert.doesNotMatch(r.why, /announce our|’m announce|'m announce/, t); }
  /* never "I'm announce…", in any mode, with alts and put-backs */
  for (const t of ["Just wanted to say I'm excited to announce our new app", "So I just wanted to say that I'm thrilled to announce our new course", "I wanted to share that I'm really excited to announce my new job", 'I just wanted to say that I am really excited to announce our new feature', "Today I'm excited to announce our new feature"])
    for (const [m, l] of allVersions(t)) assert.doesNotMatch(l, /\b(?:i['’]m|i am|we['’]re|we are)\s+(?:announce|share|launch|introduce)\b/i, `${m}: ${t} → ${l}`);
});

/* ---------------- 2. slStruct ---------------- */
test('v4.9 slStruct: an auxiliary needs -ing, a participle, an adjective, a noun phrase or a preposition after it', () => {
  for (const l of ["I'm announce our new app.", "We're launch v2.", "She's share it.", 'I’m introduce our new app.', 'We are finally launch our feature.', 'It is release today.', 'I will be announce it soon.'])
    assert.match(struct(l, 'x'), /agreement/, l);
  for (const l of ["I'm going home.", "We're launching v2.", "It's done.", "It's launch day.", "It's live.", "I'm so proud of the team.", "We're open to it.", "It's like a game.", "It's come a long way.", "It's cut in half.", "We're back."])
    assert.equal(struct(l, 'x'), '', l);
  /* I/we/they + an -s verb, past an adverb too; he/she/it + a bare verb */
  for (const l of ['We launches today.', 'We finally launches today.', 'They really needs this.', 'I says it often.', 'It launch today.']) assert.match(struct(l, 'x'), /agreement/, l);
  for (const l of ['We launch today.', 'She launches today.', 'They really need this.', 'It just works.']) assert.equal(struct(l, 'x'), '', l);
  /* counted against the draft: the writer's own "I'm announce" is theirs */
  assert.equal(struct("I'm announce it.", "I'm announce it."), '');
  /* a run-up the cut left without its clause */
  for (const [l, d] of [['Just wanted to say that v2.', 'Just wanted to say that beyond happy to announce v2'], ['Wanted to let you know announce our new app.', 'Wanted to let you know beyond happy to announce our new app'], ['Just wanted to say that proud to introduce our new app.', 'Just wanted to say that really proud to introduce our new app'], ['I have to say v2.', 'I have to say super excited to share v2'], ["I'm here to say our new course.", "I'm here to say beyond happy to announce our new course"], ['I wanted to share that launch v2.', 'I wanted to share that so thrilled to launch v2']])
    assert.match(struct(l, d), /run-up without its clause/, l);
  for (const [l, d] of [['I want to say super excited to share v2.', 'I just want to say super excited to share v2'], ['I wanted to share our new app.', 'I really wanted to share our new app'], ['I want to say thank you.', 'I just want to say thank you'], ['I wanted to say we shipped it.', 'I just wanted to say that we basically shipped it']])
    assert.equal(struct(l, d), '', l);
  /* an infinitive after a feeling made into an order; a "reminder to" was one already */
  assert.match(struct('Launch our new app.', 'So thrilled to launch our new app'), /order/);
  assert.equal(struct('Launching our new app.', 'So thrilled to launch our new app'), '');
  /* a noun phrase and its participle, with no verb of its own */
  assert.match(struct('Our $2.5M pre-seed led by Hustle Fund!', "We're super excited to announce our $2.5M pre-seed led by Hustle Fund!"), /no verb/);
  /* this file's reads say the same */
  assert.deepEqual(agree("I'm announce our new app.", ''), ['aspect']);
  assert.deepEqual(agree('Our new course.', 'Today super excited to share our new course'), ['fragment']);
  assert.deepEqual(agree('I have to say v2.', 'I have to say super excited to share v2'), ['run-up without its clause']);
  assert.deepEqual(agree('Launch our new app.', 'So thrilled to launch our new app'), ['order made']);
  assert.deepEqual(agree("I'm announcing our new app.", "Just wanted to say I'm excited to announce our new app"), []);
});

/* ---------------- 3. the cross-product ---------------- */
const RU = ['Just wanted to say that', 'I wanted to share that', 'So', 'Today', 'Quick update:', 'I just want to say', 'Hey everyone,', 'Ok so', 'Honestly,', "I'm here to say", 'Wanted to let you know', 'I have to say'];
const LEAD = ["I'm", 'I am', "we're", 'we are', 'super', 'so', 'really', 'beyond'], FEEL = ['excited', 'thrilled', 'proud', 'happy'], VERB = ['announce', 'share', 'launch', 'introduce'];
/* the 8 frames: every lead once, every feeling and every verb twice, no feeling-verb pair twice */
const FRAMES = LEAD.map((l, k) => `${l} ${FEEL[k % 4]} to ${VERB[(k + Math.floor(k / 4)) % 4]}`);
const OBJ = ['our new app', 'my new job', 'that we raised a seed round', 'v2', 'our new course', "that I'm joining X"];
const XP = RU.flatMap(r => FRAMES.flatMap(f => OBJ.map(o => { const t = `${r} ${/^I\b|^I'/.test(f) ? f : f[0].toLowerCase() + f.slice(1)} ${o}`; return t[0].toUpperCase() + t.slice(1); })));
test('v4.9 cross-product: 12 run-ups × 8 frames × 6 objects, 0 broken in every mode, at most ~5% kept as written', () => {
  assert.equal(XP.length, 576);
  const bad = [], kept = [];
  for (const t of XP) { const r = S(t); if (r.state !== 'sharp') kept.push(`${t} || ${r.why}`); bad.push(...failsOf(t)); }
  if (bad.length) console.log(bad.join('\n'));
  assert.equal(bad.length, 0, `broken: ${bad.length}`);
  if (kept.length > 29) console.log(kept.join('\n'));
  assert.ok(kept.length <= 29, `kept as written: ${kept.length} of 576`);
  /* what stays is what has nothing else safe to cut: a "share + thing" after a kept "Today" (the page reads "sharing" as a word
     the writer never used), or a draft that launches a that-clause */
  for (const k of kept) assert.match(k, /^Today\b/, k);
  /* the objects: a clause after share/announce leads; a thing named keeps its verb; never a fragment or a bare object */
  for (const t of XP) { const r = S(t); if (r.state !== 'sharp') continue;
    assert.doesNotMatch(r.line, /^(?:Our new (?:app|course)|My new job|V2)[.:!]?$/, t);
    if (/(?:announce|share) that we raised a seed round$/.test(t)) assert.match(r.line, /^(?:Today )?[Ww]e raised a seed round\.$/, t);
    if (/(?:announce|share) that I'm joining X$/.test(t)) assert.match(r.line, /^(?:Today )?I'm joining X\.$/, t); }
  /* the why quotes what the line now says, never a broken opening */
  for (const t of XP) { const r = S(t); if (r.state === 'sharp') assert.doesNotMatch(r.why, /(?:’m|'m|’re|'re| am| are) (?:announce|share|launch|introduce)\b/, t); }
});

/* ---------------- 4. round 12 ---------------- */
test('v4.9 round 12 (founder-1): a topic named after a talk-about or share run-up is the header', () => {
  assert.equal(L("In today's newsletter, I want to talk about the 5 mistakes every new trader makes"), 'The 5 mistakes every new trader makes:');
  assert.equal(L('Let me tell you about the 3 books every founder should read'), 'The 3 books every founder should read:');
  assert.equal(L('In this thread I want to break down the 7 tools I use to write faster'), 'The 7 tools I use to write faster:');
  assert.equal(L('I want to share some thoughts on pricing'), 'Some thoughts on pricing:');
  assert.equal(L('Today I want to talk about the 3 habits that changed my writing'), 'The 3 habits that changed my writing:');
  /* a clause after "say" is a claim, never a header */
  assert.equal(L('I wanted to say the team we hired last year quit'), 'The team we hired last year quit.');
  /* "breaks" only when no header would stand: an unnumbered header with nothing under it is the writer's call, said so */
  for (const t of ['Today I want to talk about the tools I use every day', 'Let me tell you a story about the worst trade I ever made']) { const r = S(t); assert.equal(r.state, 'unsure', t); assert.doesNotMatch(r.why, /breaks/, t); assert.match(r.why, /header with nothing under it/, t); }
  for (const t of ["In today's newsletter, I want to talk about the 5 mistakes every new trader makes", 'I want to share some thoughts on pricing']) for (const [m, l, d] of allVersions(t)) assert.equal(hard(l, d), '', `${m}: ${l}`);
});

test('v4.9 round 12: "Big announcement:" is hype and goes; deadpan labels stay', () => {
  assert.equal(L('Big announcement: we just raised our seed round'), 'We just raised our seed round.');
  assert.equal(L('Huge announcement! We are hiring'), 'We are hiring.');
  assert.equal(L('Big announcement: our new app is live'), 'Our new app is live.');
  assert.match(S('Big announcement: our new app is live').why, /Big announcement|hype|first thing|opens/i);
  assert.equal(S('Update: our new app is live').state, 'clean');
});

test('v4.9 round 12 (uiux-4): one hedge per clause; a "maybe" stacked on "I think" is marked and may go', () => {
  for (const [t, want] of [['i think that maybe we should raise prices', 'i think that we should raise prices.'], ['I think maybe we should raise prices', 'I think we should raise prices.'], ['I feel like maybe we should raise prices', 'I feel like we should raise prices.']]) {
    const r = S(t); assert.equal(r.line, want, t); assert.ok(r.marks.some(m => t.slice(m[0], m[1]) === 'maybe'), t); assert.match(r.why, /second hedge/, t); }
  /* a lone "maybe" is the stance; a call keeps every hedge */
  assert.equal(S('maybe we should raise prices').state, 'clean');
  assert.equal(S('i think maybe btc goes to 100k next week').state, 'clean');
  /* the stacked hedge is marked even where another cut leads */
  assert.ok(S('i think that maybe we just shipped the biggest update of the year to be honest').marks.some(m => m[3] === 'hedge'));
});

test('v4.9 round 12 (uiux-3): no word the draft never had: a round keeps the writer\'s verb, never "We raised"', () => {
  for (const [t, want] of [['Really excited to announce our seed round', 'Announcing our seed round.'], ["We're super excited to announce our $2.5M pre-seed led by Hustle Fund!", "We're announcing our $2.5M pre-seed led by Hustle Fund!"], ["We're thrilled to finally announce our $3M seed round to help small teams ship faster! 🚀", "We're finally announcing our $3M seed round to help small teams ship faster! 🚀"], ['So excited to announce the availability of our app in Europe', 'Announcing the availability of our app in Europe.']]) {
    assert.equal(L(t), want, t);
    for (const [m, l] of allVersions(t)) { assert.doesNotMatch(l, /\braised\b/i, `${m}: ${l}`); assert.doesNotMatch(l, /\bis live\b/i, `${m}: ${l}`); }
  }
});
