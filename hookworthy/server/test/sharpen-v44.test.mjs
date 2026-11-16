/* r86 v4.4: the on-device Sharpen after blind set 5 (review-hook-v43: hook43-1 to hook43-4, on-device).
   1. hook43-1: the two break shapes, as classes, in every mode. A word the writer kept lowercase after an ellipsis stays
      lowercase ("it's... not great", z-6), and a cut between a joining word and a comma takes the comma ("now and if I'm
      being honest, the thing" → "now and the thing", z-35). The hard guards reject the classes, whatever made them.
   2. hook43-2: a deadpan label on a body of several whole sentences is kept ("Life update:", z-118); "like" before a number
      is the writer's "about", never cut (z-80)
   3. hook43-3: a put-back label brings back the word that joined it to the rest ("Just a quick tip for founders:", z-58)
   4. coverage (z-54, z-72, z-107) and long run-ons in beats (z-35); receipts: beats are sentences, a word cut twice is
      named once
   5. the 60-line v4.4 hunt (ellipses, em-dashes, "and/so/but" next to commas, trailing tags, lowercase run-ons), in every
      mode, against the hard guards, the page guard and this file's own break checks */
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
const HUNT = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-v44-hunt.json'), 'utf8')).lines;
const HUNT43 = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-v43-hunt.json'), 'utf8')).lines;

/* this file's own reads of the break shapes, written apart from the engine's guards */
const lc = z => String(z).toLowerCase().replace(/[’‘]/g, "'");
function broken(line, draft) {
  const l = String(line), d = String(draft), out = [];
  /* a capital after an ellipsis the draft followed with a lowercase word */
  for (const m of l.matchAll(/([A-Za-z0-9'’$%]+)(?:\.\.\.|…|[.!?])\s+([A-Z][a-z’']*)/g)) if (m[2] !== 'I' && !/^I['’]/.test(m[2]) && new RegExp(`\\b${lc(m[1]).replace(/[$]/g, '\\$')}(?:\\.\\.\\.|…)\\s+(?:\\S+\\s+){0,3}${lc(m[2])}\\b`).test(lc(d)) && !new RegExp(`(?:\\.\\.\\.|…)\\s+${m[2]}\\b`).test(d)) out.push('capital after a mid-sentence ellipsis');
  /* a joining word left before a comma, with another next word than the draft's */
  for (const m of lc(l).matchAll(/\b(and|but|or|so|because|if|that|the|a|to|of|think|is|was)\s*,\s*([a-z0-9$@#'][a-z0-9'$-]*)/g)) if (!(m[1] === 'so' && m.index === 0) && !lc(d).includes(`${m[1]}, ${m[2]}`)) out.push(`"${m[1]}," before "${m[2]}"`);
  /* a dash at the start, before a stop or at the end; doubled punctuation */
  if (/^\W*[—–]|[—–]\s*[.!?:]|[—–]\s*$/.test(l) && !/^\W*[—–]|[—–]\s*[.!?:]|[—–]\s*$/.test(d)) out.push('stray dash');
  if (/(?<!\.)\.\.(?!\.)|[,;:][.!?]|[.!?][,;:]|,,|\.!|!\./.test(l) && !/(?<!\.)\.\.(?!\.)|[,;:][.!?]|[.!?][,;:]|,,|\.!|!\./.test(d)) out.push('doubled punctuation');
  /* a sentence that ends on an article, a joining word or a "be" contraction */
  if ([...l.matchAll(/\b(?:a|an|the|and|but|or|my|your|our|their|it's|it’s|that's|i'm|i’m)\s*[.!?]+(?=\s+[A-Z]|\s*$)/gi)].length > [...d.matchAll(/\b(?:a|an|the|and|but|or|my|your|our|their|it's|it’s|that's|i'm|i’m)\s*[.!?]+(?=\s+[A-Z]|\s*$)/gi)].length) out.push('sentence ends on a dangling word');
  /* every number stays, and so does a "like" in front of one */
  for (const n of d.match(/\$?\d[\d,.]*[kKmM%x]?/g) || []) if (!l.includes(n.replace(/[.,]$/, ''))) out.push(`lost ${n}`);
  for (const m of lc(d).matchAll(/\blike (\$?\d[\d,.]*|a (?:year|month|week|day)|two|three|five|ten)\b/g)) if (!lc(l).includes(m[0])) out.push(`lost "${m[0]}"`);
  return out;
}

test('v4.4, hook43-1: a word the writer kept lowercase after an ellipsis stays lowercase, in every mode', () => {
  const z6 = "So I finally sat down and calculated my total trading P&L for the year and it's... not great.";
  for (const [m, o] of MODES) assert.equal(L(z6, o), "I finally sat down and calculated my total trading P&L for the year and it's... not great.", m);
  assert.match(S(z6).why, /opens on what you came to say/);
  for (const [m, o] of MODES) {
    assert.equal(L("Well it's... just not great honestly.", o), "It's... just not great.", m);
    assert.equal(L('So basically I tried… honestly it was a mess.', o), 'I tried… it was a mess.', m);
    assert.equal(L('honestly I thought the launch would flop... it didn\'t.', o), "I thought the launch would flop... it didn't.", m);
  }
  /* the writer's own capital after an ellipsis is theirs too */
  assert.equal(L('So wait for it... The market crashed.'), 'Wait for it... The market crashed.');
  /* the guard reads the class: the ellipsis made a stop, or a sentence left ending on "it's" */
  assert.equal(hard("I finally sat down and calculated my total trading P&L for the year and it's... Not great.", z6), 'ellipsis made a stop');
  assert.equal(hard("I finally sat down and calculated my total trading P&L for the year and it's. Not great.", z6), 'ellipsis made a stop');
  assert.equal(hard("it's... Just not great.", "Well it's... just not great honestly."), 'ellipsis made a stop');
  assert.equal(hard('I tried and the. Result was bad.', 'I tried and the result was bad.'), 'dangling fragment');
  assert.equal(hard('Wait... it gets better. It was fine.', 'Wait... it gets better and it was fine'), '');
  assert.equal(hard('I asked 400 readers what they want more of. The answer surprised me.', 'So I asked 400 readers what they want more of and the answer surprised me'), '');
});

test('v4.4, hook43-1: a cut between a joining word and a comma takes the comma, in every mode', () => {
  const z35 = "I've been building this company for almost four years now and if I'm being honest, the thing that I wish someone had told me at the very beginning is that you will never feel ready.";
  for (const [m, o] of MODES) { const l = L(z35, o); assert.doesNotMatch(l, /\band,/, m); assert.match(l, /four years now(?: and|\.) the thing|four years now\. The thing/i, m); }
  for (const [m, o] of MODES) {
    assert.equal(L('we shipped it and to be honest, it went fine', o), 'we shipped it and it went fine.', m);
    assert.equal(L('we shipped it but, honestly, it went fine', o), 'we shipped it but it went fine.', m);
    assert.equal(L('I think, honestly, the market is cooked.', o), 'I think the market is cooked.', m);
    assert.equal(L('we shipped it, and honestly, it went fine', o), 'we shipped it, and it went fine.', m);
    assert.equal(L('I read 40 books this year and tbh, only 5 of them were worth it.', o), 'I read 40 books this year and only 5 of them were worth it.', m);
  }
  assert.equal(hard("I've been building this for four years now and, the thing is nobody is ready.", "I've been building this for four years now and if I'm being honest, the thing is nobody is ready."), 'joining word before a comma');
  assert.equal(hard('we shipped it but, it went fine.', 'we shipped it but, honestly, it went fine'), 'joining word before a comma');
  assert.equal(hard('I think, the market is cooked.', 'I think, honestly, the market is cooked.'), 'joining word before a comma');
  /* a line-initial "So," is the writer's, and a clause's own comma stays */
  assert.equal(hard('So, the plan is to ship.', 'So, basically, the plan is to ship.'), '');
  assert.equal(hard('We shipped it, and it went fine.', 'We shipped it, honestly, and it went fine.'), '');
});

test('v4.4, hook43-2: a deadpan label on several whole sentences stays; "like" before a number is never cut', () => {
  const z118 = 'Life update: I own a sourdough starter now. It has a name. It has opinions.';
  for (const [m, o] of MODES) { const r = S(z118, o); assert.equal(r.state, 'clean', m); assert.equal(r.line, z118, m); }
  assert.equal(S(z118).why, 'Your frame sets it up.');
  for (const t of ['PSA: back up your seed phrase. Then back it up again. Then check it.', 'Update: we shipped. Finally. Feels good.']) assert.equal(S(t).line, t, t);
  /* the label stays when other soft words go */
  assert.equal(L('Life update: I honestly own a sourdough starter now. It has a name. It has opinions.'), z118);
  const z80 = "I think I've finally found the perfect setup for my home office after like 3 years of trying different things.";
  for (const [m, o] of MODES) assert.equal(L(z80, o), z80, m);
  assert.equal(S(z80).note, 'Kept “like 3 years”: it says about, not exactly.');
  assert.deepEqual(core.softMarks(z80), []);
  for (const [t, keepW] of [['so i think i finally figured out why i couldn’t lose weight for like 5 years', 'like 5 years'], ['TIL that you can actually set up a custom domain for your Substack in like 5 minutes', 'like 5 minutes'], ['it took me like a year to get my first client honestly', 'like a year'], ['ok but why does every productivity app basically turn into a second job after like a week', 'like a week']]) {
    for (const [m, o] of MODES) { const r = S(t, o); assert.ok(r.line.includes(keepW), `${m}: ${t} → ${r.line}`); assert.ok(!r.cut.some(c => /^like$/i.test(c.text)), `${m}: ${t}`); }
  }
});

test('v4.4, hook43-3: a put-back label brings back the word that joined it', () => {
  const z58 = 'Just a quick tip for founders: you really don\'t need to post every day to build a strong presence on LinkedIn.';
  assert.equal(L(z58), "Founders: you don't need to post every day to build a strong presence on LinkedIn.");
  for (const [m, o] of MODES) assert.equal(L(z58, { ...o, keep: ['Just a quick tip'] }), "Just a quick tip for founders: you don't need to post every day to build a strong presence on LinkedIn.", m);
  assert.match(S(z58, { keep: ['Just a quick tip'] }).why, /^You kept “Just a quick tip”/);
  for (const [m, o] of MODES) {
    assert.equal(L('Just a quick reminder that you should really be sleeping more.', { ...o, keep: ['Just a quick reminder'] }), 'Just a quick reminder that you should be sleeping more.', m);
    assert.equal(L('Quick tip for new traders: you should honestly never risk more than 1% per trade.', { ...o, keep: ['Quick tip'] }), 'Quick tip for new traders: you should never risk more than 1% per trade.', m);
    assert.equal(L('Friendly reminder to drink some water today honestly.', { ...o, keep: ['Friendly reminder'] }), 'Friendly reminder to drink some water today.', m);
  }
});

test('v4.4: coverage (z-54, z-72, z-107), long run-ons in beats, and true receipts', () => {
  assert.equal(L("As a ghostwriter, one of the most common things I hear from founders is that they just don't have the time to post."), "As a ghostwriter, one of the most common things I hear from founders: they just don't have the time to post.");
  assert.equal(L('One of the biggest mistakes I made is that I hired too fast.'), 'One of the biggest mistakes I made: I hired too fast.');
  const z72 = "If you're just starting out at the gym, my honest advice would be to just focus on showing up 3 times a week.";
  for (const [m, o] of MODES) assert.equal(L(z72, o), "If you're just starting out at the gym, just focus on showing up 3 times a week.", m);
  assert.equal(S('My advice is simple: start small.').line, 'My advice is simple: start small.');
  assert.equal(L("I don't usually post stuff like this but I just wanted to say how grateful I am for my friends this year."), "I don't usually post stuff like this. But I'm so grateful for my friends this year.");
  /* v4.8 (round-11 uiux-1): the announcement grammar then takes the feeling too, and the writer's own verb leads; the draft has no
     apostrophe, so the page's ’ (brand-4) */
  assert.equal(L('We just wanted to let you know how excited we are to finally launch this.'), 'We’re finally launching this.');
  assert.equal(hard('Excited we are to finally launch this.', 'We just wanted to let you know how excited we are to finally launch this.'), 'exclamation lost its how');
  /* a line over 280 is said in beats where it can be */
  const z35 = "I've been building this company for almost four years now and if I'm being honest, the thing that I wish someone had told me at the very beginning is that you will basically never feel ready for any of the big moments, whether that's hiring your first employee, raising your first round, or firing someone who you really like, and that's completely okay because nobody actually does.";
  assert.equal(L(z35), "I've been building this company for almost four years now. The thing that I wish someone had told me at the beginning is that you'll basically never feel ready for any of the big moments, whether that's hiring your first employee, raising your first round, or firing someone who you really like. That's okay because nobody actually does.");
  /* a list of clauses is still a list: no full stop before its last item */
  assert.doesNotMatch(L("I believe that most retail traders are just gambling, because they don't have a plan. They don't size their positions properly, they don't use stop losses, and they chase whatever coin is pumping on their timeline that day, which is exactly why 90% of them lose money."), /stop losses\. They/);
  assert.equal(L('My mom, my dad, and I honestly went to the beach every summer for ten years.'), 'My mom, my dad, and I went to the beach every summer for ten years.');
  /* receipts: an ellipsis mid-sentence ends no beat; a word cut twice is named once */
  assert.equal(S('Spent 6 hours on this landing page and the conversion rate is... 0.4%').say, 'Split it into two beats');
  /* v4.5 (hook44-3): "really overthink" now keeps its degree, so the word cut twice is read on two adjectives */
  assert.equal(S('I think the best designers make really simple things with really boring tools.').why, '“really” (twice) were talk, not the point. The line says the same without them.');
});

test('v4.4: the 60-line hunt, every mode: no hard guard, no page guard, none of this file\'s break shapes', () => {
  assert.equal(HUNT.length, 60);
  /* this file's checks see the shapes v4.3 made (z-6, z-35 and the hunt's first contact) */
  for (const [l, d] of [
    ["I finally sat down and calculated my total trading P&L for the year and it's... Not great.", "So I finally sat down and calculated my total trading P&L for the year and it's... not great."],
    ["I've been building this company for almost four years now and, the thing that I wish someone had told me", "I've been building this company for almost four years now and if I'm being honest, the thing that I wish someone had told me"],
    ['we shipped it but, it went fine.', 'we shipped it but, honestly, it went fine'],
    ['— most people never actually ship.', "Here's the thing — most people never actually ship."],
    ["I've been lifting for 3 years —. The hardest part is still just showing up.", "I've been lifting for 3 years — and honestly the hardest part is still just showing up."],
    ["I think I've finally found the perfect setup for my home office after 3 years of trying different things.", "I think I've finally found the perfect setup for my home office after like 3 years of trying different things."],
  ]) assert.ok(broken(l, d).length, l);
  const bad = [];
  for (const t of HUNT) for (const [m, o] of MODES) { const r = S(t, o); for (const l of versions(r)) { const h = hard(l, r.draft), w = whole(l, r.draft), b = broken(l, r.draft); if (h || w || b.length) bad.push(`${m}: ${t} → ${l} (${h || w || b.join(', ')})`); } }
  assert.deepEqual(bad, []);
  /* and the v4.3 hunt still reads clean to this file's checks */
  for (const t of HUNT43) for (const [m, o] of MODES) { const r = S(t, o); for (const l of versions(r)) { const b = broken(l, r.draft); if (b.length) bad.push(`v4.3 hunt, ${m}: ${t} → ${l} (${b.join(', ')})`); } }
  assert.deepEqual(bad, []);
  /* the first-contact breaks the hunt found, each caught by a hard guard */
  for (const [l, d, why] of [
    ['Signups doubled. What changed: I rewrote the whole onboarding flow —.', 'So I basically rewrote the whole onboarding flow — and signups doubled.', 'stray dash'],
    ['— most people never actually ship.', "Here's the thing — most people never actually ship.", 'stray dash'],
    ["I've been lifting for 3 years —. The hardest part is still just showing up.", "I've been lifting for 3 years — and honestly the hardest part is still just showing up.", 'stray dash'],
    ["i've been building for 2 years. haven't made a dollar.", "just realized i've been building for 2 years and haven't made a dollar", 'split lost its subject'],
    ['Real productivity hack? Coffee is great and all but sleep.', 'Coffee is great and all but, frankly, sleep is the real productivity hack.', 'clause cut short'],
  ]) assert.equal(hard(l, d), why, l);
  /* and the fixed lines */
  assert.equal(L("Here's the thing — most people never actually ship."), 'Most people never actually ship.');
  assert.equal(L('Just a heads up — the $SOL unlock is next week.'), 'The $SOL unlock is next week.');
  assert.equal(L('Coffee is great and all but, frankly, sleep is the real productivity hack.'), 'Coffee is great and all. But sleep is the real productivity hack.');
});
