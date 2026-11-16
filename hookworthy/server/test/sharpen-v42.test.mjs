/* r86 v4.2: Sharpen after the round-5 set-3 review (hook41-1, 2, 3, 4, 5) and the round-7 page jurors' engine items
   (founder-1, marketing-1/3/4, page pass 8), held as rules. Written apart from the engine's own picks:
   1. hook41-1, P0: the five set-3 breaks come back whole, and each new guard rejects its broken form and passes its clean twin
   2. hook41-2: the default (homepage) mode ships a reshape only when it passes the Claude validator's checks and the page's
      whole-line read; otherwise the strict version. { hybrid: false } is the v4.1 mode
   3. P0 sweep: 100 tempting lines written for this pass, in every mode: no version trips a hard guard or the page guard
   4. hook41-3: receipts. "Already tight" only when nothing is marked; Claude receipts name every removed span of three words or
      more; "Same claim" only when no stance or hedge word changed
   5. hook41-4: the prompt's new rules and examples, every example passing the validator with its own why
   6. hook41-5 and round 7: the run-ups the demo called "Already tight", hard news, colon headers, "I think" as the one hedge
   7. page pass 8: warmSteps are small and leave the output as it was */
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
const HUNT = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-v42-hunt.json'), 'utf8')).lines;

test('v4.2, hook41-1: the five set-3 breaks come back whole, in every mode', () => {
  const cases = [
    /* x-43: the "So" of "So excited" goes with the announce */
    ['So excited to share that The Margin just crossed 25,000 readers this morning! I\'m so grateful for every single one of you.', l => !/^So\b/.test(l) && /^The Margin just crossed 25,000 readers/.test(l) && /I'm so grateful/.test(l)],
    /* x-79: no "proud I'm of", and "really" on the feeling stays */
    ['It\'s honestly hard to put into words how proud I really am of my mom for finishing her first 5K today ❤️', l => !/I['’]m of\b/.test(l) && /how proud I really am of my mom/.test(l)],
    /* x-109: a/an by sound, and the writer's lowercase "citizen" */
    ['I\'m so incredibly happy and proud to share that I\'m officially a U.S. citizen as of this morning! 🇺🇸', l => /\ba U\.S\. citizen\b/.test(l) && !/\ban U\.S/.test(l)],
    /* x-31: "If I had to guess," never becomes "I had to guess?" */
    ['If I had to guess, I\'d say that most early-stage founders largely underestimate how long sales cycles really are.', l => !/^I had to guess\?/.test(l) && /^If I had to guess,/.test(l)],
    /* x-81: no "We're deprecating … and migrate" */
    ['We\'ve decided to deprecate our v1 API and migrate everyone to v2 by the end of March.', l => !/\bdeprecating\b[^.]*\band migrate\b/.test(l)]
  ];
  for (const [t, ok] of cases) for (const [m, o] of MODES) { const r = S(t, o); for (const l of [r.line, ...(r.alts || []).map(a => a.line)]) assert.ok(ok(l), `${m}: ${t} → ${l}`); }
  /* the why quotes the whole opener, not "I'm officially a U.S" */
  assert.match(S('I\'m so incredibly happy and proud to share that I\'m officially a U.S. citizen as of this morning! 🇺🇸').why, /U\.S\. citizen/);
});

test('v4.2, hook41-1: each new guard rejects the broken form and passes its clean twin', () => {
  const cases = [
    ['announce left its "So"', 'So The Margin just crossed 25,000 readers!', 'The Margin just crossed 25,000 readers!', 'So excited to share that The Margin just crossed 25,000 readers!'],
    ['contraction stranded', 'It\'s hard to say how proud I\'m of my mom.', 'It\'s hard to say how proud I am of my mom.', 'It\'s honestly hard to say how proud I really am of my mom.'],
    ['condition made a question', 'I had to guess? I\'d say most founders underestimate sales cycles.', 'If I had to guess, I\'d say most founders underestimate sales cycles.', 'If I had to guess, I\'d say that most founders underestimate sales cycles.'],
    ['article by sound', 'I\'m officially an U.S. citizen.', 'I\'m officially a U.S. citizen.', 'I\'m so happy to share that I\'m officially a U.S. citizen.'],
    ['article by sound', 'We just shipped a MVP.', 'We just shipped an MVP.', 'So excited to share that we just shipped an MVP.'],
    ['verb agreement', 'We\'re deprecating our v1 API and migrate everyone to v2.', 'We\'re deprecating our v1 API and migrating everyone to v2.', 'We\'ve decided to deprecate our v1 API and migrate everyone to v2.'],
    ['frame moved', 'I\'ve decided to end the newsletter. I\'m not really sure how to say this.', 'I\'m not really sure how to say this, but I\'ve decided to end the newsletter.', 'I\'m not really sure how to say this, but I\'ve decided to end the newsletter.'],
    ['fragment', 'The worst trade I ever made.', 'Let me tell you about the worst trade I ever made.', 'Let me tell you about the worst trade I ever made.']
  ];
  for (const [why, bad, good, draft] of cases) {
    assert.equal(hard(bad, draft), why, `${bad} should trip "${why}"`);
    assert.equal(hard(good, draft), '', `${good} should pass`);
  }
  /* the tidy itself: by sound, and the writer's own article and case stay */
  assert.equal(D.writerForm('I\'m officially an U.S. Citizen.', 'so happy to share that I\'m officially a U.S. citizen.'), 'I\'m officially a U.S. citizen.');
  for (const [t, w] of [['I am so proud to share that we are now a SOC 2 company', /\ba SOC 2\b/], ['So excited to share that we\'re an NYC team of 12', /\ban NYC\b/]]) assert.match(L(t), w, t);
  /* a contraction where it reads: "I'm now taking", never "how proud I'm of" */
  assert.match(L('I am really excited to share that I am now taking on 2 new clients for Q3!'), /^I['’]m now taking/);
});

test('v4.2, hook41-2: the default mode re-checks every reshape; v4.1 and strict stay available', () => {
  /* a reshape that passes the second read ships as before */
  assert.equal(L('So in this issue I wanted to talk about why open rates lie'), 'Open rates lie.');
  assert.equal(L("In this week's issue, we're going to look at three charts that explain the housing market."), "This week's issue: three charts that explain the housing market.");
  /* one that the validator would refuse (a plan's "going to be" said as a fact) falls back to the strict answer */
  const t = "I'm going to be hosting a live AMA on Friday and answering every question.";
  assert.equal(L(t, { hybrid: false }), "I'm hosting a live AMA on Friday and answering every question.");
  assert.equal(L(t), L(t, { strict: true }));
  /* the recheck is the bar a Claude line meets */
  assert.equal(D.recheck("I'm hosting a live AMA on Friday and answering every question.", t, t, core.softMarks(t), [], []), false);
  assert.equal(D.whole('We closed our Series A is hiring.', "We closed our Series A and we're hiring."), 'two verbs');
});

test('v4.2, P0 sweep: 100 tempting lines, every mode, no version trips a hard guard or the page guard', () => {
  assert.equal(HUNT.length, 100);
  const bad = [];
  for (const t of HUNT) for (const [m, o] of MODES) { const r = S(t, o); for (const l of versions(r)) { const h = hard(l, r.draft), w = whole(l, r.draft); if (h || w) bad.push(`${m}: ${t} → ${l} (${h || w})`); } }
  assert.deepEqual(bad, []);
  /* and the lines the hunt found broken on first contact stay whole */
  assert.match(L('That\'s exactly who I really am at my core.'), /who I really am/);
  assert.doesNotMatch(L("A lot of people have been asking me which mic I use, so here are the 3 I'd buy again:"), /^Here are the 3/);
  assert.doesNotMatch(L("Here are a few things I've learned from running a newsletter for 3 years."), /^Things\b/);
  assert.doesNotMatch(L('In this post I want to share how I paid off $40k of debt in 18 months.'), /:$/);
  /* v4.3 (round-8 uiux-1): "some thoughts on…" is the pointer itself, so it stays and leads, with the colon the Claude prompt's
     own example gives a one-liner ("Some of my key takeaways from SaaStr last week:") */
  assert.equal(L('I wanted to take a moment to share some thoughts on why consistency matters.'), 'Some thoughts on why consistency matters:');
});

test('v4.2, hook41-3: receipts say only what is true', () => {
  /* "Already tight" only when nothing is marked; the strict answer on a marked line says the words are the writer's call */
  for (const t of HUNT) { const r = S(t); if (/Already tight/.test(r.why)) assert.deepEqual(r.marks, [], t); }
  const st = S('I wanted to share a really interesting chart I came across this week that basically shows how much attention spans have dropped', { strict: true });
  assert.equal(st.state, 'unsure'); assert.equal(st.why, 'This quick check found nothing safe to cut. The marked words are your call.'); /* v4.7: never absolute */ assert.doesNotMatch(st.why, /on-device/i);
  /* the clean line doesn't repeat the receipt's "Nothing to cut" */
  const cl = S('$ETH reclaimed 3k. shorts are trapped.'); assert.equal(cl.say, 'Nothing to cut'); assert.doesNotMatch(cl.why, /Nothing to cut/);
  /* a topic said as the claim is said straight, not "tightened" */
  assert.equal(S('So in this issue I wanted to talk about why open rates lie').say, 'Cut 2 bits of fluff · Said it straight');
  /* Claude's receipt names every removed span of three words or more (x-79) */
  const x79 = 'It\'s honestly hard to put into words how proud I really am of my mom for finishing her first 5K today ❤️';
  const c79 = core.SHARPEN.fromClaude(x79, { versions: [{ line: 'I\'m really proud of my mom for finishing her first 5K today ❤️', why: 'Without “honestly”, “I\'m really proud of my mom” reads like you’ve earned it.' }] });
  assert.ok(c79 && /It's honestly hard to put into words how/.test(c79.why), c79 && c79.why);
  /* a moved clause is not a removed one (x-0's disclaimer moved; it didn't go) */
  const x0 = 'I honestly think altcoins mostly bleed against $BTC in a bear market, but I could be totally wrong here.';
  const c0 = core.SHARPEN.fromClaude(x0, { versions: [{ line: 'I could be totally wrong, but I think altcoins mostly bleed against $BTC in a bear market.', why: '“honestly” went and the disclaimer moved up front.' }] });
  assert.ok(c0 && !/could be totally wrong.*went/.test(c0.why), c0 && c0.why);
  /* "Same claim" only when no stance or hedge word changed (x-82); and a dropped "I don't really think" is refused (hook41-4) */
  const x82 = "I don't really think you need TypeScript for a 200-line script, but I'm open to being convinced.";
  const tr = {}; const c82 = core.SHARPEN.fromClaude(x82, { versions: [{ line: "You don't need TypeScript for a 200-line script, but I'm open to being convinced.", why: 'Same claim, 3 words lighter.' }] }, { trace: tr });
  assert.equal(c82, null); assert.match(String(tr.reject || (tr.rejects || [])[0]), /stance "I don't think" lost/);
  assert.equal(core.SHARPEN.fromClaude('I don\'t think you need a CRM, honestly.', { versions: [{ line: 'You don\'t need a CRM.', why: 'x' }] }), null);
});

test('v4.2, hook41-4: the prompt keeps the doubt in place, "I don\'t really think", deadpan frames, and the light edit first', () => {
  const P = core.prompts.sharpen({ text: 'x' }), C = P.cached;
  assert.equal(typeof C, 'string'); assert.ok(!C.includes('<line>\nx\n</line>'), 'the cached instructions hold no draft');
  assert.match(C, /\\"Not to be dramatic, but\\"|"Not to be dramatic, but"/);
  assert.match(C, /deadpan frame is part of a sharp line/);
  assert.match(C, /the light edit is version 1 and the doubt stays where they put it/);
  for (const l of ['Honestly I think most cold emails die in the subject line, though I could easily be wrong about that', "Honestly I don't really think you need a CRM before your first 10 customers", 'Announcing something: we shipped dark mode and nobody noticed.']) assert.ok(C.includes(`<line>${l}</line>`), l);
  /* every example passes the validator with its own why, version by version */
  const ex = [...C.matchAll(/<line>([\s\S]*?)<\/line>\n(\{[\s\S]*?\})\n<\/example>/g)];
  assert.ok(ex.length >= 19);
  for (const [, line, js] of ex) { const d = JSON.parse(js); d.versions.forEach((v, i) => { const r = core.SHARPEN.fromClaude(line, { versions: [v], unchanged: d.unchanged && i === 0 }); assert.ok(r, `${line} v${i + 1} rejected`); assert.equal(r.why, v.why, `${line} v${i + 1}`); }); }
  /* "my honest take on why" is not a "Hot take:" frame: the version that leads with "Why…" passes */
  const x6 = "Here's my honest take on why I think funding rates are often a pretty terrible timing signal:";
  const c6 = core.SHARPEN.fromClaude(x6, { versions: [{ line: "Here's why I think funding rates are often a pretty terrible timing signal:", why: '“my honest take on” went.' }] });
  assert.ok(c6 && c6.state === 'sharp');
});

test('v4.2, hook41-5 and round 7: the run-ups the demo called "Already tight"', () => {
  const cases = [
    ["Here's my honest take on why I think funding rates are often a pretty terrible timing signal:", 'Why I think funding rates are often a pretty terrible timing signal:'],
    ["Can I share something that might be a little unpopular? I don't really believe in posting every single day.", "I don't really believe in posting every single day."],
    ["I think it's worth noting that BTC just broke 100k", 'BTC just broke 100k.'],
    ["It's worth noting that most newsletters die before issue 10", 'Most newsletters die before issue 10.'],
    ['I wanted to write a post about something that has been on my mind lately: burnout', 'Something that has been on my mind lately: burnout.'],
    ["I've been meaning to write about this for a while, but here's how I grew to 50k followers", "Here's how I grew to 50k followers."],
    ["A lot of people have been asking me how I trade, so here's my process", "Here's how I trade."],
    ['Just a quick thread 🧵 on how I turned $2k into $40k (1/7)', 'How I turned $2k into $40k (1/7)'],
    ['In this thread I will explain how I grew my newsletter to 10k', "I grew my newsletter to 10k. Here's how:"], /* v4.5: a draft with no apostrophe gets a straight one */
    ['Just a thought, but maybe we should stop chasing every narrative', 'Maybe we should stop chasing every narrative.'],
    ['With that being said, most founders should write every day.', 'Most founders should write every day.'],
    ["As many of you know, I've been building in public for 2 years.", "I've been building in public for 2 years."],
    ['gm everyone, just wanted to say we shipped dark mode today', 'gm everyone, we shipped dark mode today.']
  ];
  for (const [t, want] of cases) assert.equal(L(t), want, t);
  /* a line the demo can't cut safely is marked, never "Already tight" */
  for (const t of ['Let me tell you about the worst trade I ever made', 'I really, really think most founders should write every day', "I've been thinking a lot lately about how important it is to ship fast"]) {
    const r = S(t); assert.notEqual(r.state, 'clean', t); assert.ok(r.marks.length, t); assert.doesNotMatch(r.why, /Already tight/, t);
  }
});

test('v4.2, hook41-5: on hard news the framing stays word for word and the line is never split, in every mode', () => {
  const cases = [
    ['This is really hard to write, but my mom was diagnosed with stage 3 breast cancer last week.', 'This is really hard to write, but'],
    ['I don\'t usually talk about this kind of thing online, but after losing my brother to suicide two years ago, I\'ve realized that the people who seem the most okay are often the ones who are really struggling the most, so please, if you have someone in your life who\'s been quiet lately, reach out to them today and just ask how they\'re really doing.', 'I don\'t usually talk about this kind of thing online, but'],
    ['So this is a little bit personal, but I wanted to share that I was laid off today after 6 years at the company.', 'This is a little bit personal, but'],
    ['I\'m not really sure how to say this, but I\'ve decided to end the newsletter after 4 years and 212 issues.', 'I\'m not really sure how to say this, but'],
    ['Some personal news that\'s really hard to share: I\'m stepping down as CEO of the company I founded.', 'Some personal news that\'s really hard to share:'],
    ['I don\'t usually post personal stuff, but my wife and I have decided to separate.', 'I don\'t usually post personal stuff, but']
  ];
  const n = z => z.replace(/[’]/g, "'");
  for (const [t, frame] of cases) for (const [m, o] of MODES) { const r = S(t, o); for (const l of [r.line, ...(r.alts || []).map(a => a.line)]) { assert.ok(n(l).startsWith(n(frame)), `${m}: ${t} → ${l}`); assert.equal((l.match(/[.!?](?=\s|$)/g) || []).length <= (t.match(/[.!?](?=\s|$)/g) || []).length || /[.!?]$/.test(l) && !/[.!?]$/.test(t), true, `${m}: split ${l}`); } }
  assert.match(S(cases[0][0]).why, /your framing is how you chose to tell it/);
  /* soft words after the framing may still go */
  assert.doesNotMatch(L(cases[1][0]), /\bjust ask\b/);
  /* news that isn't hard is cut as before */
  assert.equal(L('So excited to share that I got promoted to staff engineer today!'), 'I got promoted to staff engineer today!');
});

test('v4.2, round 7: no dangling header, no object left alone, "I think" kept as the one hedge', () => {
  /* a one-line draft cut down to a header that promises what nobody wrote is kept and marked (marketing-3) */
  for (const t of ["I've been thinking a lot lately about how important it is to ship fast", 'Today I want to share some lessons I learned from failing my first startup', 'I want to share something personal that I haven\'t told anyone yet']) assert.doesNotMatch(L(t), /:$/, t);
  /* with a thread pointer, a counted list or a body under it, a header is the format */
  assert.equal(L('In this week\'s edition I\'m going to break down the pricing pages of 10 SaaS companies'), 'The pricing pages of 10 SaaS companies:');
  assert.match(L('In this thread I will explain why I sold all my ETH'), /^(?:Thread: why I sold all my ETH|I sold all my ETH\. Here's why:)/);
  assert.equal(L('some thoughts on why most threads flop\nthe first line is a warm-up. the second line is where the post starts.'), "most threads flop. here's why:"); /* v4.5: the writer's (straight) apostrophe */
  /* the object of a cut run-up is never a sentence of its own */
  for (const t of ['Let me tell you about the worst trade I ever made', 'I want to talk about something that nobody in crypto wants to admit']) assert.equal(L(t), t, t);
  /* "I think" heading a claim is the clause's one hedge, kept every time; the second hedge goes (marketing-4) */
  assert.equal(L('i think this is probably the most important chart in crypto right now'), 'i think this is the most important chart in crypto right now.');
  assert.doesNotMatch(S('i think this is probably the most important chart in crypto right now').why, /i think/i);
  assert.match(S('I think one of the most underrated skills for a founder is writing').why, /^Kept “I think”: it’s how sure you are/);
  assert.equal(L('I think most founders probably overthink their pitch decks.'), 'I think most founders overthink their pitch decks.');
  assert.match(L('honestly i think SOL is going to flip ETH this cycle, not financial advice'), /^i think SOL/);
  /* "I really don't think" is a negated stance, kept (it was read as "I don't think" only after "don't") */
  assert.equal(L("Honestly, I really don't think 'personal branding' is the right goal for most B2B founders."), "I don't think 'personal branding' is the right goal for most B2B founders.");
  /* "really" on a negated feeling stays (x-54) */
  assert.equal(S("I really don't care about open rates anymore. Replies pay the bills.").state, 'clean');
});

test('v4.2, page pass 8: warmSteps are small pieces and leave the output as it was', () => {
  const steps = core.SHARPEN.warmSteps();
  assert.ok(Array.isArray(steps) && steps.length > 100);
  const T = HUNT.slice(0, 30), before = T.map(t => JSON.stringify(S(t)));
  steps.forEach(f => f());
  assert.deepEqual(T.map(t => JSON.stringify(S(t))), before);
  assert.equal(typeof core.SHARPEN.warm({ sync: true }), 'number');
});
