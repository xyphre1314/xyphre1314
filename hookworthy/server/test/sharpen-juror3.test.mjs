/* r86 pass 4: what the third juror (hook-1…16) and the UI/UX, marketing and web jurors found, held as rules. Written apart
   from the engine's guards, on the juror's own lines plus fresh probes:
   1. no false "would break" bail-out: an opinion frame takes its "that", and "Marked, not cut" only says "breaks" when it does
   2. the run-ups people really write are marked and cut whole ("one of the most important lessons I've learned is that")
   3. a label cut never leaves a broken opener ("On the startup:"), and a #tag keeps its label
   4. "just" = simply, "basically everyone", a jab's "just", a sincere "yet another", a stressed "I am" stay
   5. a tail ("just my opinion though"), a disclaimer and a list are one piece each; nothing is struck that wasn't marked first
   6. why quotes end where a phrase ends; a count is a count, not proof; the receipt counts the beats it made
   7. strikes = every removed word, and every struck span can be put back */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const core = createRequire(import.meta.url)('../../core.js');
const S = (t, o) => core.sharpenLine(t, o);
const L = (t, o) => S(t, o).line;

test('juror 3, hook-1: an opinion frame takes its "that"; "breaks" only when it does', () => {
  assert.equal(L('I think that in 5 years nobody will remember this.'), 'In 5 years nobody will remember this.');
  assert.equal(L('I think that in 2026, the companies that will win are the ones that are actually willing to say something interesting.'), 'In 2026, the companies that will win are the ones that are willing to say something interesting.');
  /* the cut lands (no bail-out); "just need" (= simply) and the closing "pretty much it" are the writer's voice and stay */
  assert.equal(L("I really think that most people basically just need to sleep more and eat more protein, and that's pretty much it"), "Most people just need to sleep more and eat more protein, and that's pretty much it.");
  assert.equal(L("I think that's pretty much it for today."), "That's pretty much it for today.");
  /* an unsure line says "breaks" only when the cut version is broken or says something else */
  const { rows } = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-heldout.json'), 'utf8'));
  const D = core.SHARPEN._dbg;
  for (const r of rows) {
    const R = S(r.t); if (R.state !== 'unsure' || !/breaks|break the line/.test(R.why)) continue;
    const fb = core.softCut(R.draft).s.replace(/\s+([.!?:])/g, '$1').trim();
    assert.ok(!D.slOK(fb, R.draft), `${R.draft}: says it breaks, but "${fb}" doesn't`);
  }
});

test('juror 3, hook-2: the run-ups people really write are marked and cut whole', () => {
  assert.equal(L("As a designer, one of the most important lessons I've learned is that you're not designing for yourself, you're designing for the user."), "You're not designing for yourself. You're designing for the user.");
  assert.equal(L('Just a quick thread on why the halving is priced in 👇'), 'Why the halving is priced in 👇');
  assert.equal(L("A thread of 12 things I've learned from 12 years of investing 🧵👇"), "12 things I've learned from 12 years of investing 🧵👇");
  assert.equal(L('Fitness tip: Stop doing cardio on an empty stomach if you actually want to build muscle #fitness #gym'), 'Stop doing cardio on an empty stomach if you actually want to build muscle #fitness #gym');
  assert.equal(L("It's kind of crazy to think that a year ago this was just an idea in my notes app and now 2,000 people use it every day"), 'A year ago this was just an idea in my notes app and now 2,000 people use it every day.');
  assert.equal(L("Honestly I'm just curious, what does everyone here actually do for a living?"), 'What does everyone here actually do for a living?');
  assert.equal(L("Just wanted to give a huge shoutout to @sarahwrites for the amazing feedback on my latest draft, she's honestly the best editor I know"), "Huge shoutout to @sarahwrites for the amazing feedback on my latest draft. She's the best editor I know.");
  assert.equal(L('So I finally got around to trying out Cursor for the first time and I have to say I\'m genuinely pretty impressed with how it handles large codebases'), "I finally tried Cursor for the first time. I'm impressed with how it handles large codebases.");
  assert.equal(L("So here's the thing. I've been thinking about this for a while now. And I think I've finally figured out why most creators burn out."), "I've finally figured out why most creators burn out.");
  assert.equal(L("In today's issue, I'm going to be talking about why I think most people are really doing email marketing wrong."), "Today's issue: why most people are doing email marketing wrong.");
  assert.equal(L('So basically we raised a $2.5M seed round led by @a16z and I wanted to share a few thoughts on the process'), 'We raised a $2.5M seed round led by @a16z. A few thoughts on the process:');
  assert.equal(L("I've lost 30 lbs in the last 4 months without giving up carbs, and I'm going to explain exactly how I did it in this thread"), "I've lost 30 lbs in the last 4 months without giving up carbs. Here's exactly how:");
  assert.equal(L("I'm super excited to announce that after a lot of hard work we've officially launched our new product on Product Hunt today!"), 'We launched our new product on Product Hunt today.');
  assert.equal(L('I wanted to share a really interesting chart I came across this week that basically shows how much attention spans have dropped'), 'An interesting chart I came across this week shows how much attention spans have dropped.');
  assert.match(L("I just wanted to take a moment to really thank everyone who has supported us over the past three years, from our very first beta users who put up with a ton of bugs, to our amazing team who basically worked nights and weekends, to our investors who believed in us when literally nobody else did. We're officially profitable as of this month."), /^We're officially profitable as of this month\. Thank you to everyone who/);
  assert.equal(L('Why is it that every single productivity app eventually turns into a note-taking app?'), 'Why does every single productivity app eventually turn into a note-taking app?');
  /* "Nothing soft to cut" only when nothing matched */
  assert.doesNotMatch(S("As a designer, one of the most important lessons I've learned is that you're not designing for yourself").why, /Nothing soft/);
});

test('juror 3, hook-3: a label cut never leaves a broken opener', () => {
  for (const t of ["Quick update on the startup: we've decided to shut it down. I'll write more about why soon.", 'Quick update on $ETH: still holding.', "#buildinpublic update: we're now at 1,200 users and $3.4k MRR, up 22% from last month 📈"]) assert.equal(L(t), t);
  assert.equal(L('Big update on the app: the app now has 500 users.'), 'The app now has 500 users.');
  const { rows } = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-heldout.json'), 'utf8'));
  for (const r of rows) { const R = S(r.t); assert.doesNotMatch(R.line, /^\P{L}*(?:on|about|of|from|with|re)\b[^.!?:\n]{0,40}:/iu, R.draft); }
});

test('juror 3, hook-4/5/8: the words that carry the meaning stay', () => {
  assert.equal(L('idk who needs to hear this but you can just log off'), 'you can just log off.');
  for (const t of ['you can just say no.', 'you can just leave.', 'Basically everyone I know is burned out.', 'Pretty much every trader I know lost money in May.']) assert.equal(L(t), t);
  assert.match(L('today i learned that you can just ask people for things and they\'ll often say yes'), /you can just ask/);
  assert.equal(L("Love how every 'passive income' guru is actually just selling a course on passive income."), "Love how every 'passive income' guru is just selling a course on passive income.");
  /* a sincere "yet another" guards only its own clause */
  { const y = L("Honestly we just shipped yet another update and it's really fast now."); assert.match(y, /^We just shipped yet another update/); assert.doesNotMatch(y, /\b(?:Honestly|really)\b/); }
  assert.doesNotMatch(L("Unpopular opinion but I really think that most junior developers would honestly be much better off spending their first year actually learning how to read other people's code and debug real production issues rather than just building yet another todo app with whatever the trendiest framework of the month happens to be at the time."), /\b(?:really|honestly|actually)\b/);
  assert.match(L("I'm not saying you should never use an ORM, but I am saying you should really understand the SQL it generates."), /\bI am saying\b/);
  assert.equal(L('Hot take: most apps don\'t need microservices. A monolith is probably fine.'), "Most apps don't need microservices. A monolith is probably fine.");
});

test('juror 3, hook-7/9/12/13/15/16: tails, lists, idioms, salad, stance and disclaimers', () => {
  assert.equal(L('honestly i think $SOL is going to outperform $ETH this cycle, just my opinion though'), 'i think $SOL will outperform $ETH this cycle.');
  for (const t of ["Funding is negative, OI is climbing, and price won't move. Someone is about to get squeezed.", "I've been writing a newsletter every single week for 3 years. Here are 7 lessons:", 'Kind of a big day: we just crossed 1 million downloads.']) assert.equal(L(t), t);
  assert.ok(S('Kind of a big day: we just crossed 1 million downloads.').kept.includes('1 million downloads'));
  assert.equal(S('purple elephant spreadsheet tomorrow banana').state, 'thin');
  /* a market-structure claim is a call; a call that hedges itself drops the opinion frame */
  assert.equal(L('Just a quick thread on why I think the halving is already priced in 👇'), 'Why I think the halving is already priced in 👇');
  assert.equal(L('In my humble opinion, the vast majority of altcoins will probably never see their ATHs again.'), 'Most altcoins will probably never see their ATHs again.');
  /* a disclaimer is never fluff: alone it's complete, up front on a call it moves to the end */
  for (const t of ['This is not financial advice.', 'NFA. Not financial advice. DYOR.']) { const R = S(t); assert.equal(R.state, 'clean', t); assert.equal(R.why, 'A disclaimer. Nothing to cut.'); assert.deepEqual(R.marks, []); }
  const R = S('I just wanted to quickly say that I am not a financial advisor and this is not financial advice but I really think $LINK is very undervalued right now');
  assert.equal(R.line, 'I really think $LINK is undervalued right now. Not financial advice.'); assert.match(R.say, /Moved the disclaimer to the end/);
  assert.equal(L('I think we\'re probably in the boring middle of the cycle right now, nfa'), "We're probably in the boring middle of the cycle right now, nfa.");
});

test('juror 3, hook-10/11 and marketing-1/3: quotes end on a phrase, counts are counts, reorders are sentences', () => {
  const quotes = w => [...String(w).matchAll(/“([^”]+)”/g)].map(m => m[1]);
  assert.ok(!quotes(S("Thrilled to announce we've raised a $4M seed round led by @a16z!").why).some(q => /\bled$/.test(q)));
  assert.ok(quotes(S('Pleased to announce that our open-source library just passed 10,000 GitHub stars').why).every(q => !/\bGitHub$/.test(q)));
  assert.match(S('Here are 10 VS Code extensions I can’t live without:').why, /^“10 VS Code extensions” comes first, so people know what they’re getting\.$/);
  assert.doesNotMatch(S('Here are 3 stretches I do every single morning before work:').why, /proof/);
  assert.equal(S('So I have been thinking about this a lot lately and I honestly believe that the vast majority of retail traders are basically just gambling, because they don\'t have a plan, they don\'t size their positions properly, they don\'t use stop losses, and they really just chase whatever coin is pumping on their timeline that day, which is exactly why 90% of them lose money.').say.match(/Split it into (\w+) beats/)[1], 'three');
  assert.equal(L('this might be controversial but i actually think dca is overrated for most people'), 'i actually think dca is overrated for most people.');
  assert.equal(L('so i think the real reason most newsletters stall is that the first line is boring'), 'the real reason most newsletters stall? the first line is boring.');
  assert.equal(L('Quick update: we shipped dark mode and the onboarding checklist this week'), 'We shipped dark mode and the onboarding checklist this week.');
  assert.equal(L("Thrilled to announce we've raised a $4M seed round led by @a16z!"), "We've raised a $4M seed round led by @a16z.");
  /* every quote over the held-out lines ends on a phrase: never on a small word, a verb before its particle, or a lone quote mark */
  const { rows } = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-heldout.json'), 'utf8'));
  const SMALL = /^(?:a|an|the|to|of|for|from|in|on|at|by|with|and|or|but|my|our|your|their|is|are|was|were|has|have|had|that|this|as|what|why|how|who|led)$/i;
  for (const r of rows) { const R = S(r.t), cuts = R.cut.map(c => c.text.replace(/[,:;.!—-]+$/, '')); for (const q of quotes(R.why)) { if (cuts.includes(q) || q.split(/\s+/).length < 2 || new RegExp(`${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[.!?:]`, 'i').test(R.line)) continue; const last = q.split(/\s+/).pop(); assert.ok(!SMALL.test(last) || /^[A-Z]$/.test(last), `${R.draft}: quote "${q}"`); assert.equal((q.match(/`/g) || []).length % 2, 0, `${R.draft}: quote "${q}"`); assert.doesNotMatch(q, /\b(?:came|ran|set|signed|found|figured|talk|deal|dealing)$/, `${R.draft}: quote "${q}"`); } }
});

test('juror 3, hook-6/9 and uiux-1: strikes are every removed word, fluff was marked first, every strike can be put back', () => {
  const { rows } = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-heldout.json'), 'utf8'));
  const n = s => String(s).toLowerCase().replace(/[’']/g, "'").replace(/[^\p{L}\p{N}$%@#' ]+/gu, ' ').replace(/\s+/g, ' ').trim();
  const bad = [];
  rows.forEach((r, i) => {
    const R = S(r.t); if (R.state !== 'sharp') return;
    R.cut.filter(c => c.kind !== 'reshape').forEach(c => { if (!R.marks.some(m => c.at[0] < m[1] && c.at[1] > m[0])) bad.push(`${R.draft}: "${c.text}" struck as fluff but never marked`); });
    if (i % 5) return;
    R.cut.forEach(c => { const R2 = S(r.t, { keep: [c.text] }); if (!n(R2.line).includes(n(c.text))) bad.push(`${R.draft}: put back "${c.text}" (${c.kind}) → ${R2.line}`); });
  });
  assert.deepEqual(bad, []);
  /* "We just hit" goes with the number move: struck, not vanished, and putting it back restores the opener */
  const R = S("We just hit $10k MRR after 14 months of building in public. Here's everything that actually worked:");
  if (R.state === 'sharp' && !/^We just hit/.test(R.line)) { assert.ok(R.cut.some(c => /We just hit/.test(c.text) || c.text === 'We'), R.line); assert.match(L(R.draft, { keep: ['We just hit'] }), /We just hit/); }
  assert.match(L('Maybe I’m wrong, but I think it’s still early for ETH.', { keep: ['I think'] }), /I think/);
});

test('rounds G-J: the misses found at first contact stay fixed', () => {
  assert.equal(L("After a lot of thought, we've decided to sunset our free plan starting next month"), "We're sunsetting our free plan starting next month.");
  assert.equal(S("Cold email still works. Lazy cold email doesn't.").state, 'clean', 'a real 7-word post is never thin');
  assert.equal(L("I'll be honest, I almost didn't post this because I thought nobody would care"), "I almost didn't post this because I thought nobody would care.");
  assert.equal(L("I've said this before and I'll say it again: your first line is 80% of the work"), 'Your first line is 80% of the work.');
  assert.match(L('Not gonna lie, I was really nervous about raising prices but we lost basically zero customers'), /basically zero customers/);
  assert.doesNotMatch(L("If there's one thing I've learned from writing online for 4 years, it's that consistency beats virality"), /\?/);
  assert.equal(L("Not financial advice obviously but I've been slowly accumulating $LINK under 15 for the past month"), "I've been slowly accumulating $LINK under 15 for the past month. Not financial advice.");
  assert.doesNotMatch(L('I genuinely believe that the best founders are the ones who are obsessed with the problem, not the solution'), /aren['’]t the solution/);
  assert.doesNotMatch(L("I want to take a second to talk about something that I think doesn't get discussed enough in the startup world, which is how lonely it can be to be a solo founder, especially in the early days when nobody believes in what you're building and every week feels like you're shouting into the void. Last week we finally crossed 1,000 paying customers."), /(?:^|\. )Something that/);
  /* a sharp line keeps its shape; a sincere "just" (= merely, simply) stays */
  for (const t of ['If your pricing page needs a FAQ, your pricing is too complicated.', 'Funding rates are negative and price is still going up. Shorts are about to have a bad week.', 'Quarterly planning is just guessing with a spreadsheet.']) assert.equal(L(t), t);
  /* the news leads a post over 280, and a feeling said in the first person keeps its weight */
  assert.match(L("I've been building in public for almost two years now and I wanted to share something that I really think a lot of people get wrong, which is that they focus way too much on follower count and not nearly enough on whether the people following them actually care about what they're building. We just hit $20k MRR with 3,100 followers."), /^We just hit \$20k MRR with 3,100 followers\./);
  assert.match(L("I don't usually post about my personal life on here but I just got married this weekend and I'm really happy"), /really happy/);
});

test('web-1: SHARPEN.warm() compiles every path once, and the first call after it is fast', () => {
  assert.equal(typeof core.SHARPEN.warm, 'function'); assert.equal(typeof core.SHARPEN.warmSteps, 'function');
  const ms = core.SHARPEN.warm({ sync: true }); assert.ok(ms > 0);
  const t = Date.now(); core.sharpenLine('idk who needs to hear this but you can just log off and touch some grass'); assert.ok(Date.now() - t < 150, 'warm first call');
});
