/* r86 pass 3: what the jury found on lines nobody tuned on, held as rules over every held-out line (fixtures/
   sharpen-heldout.json: the first juror's set, the second juror's 159 and the engine rounds) plus the exact cases the
   founder, marketing, web and UI/UX jurors reported. Written apart from the engine's own guards:
   1. the receipt counts exactly what is struck, and nothing struck is a moved word
   2. a why that names cuts names all of them, as cut, and quotes a phrase, never a fragment that ends on a small word
   3. no cut leaves a clause without its verb ("It with you all"), a stray colon, or a broken comparison
   4. links, @handles, #tags and $tickers are atoms: never marked, cut or split, and a line that opens on one keeps it first
   5. Kept lists only the writer's own facts; a put-back restores only that word; thin is only gibberish */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const core = createRequire(import.meta.url)('../../core.js');
const { rows } = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-heldout.json'), 'utf8'));
const S = t => core.sharpenLine(t);
const runs = rows.map(r => ({ t: r.t, R: S(r.t) }));
const label = x => `${JSON.stringify(x.t.split('\n')[0])} → ${JSON.stringify(x.R.line)}`;
const SMALL = /^(?:a|an|the|to|of|for|from|in|on|at|by|with|and|or|but|my|our|your|their|his|her|its|is|are|was|were|has|have|had|just|not|that|this|as)$/i;
const quotes = w => [...String(w).matchAll(/“([^”]+)”/g)].map(m => m[1]);

test('truth: the receipt counts exactly the struck spans, and nothing struck is a moved word', () => {
  const bad = [];
  for (const x of runs.filter(r => r.R.state === 'sharp')) {
    const R = x.R, n = +((R.say.match(/^Cut (\d+) bits? of fluff/) || [])[1] || 0);
    if (n !== R.cut.length) bad.push(`${label(x)}: says ${n}, strikes ${R.cut.length}`);
    if (R.cut.some(c => /^(?:move|tight|swap)$/.test(c.kind))) bad.push(`${label(x)}: a moved or swapped word is struck`);
    if (/bit of fluff/.test(R.say) !== (R.cut.length === 1)) bad.push(`${label(x)}: singular/plural`);
  }
  assert.deepEqual(bad, []);
});

test('truth: a why that names cuts names every one of them, and quotes are phrases', () => {
  const bad = [];
  for (const x of runs.filter(r => r.R.state === 'sharp')) {
    const R = x.R, cuts = R.cut.map(c => c.text.replace(/[,:;.!—-]+$/, '')), q = quotes(R.why);
    const named = q.filter(s => cuts.includes(s));
    if (named.length && named.length !== cuts.length) bad.push(`${label(x)}: why names ${named.length} of ${cuts.length} cuts`);
    if (q.some(s => cuts.some(c => c !== s && c.startsWith(s) && !s.includes(' '))) && !named.length) bad.push(`${label(x)}: a cut quoted cut short`);
    /* the line's own words: never a quote that ends on a small word ("thank you to", "most traders blow" is fine, "Our newsletter just" is not) */
    q.filter(s => !cuts.includes(s)).forEach(s => { const last = s.split(/\s+/).pop(); if (s.split(/\s+/).length > 1 && SMALL.test(last) && last !== 'A') bad.push(`${label(x)}: quote ends on "${last}"`); });
    if (/your point/.test(R.why) && /^It now opens on/.test(R.why) && q[0] && q[0].split(/\s+/).length < 3) bad.push(`${label(x)}: a fragment called your point`);
    if (R.why.length > 140) bad.push(`${label(x)}: why over 140`);
  }
  assert.deepEqual(bad, []);
});

test('truth: no cut leaves an orphan, a stray colon or a broken comparison (founder-1, web-15)', () => {
  const lines = [
    'Just shipped v2 of our app! Really excited to share it with you all 🚀', 'Really excited to share our new feature with you all.',
    'Excited to share it with everyone: we hit 1,000 users.', 'So excited to share this with you guys, our first hire starts monday.',
    'Just launched my course! So excited to finally share it with you.', "I'm excited to share with you all that we're hiring our first engineer",
    'Today I want to talk about something important: burnout', 'So I think we finally figured out pricing after like 6 months of testing',
    'So basically I wanted to share a quick story about how we went from zero to 10,000 paying customers in about eighteen months without raising any money, without running any ads, and without a single person on the team who had ever done marketing before, and honestly it still surprises me',
    'Thank you all for the kind words, it genuinely means more than I can say here', 'honestly this was better than I ever expected it to be',
    'New blog post: how we cut our cloud bill in half → blog.tinyapi.dev/cloud-bill', 'ok hear me out: what if we just stopped scheduling meetings on fridays'];
  const bad = [];
  for (const t of lines) {
    const R = S(t), all = [R.line, ...R.alts.map(a => a.line)];
    for (const l of all) {
      if (/(?:^|[.!?]\s+)(?:it|this|that|these|those|them)\s+(?:with|to|for|about)\b/i.test(l)) bad.push(`${t} → ${l}: orphaned object`);
      if (/^(?:our|my|the|a)\s[^.!?]{0,40}\s+with\s+(?:you|everyone)\b/i.test(l)) bad.push(`${t} → ${l}: orphaned object`);
      if (/:[^.!?:]*:\s*$/.test(l) || /(?:https?:\/\/|\.\w{2,4}\/)\S*:$/.test(l) || /[!?]\.$/.test(l)) bad.push(`${t} → ${l}: stray punctuation`);
      if (/\bthan\s+(?:here|there|this|that)[.!]?$/i.test(l)) bad.push(`${t} → ${l}: broken comparison`);
      if (/^Pricing after/i.test(l) || /^Lesson: pricing\b/i.test(l)) bad.push(`${t} → ${l}: the main clause is gone`);
      if (/^what if\b/i.test(l) && !/\?$/.test(l)) bad.push(`${t} → ${l}: a question lost its question mark`);
    }
  }
  assert.deepEqual(bad, []);
  assert.equal(S('Just shipped v2 of our app! Really excited to share it with you all 🚀').line, 'Just shipped v2 of our app! 🚀');
  assert.equal(S('Excited to share it with everyone: we hit 1,000 users.').line, 'We hit 1,000 users.');
  assert.equal(S("I'm excited to share with you all that we're hiring our first engineer").line, "We're hiring our first engineer.");
  assert.match(S('Thank you all for the kind words, it genuinely means more than I can say here').line, /more than I can say here/);
});

test('truth: links, handles, tags and tickers are atoms (never marked, cut or split), and an opening atom stays first', () => {
  const lines = ['check out hookworthy.app/blog/really-just-honestly, it is basically the best guide',
    'read this https://example.com/basically-honestly-really honestly it changed how i write',
    'shoutout to @really_just_basically, honestly the best trader i follow', 'i think #justdoit is basically the best tagline ever',
    'honestly $REAL is basically the only chart i watch', 'so basically www.actually-just.io/really is down again',
    '@justin_really is basically the best trader', '#buildinpublic honestly the hardest part is just showing up every day', '$ETH is honestly looking really strong here imo'];
  const ATOM = /(?:https?:\/\/|www\.)\S+|(?<![\w.@/-])(?:[a-z0-9-]+\.)+(?:com|io|xyz|co|ai|app|dev)(?:\/\S*)?|(?<![\w])[@#][\w]+|\$[A-Za-z][A-Za-z0-9]*/gi;
  const bad = [];
  for (const t of lines) {
    const R = S(t), atoms = (t.match(ATOM) || []).map(a => a.replace(/[.,;:!?]+$/, ''));
    atoms.forEach(a => { if (!R.line.includes(a)) bad.push(`${t}: lost or split ${a}`); });
    for (const m of R.marks) for (const a of atoms) { const i = t.indexOf(a); if (m[0] < i + a.length && m[1] > i) bad.push(`${t}: marked inside ${a}`); }
    R.cut.forEach(c => atoms.forEach(a => { const i = t.indexOf(a); if (c.at[0] < i + a.length && c.at[1] > i) bad.push(`${t}: cut inside ${a}`); }));
    R.kept.forEach(k => atoms.forEach(a => { if (a.includes(k) && a !== k && !/^[@#$]/.test(k)) bad.push(`${t}: kept "${k}" from inside ${a}`); }));
    const lead = (t.match(/^([@#]\w+|\$[A-Za-z]\w*)/) || [])[1]; if (lead && R.state === 'sharp' && !R.line.startsWith(lead)) bad.push(`${t}: ${lead} is no longer first`);
  }
  assert.deepEqual(bad, []);
  assert.equal(S('@justin_really is basically the best trader').line, '@justin_really is the best trader.');
});

test('truth: the first word keeps the first line\'s case, whatever the body does', () => {
  assert.match(S('so basically i quit my job today\nIt was the hardest call I ever made. Here is why.').line, /^i quit/);
  assert.match(S('So basically I quit my job today\nit was the hardest call i ever made. here is why.').line, /^I quit/);
  assert.match(S("Here's how I basically cut our AWS bill from $14k/month to $3.2k/month:\n1. reserved instances").line, /^Here/);
});

test('truth: Kept lists the writer\'s own facts only (marketing-2, addendum e)', () => {
  const K = t => S(t).kept;
  assert.deepEqual(K('CPI comes out tomorrow and honestly i think the market is not ready'), []);
  assert.ok(!K('I think the ETF flows are really the only thing that matters for BTC right now').includes('ETF'));
  assert.ok(!K('Unpopular opinion but I think B2B SaaS founders should stop posting memes').some(k => /^(?:B2B|SaaS)$/.test(k)));
  assert.ok(!K('just wanted to quickly share how i went from 0 to 5k followers in 90 days').includes('0'));
  assert.ok(K('just wanted to quickly share how i went from 0 to 5k followers in 90 days').includes('5k followers'));
  assert.ok(K('We hit $10k MRR today after 14 months').includes('$10k MRR'));
  assert.ok(K('So I basically tried the 75 Hard challenge and I want to be really honest about how it went').includes('75 Hard'));
  assert.ok(!K('She basically told me I was wasting my time and honestly she was right').some(k => /^(?:She|I|He|They)$/.test(k)));
  assert.ok(!K('check out hookworthy.app/blog/really-just-honestly, it is basically the best guide').some(k => /blog|really|hookworthy/i.test(k)));
  assert.ok(!K('excited to share that i just signed my 10th ghostwriting client').includes('10th'));
});

test('truth: a put-back restores only that word, and every other cut stays cuttable (uiux-18, marketing-4)', () => {
  const t = 'So basically I just wanted to say that we finally launched our app';
  const R = core.sharpenLine(t, { keep: ['basically'] });
  assert.match(R.line, /^Basically we finally launched our app/);
  assert.deepEqual(R.cut.map(c => c.text), ['So', 'I just wanted to say that']);
  assert.doesNotMatch(R.why, /\bhits?\b/); assert.match(R.why, /You kept “basically”/);
  assert.equal(core.sharpenLine(t, { keep: ['So'] }).line, 'So we finally launched our app.');
});

test('truth: the round failures stay fixed', () => {
  assert.match(S('so $ARB unlock is next week and honestly i think everyone is way too relaxed about it').line, /\$ARB unlock is next week/);
  assert.equal(S("Here's my honest take on memecoins: they're casinos with better branding").line, "Memecoins: they're casinos with better branding.");
  assert.equal(S('Today\'s newsletter is basically a love letter to the humble bullet point').line, "Today's newsletter is a love letter to the humble bullet point.");
  assert.doesNotMatch(S("I'm super happy to announce my first ebook is out now!").line, /\?/);
  assert.doesNotMatch(S('I think most newsletter writers are honestly undercharging for sponsorships').line, /\?/);
  assert.equal(S("I've been writing this newsletter for 200 weeks straight and I want to share what I learned").line.includes('200 weeks straight'), true);
  assert.equal(S('We hit $10k MRR today after 14 months').line, 'We hit $10k MRR today after 14 months');
  assert.equal(S('Honestly I think most people are really just overcomplicating their workouts way too much').line, 'Most people are overcomplicating their workouts.');
  assert.equal(S('Gonna be honest with you guys, I almost quit writing last month.').line, 'I almost quit writing last month.');
  assert.equal(S("I'd like to take a moment to thank everyone who joined our webinar on Tuesday").line, 'Thank you to everyone who joined our webinar on Tuesday.');
  assert.equal(S('honestly i just wanted to say that our churn dropped 20% this quarter').say, 'Cut 2 bits of fluff');
});
