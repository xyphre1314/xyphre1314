/* Sharpen eval: real first lines, drafted the way people draft them, run through the offline one-tap Sharpen
   (the homepage's hgSharpen and the composer's hookUpFor share the same path: soft words out, then core.js hookUp).
   Run: node test/sharpen-eval.mjs [--json]   (sharpen.test.mjs holds it to a floor on every npm test)
   It loads the real code: core.js, plus the hgSharpen block and hookUpPack lifted straight out of index.html, so what
   it grades is what ships. Automatic checks catch the hard failures (a fact lost or invented, a banned word, a hedge
   left in, a loop with nothing after it, a weaker line). The hand grades are the honest read of whether the line would
   stop a scroll: h = a line a good creator would post as is; o = better, with a soft spot left; m = unchanged, worse,
   wrong or awkward. was / gb: what round 73's engine gave, and its grade; now / ga: what round 74 gives, and its grade.
   If an output stops matching "now", the script says so: grade it again before trusting the rate.
   r86: both paths now go through HWCore.sharpenLine; five outputs moved and were graded again (4 h, 1 o, the same 43 h).
   The held-out check on lines the engine was never tuned on is sharpen-heldout.test.mjs. */
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const core = createRequire(import.meta.url)('../../core.js');
const html = readFileSync(path.join(here, '../../index.html'), 'utf8');

/* lift a block of index.html by its first and last markers (the last one is excluded) */
const lift = (from, to) => { const a = html.indexOf(from), b = html.indexOf(to, a + 1); if (a < 0 || b < 0) throw new Error(`eval: can't find ${from}`); return html.slice(a, b); };
const src = [lift('function hookUpPack(', '\n/* one tap'), lift('const HG_DEFAULT', '\n/* word diff that ignores case')].join('\n');
const factory = new Function('HWCore', 'hookScore', 'cap', `${src}\nreturn { hgSharpen, hgMarks, hgClean, HG_HEDGES, hookUpPack };`);
export const E = factory(core, core.hookScore, core.cap);

/* 48 drafts across six niches, written the way people actually draft: warm-ups, hedges, buried numbers, passive voice,
   throat-clearing. body: a second paragraph, so the post continues (an open loop is allowed only then) */
export const EVAL = [
  // crypto / trading
  { n: 'crypto', t: 'so i think the biggest mistake i made this cycle was honestly not taking profits on the way up', was: 'the biggest mistake i made this cycle wasn’t taking profits on the way up.', gb: 'm', ga: 'h', now: 'biggest mistake i made this cycle? not taking profits on the way up.' },
  { n: 'crypto', t: 'not financial advice but i basically stopped trading the first hour after the open and my win rate went from 38% to 61%', was: 'i stopped trading the first hour after the open. my win rate went from 38% to 61%.', gb: 'o', ga: 'h', now: 'my win rate went from 38% to 61%. what changed: i stopped trading the first hour after the open.' },
  { n: 'crypto', t: 'honestly i think most people read funding rates completely backwards', body: 'positive funding doesn’t mean up only. it means longs are paying to stay in.', was: 'most people read funding rates completely backwards.', gb: 'h', ga: 'h', now: 'most people read funding rates completely backwards.' },
  { n: 'crypto', t: 'just wanted to share that i finally hit my first $10k month trading, took me 3 years lol', was: 'that i finally hit my first $10k month trading, took me 3 years.', gb: 'm', ga: 'h', now: 'i finally hit my first $10k month trading, took me 3 years.' },
  { n: 'crypto', t: 'i’ve been journaling every single trade for about a year now and i noticed that most of my losses come on fridays', was: 'i’ve been journaling every single trade for about a year now. i noticed that most of my losses come on fridays.', gb: 'm', ga: 'h', now: 'i’ve been journaling every trade for about a year now. most of my losses come on fridays.' },
  { n: 'crypto', t: 'ngl btc dominance hitting 58% is kind of making me rethink my whole alt strategy', was: 'btc dominance hitting 58% is making me rethink my whole alt strategy.', gb: 'h', ga: 'h', now: 'btc dominance hitting 58% is making me rethink my whole alt strategy.' },
  { n: 'crypto', t: 'So I think sizing down after a loss is probably the most underrated skill in trading', was: 'Most underrated skill in trading? Sizing down after a loss.', gb: 'h', ga: 'h', now: 'Most underrated skill in trading? Sizing down after a loss.' },
  { n: 'crypto', t: 'quick thought: I lost 40% of my account in 2022 because I didn’t use stop losses', was: '2022: I lost 40% of my account because I didn’t use stop losses.', gb: 'o', ga: 'h', now: 'I lost 40% of my account in 2022. I didn’t use stop losses.' },
  // founders / building in public
  { n: 'founder', t: 'Excited to announce that we just launched v2 of our onboarding and activation went from 21% to 38%!', was: 'We launched v2 of our onboarding and activation went from 21% to 38%.', gb: 'o', ga: 'h', now: 'Activation went from 21% to 38%. What changed: we just launched v2 of our onboarding.' },
  { n: 'founder', t: 'so we kind of made sync 38% faster in this release, pretty happy with it', body: 'the trick was batching writes instead of sending each one.', was: 'we made sync 38% faster in this release, pretty happy with it.', gb: 'o', ga: 'h', now: 'we made sync 38% faster in this release.' },
  { n: 'founder', t: 'just wanted to share some thoughts on our launch. only 11 people came lol', was: 'wanted to share some thoughts on our launch. only 11 people came.', gb: 'm', ga: 'h', now: 'our launch: only 11 people came.' },
  { n: 'founder', t: 'I’ve been thinking a lot about pricing lately and I think we were really undercharging', body: 'We doubled the price on Monday. Nobody left.', was: 'I’ve been thinking a lot about pricing lately. We were undercharging.', gb: 'o', ga: 'h', now: 'Pricing: we were undercharging.' },
  { n: 'founder', t: 'We spent 6 months building a feature that literally nobody used', was: 'We spent 6 months building a feature that nobody used.', gb: 'h', ga: 'h', now: 'We spent 6 months building a feature that nobody used.' },
  { n: 'founder', t: 'after talking to 100 customers here are the patterns i noticed', body: '1. they never read the docs\n2. they all use the export button', was: 'after talking to 100 customers here? they’re the patterns i noticed.', gb: 'm', ga: 'h', now: 'i’ve talked to 100 customers. here are the patterns i noticed:' },
  { n: 'founder', t: 'So after a lot of back and forth we have decided to remove the free plan, which was a hard decision for the team', was: 'After a lot of back and forth we have decided to remove the free plan, which was a hard decision for the team.', gb: 'm', ga: 'h', now: 'We’re removing the free plan. It was a hard decision for the team.' },
  { n: 'founder', t: 'honestly building in public has been kind of weird, we got our first 1,000 users from one reddit comment', was: 'building in public has been weird, we got our first 1,000 users from one reddit comment.', gb: 'o', ga: 'o', now: 'we got our first 1,000 users from one reddit comment. building in public has been weird.' },
  { n: 'founder', t: 'Today marks one year since I quit my job to work on this full time, and we are at $4.2k MRR', was: 'Today marks one year since I quit my job to work on this full time, and we are at $4.2k MRR', gb: 'm', ga: 'h', now: 'We’re at $4.2k MRR. One year since I quit my job to work on this full time.' },
  { n: 'founder', t: 'it is important to talk to your users before you write any code', was: 'talk to your users before you write any code.', gb: 'h', ga: 'h', now: 'talk to your users before you write any code.' },
  // newsletters / creators
  { n: 'creator', t: 'new issue is out!! been doing this every sunday for 3 years lol', body: 'this week: why i stopped using templates.', was: 'new issue is out!! been doing this every sunday for 3 years lol', gb: 'm', ga: 'h', now: '3 years, every sunday. new issue is out.' },
  { n: 'creator', t: 'I just wanted to say thank you to everyone who subscribed, we just crossed 5,000 readers', was: 'I wanted to say thank you to everyone who subscribed, we crossed 5,000 readers.', gb: 'm', ga: 'h', now: '5,000 readers. Thank you to everyone who subscribed.' },
  { n: 'creator', t: 'some thoughts on why most threads flop', body: 'the first line is a warm-up. the second line is where the post starts.', was: 'why most threads flop:', gb: 'o', ga: 'h', now: 'most threads flop. here’s why:' },
  { n: 'creator', t: 'honestly i feel like posting every day is kind of overrated if nobody reads your first line', was: 'nobody reads your first line? then posting every day is overrated.', gb: 'h', ga: 'h', now: 'nobody reads your first line? then posting every day is overrated.' },
  { n: 'creator', t: 'So I went from 200 to 4,000 followers in 90 days just by replying to bigger accounts', was: '200 → 4,000 followers in 90 days. The move: replying to bigger accounts.', gb: 'h', ga: 'h', now: '200 → 4,000 followers in 90 days. The move: replying to bigger accounts.' },
  { n: 'creator', t: 'I’ve been writing online for 2 years and the one thing I wish I knew earlier is that the headline is 80% of the work', was: 'I’ve been writing online for 2 years. The one thing I wish I knew earlier is that the headline is 80% of the work.', gb: 'o', ga: 'h', now: '2 years of writing online. What I wish I knew earlier: the headline is 80% of the work.' },
  { n: 'creator', t: 'here is what i learned after 1 year of posting on linkedin every single day', body: '1. nobody cares about your job title\n2. comments beat likes', was: '1 year of posting on linkedin every single day. here’s what i learned:', gb: 'h', ga: 'h', now: '1 year of posting on linkedin every day. here’s what i learned:' },
  { n: 'creator', t: 'Hey everyone! Quick reminder that my course launches tomorrow, really excited about this one', was: 'Everyone! Quick reminder that my course launches tomorrow, excited about this one.', gb: 'm', ga: 'o', now: 'My course launches tomorrow.' },
  { n: 'creator', t: 'I basically rewrote the first line of an old post and it did 10x the replies', body: 'Same post. Same time of day. Only the opener changed.', was: 'I rewrote the first line of an old post. It did 10x the replies.', gb: 'h', ga: 'h', now: 'I rewrote the first line of an old post. It did 10x the replies.' },
  // ghostwritten B2B
  { n: 'b2b', t: 'I am thrilled to share that our team has been recognized as one of the top 50 startups in fintech this year.', was: 'I am thrilled to share that our team has been recognized as one of the top 50 startups in fintech this year.', gb: 'm', ga: 'h', now: 'Top 50 startups in fintech this year. Our team made the list.' },
  { n: 'b2b', t: 'In today’s competitive landscape, it is essential for sales leaders to prioritize customer retention over acquisition.', was: 'In today’s competitive landscape, it is essential for sales leaders to prioritize customer retention over acquisition.', gb: 'm', ga: 'h', now: 'Sales leaders: prioritize customer retention over acquisition.' },
  { n: 'b2b', t: 'I believe that the most important thing a CEO can do is to hire people who are smarter than them', was: 'That the most important thing a CEO can do is to hire people who are smarter than them.', gb: 'm', ga: 'h', now: 'Most important thing a CEO can do? Hire people smarter than them.' },
  { n: 'b2b', t: 'Over the past 10 years of leading teams, I have learned that feedback is a gift that very few people actually know how to give.', was: 'Over the past 10 years of leading teams, I’ve learned that feedback is a gift that few people know how to give.', gb: 'o', ga: 'h', now: 'What 10 years of leading teams taught me: feedback is a gift that few people know how to give.' },
  { n: 'b2b', t: 'We are going to be hosting a webinar next Tuesday on how to reduce churn by 20%', was: 'We are going to be hosting a webinar next Tuesday on how to reduce churn by 20%', gb: 'm', ga: 'h', now: 'How to reduce churn by 20%. We’re hosting a webinar on it next Tuesday.' },
  { n: 'b2b', t: 'Customer churn was reduced by 34% after the onboarding flow was redesigned by our team.', body: 'Three changes did most of the work.', was: 'Customer churn was reduced by 34% after the onboarding flow was redesigned by our team.', gb: 'm', ga: 'h', now: 'Customer churn: down 34%. What changed: our team redesigned the onboarding flow.' },
  { n: 'b2b', t: 'After hiring over 300 people, I think the best interview question is really just four words', body: '“What did you fix?”', was: 'Best interview question? Four words after hiring over 300 people.', gb: 'm', ga: 'h', now: 'I’ve hired over 300 people. The best interview question is four words:' },
  { n: 'b2b', t: 'I wanted to talk about why our sales team stopped doing cold calls this quarter', body: 'Short version: warm intros closed 4x more.', was: 'Why our sales team stopped doing cold calls this quarter:', gb: 'h', ga: 'h', now: 'Our sales team stopped doing cold calls this quarter. Here’s why:' },
  // fitness
  { n: 'fitness', t: 'so i think i finally figured out why i couldn’t lose weight for like 5 years', body: 'it wasn’t the food. it was the sleep.', was: 'i finally figured out why i couldn’t lose weight for like 5 years.', gb: 'o', ga: 'h', now: '5 years of not losing weight. i finally figured out why.' },
  { n: 'fitness', t: 'honestly lifting 3 days a week has been kind of a game changer for my energy', was: 'lifting 3 days a week has been a game changer for my energy.', gb: 'm', ga: 'o', now: 'lifting 3 days a week changed my energy.' },
  { n: 'fitness', t: 'i ran 5km every morning for 365 days and the hardest part was honestly never the running', was: 'i ran 5km every morning for 365 days. the hardest part was never the running.', gb: 'h', ga: 'h', now: 'i ran 5km every morning for 365 days. the hardest part was never the running.' },
  { n: 'fitness', t: 'Just wanted to share that I lost 22 lbs in 4 months without cutting carbs', was: 'That I lost 22 lbs in 4 months without cutting carbs.', gb: 'm', ga: 'h', now: 'I lost 22 lbs in 4 months without cutting carbs.' },
  { n: 'fitness', t: 'you should really be tracking your protein if you want to build muscle', was: 'you should be tracking your protein if you want to build muscle.', gb: 'm', ga: 'h', now: 'want to build muscle? track your protein.' },
  { n: 'fitness', t: 'I think a lot of people are probably overtraining and it is actually slowing down their progress', was: 'A lot of people are overtraining. It’s slowing down their progress.', gb: 'o', ga: 'o', now: 'A lot of people are overtraining. It’s slowing down their progress.' },
  // design / engineering
  { n: 'eng', t: 'I think we should probably stop using story points, they don’t really mean anything', was: 'Stop using story points, they don’t mean anything.', gb: 'o', ga: 'h', now: 'Stop using story points. They don’t mean anything.' },
  { n: 'eng', t: 'so i deleted 1,400 lines of code today and the app actually got faster', was: 'i deleted 1,400 lines of code today. the app got faster.', gb: 'h', ga: 'h', now: 'i deleted 1,400 lines of code today. the app got faster.' },
  { n: 'eng', t: 'Here are 5 things I learned from redesigning our checkout flow', body: '1. Fewer fields beat smarter fields.', was: '5 things I learned from redesigning our checkout flow:', gb: 'h', ga: 'h', now: '5 things I learned from redesigning our checkout flow:' },
  { n: 'eng', t: 'honestly most design systems fail because nobody really owns them', was: 'because nobody owns them, most design systems fail.', gb: 'm', ga: 'h', now: 'why do most design systems fail? nobody owns them.' },
  { n: 'eng', t: 'We migrated our entire backend from Rails to Go and our p99 latency dropped from 800ms to 120ms', was: 'We migrated our entire backend from Rails to Go. Our p99 latency dropped from 800ms to 120ms.', gb: 'o', ga: 'h', now: 'Our p99 latency dropped from 800ms to 120ms. What changed: we migrated our entire backend from Rails to Go.' },
  { n: 'eng', t: 'I spent $1,200 on courses and the best lesson was free: ship every day', was: 'I spent $1,200 on courses. The best lesson was free: ship every day.', gb: 'h', ga: 'h', now: 'I spent $1,200 on courses. The best lesson was free: ship every day.' },
  { n: 'eng', t: 'Our team has been experimenting with AI code review for the past 3 months, and the results have been interesting', body: 'It caught 2 real bugs. It also flagged 140 things that weren’t.', was: 'Our team has been experimenting with AI code review for the past 3 months. The results have been interesting.', gb: 'o', ga: 'h', now: 'Our team spent 3 months experimenting with AI code review. Here’s what we found:' }
];

/* the hard failures, checked on every line */
const BANNED = /\b(unlock|supercharge|leverage|elevate|seamless|game[- ]?changer|delve|ai-powered)\b/i;
const HEDGE = /\b(i think|i feel like|i believe|i guess|honestly|tbh|ngl|imo|basically|literally|actually|kind of|sort of|kinda|sorta|probably|maybe|perhaps|really|very|just wanted|quick thought|not financial advice|excited to|thrilled to)\b/i;
const nums = s => (String(s).match(/\$?\d[\d,.]*\s?(?:%|k|x|ms|lbs|km)?/gi) || []).map(x => x.replace(/[\s,]/g, '').replace(/\.$/, '').toLowerCase()).sort().join('|');
export function check(e, r) {
  const issues = [], line = r.first, from = core.hookScore(e.t).score, to = core.hookScore(line + (e.body ? '\n\n' + e.body : '')).score;
  if (r.same) issues.push('unchanged');
  if (nums(line) !== nums(e.t)) issues.push(`numbers ${nums(e.t)} → ${nums(line)}`);
  if (BANNED.test(line)) issues.push('banned word');
  if (HEDGE.test(line)) issues.push(`hedge left: ${line.match(HEDGE)[0]}`);
  if (/\p{Extended_Pictographic}|🧵/u.test(line) && !/\p{Extended_Pictographic}/u.test(e.t)) issues.push('emoji added');
  if (/\bhere[’']s (why|how|what)\b/i.test(line) && !e.body) issues.push('loop with nothing after it');
  if (/:$/.test(line) && !e.body) issues.push('ends on a colon with nothing after it');
  if (/^\P{L}*\p{Ll}/u.test(e.t) && !/^(i|so|just|honestly|ngl|not|quick|new|some|here|after|you|it)\b/i.test(e.t) && /^\P{L}*\p{Lu}/u.test(line) && !/^(I|BTC|ETH)\b/.test(line)) issues.push('lost lowercase');
  if (to < from) issues.push('weaker');
  return { from, to, issues };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const json = process.argv.includes('--json'), out = [];
  let ready = 0, clean = 0;
  for (const e of EVAL) {
    const r = E.hgSharpen(e.t + (e.body ? '\n' + e.body : '')), c = check(e, r);
    if (c.to >= 70) ready++; if (!c.issues.length) clean++;
    out.push({ n: e.n, before: e.t, was: e.was, after: r.first, say: r.say, why: r.why, from: c.from, wasTo: core.hookScore(e.was + (e.body ? '\n\n' + e.body : '')).score, to: c.to, issues: c.issues, gb: e.gb, ga: e.ga, regrade: !!e.now && e.now !== r.first });
  }
  if (json) console.log(JSON.stringify(out, null, 1));
  else {
    out.forEach((o, i) => console.log(`${String(i + 1).padStart(2)} [${o.n}] draft ${o.from} · r73 ${o.wasTo} (${o.gb}) · r74 ${o.to} (${o.ga})${o.regrade ? ' · CHANGED, grade again' : ''}${o.issues.length ? '  ✗ ' + o.issues.join('; ') : ''}\n   draft: ${o.before}\n   r73:   ${o.was}\n   r74:   ${o.after}${o.say ? `\n          ${o.say}. ${o.why || ''}` : ''}`));
    const n = out.length, pct = k => `${Math.round(k / n * 100)}%`, cnt = (key, g) => out.filter(o => o[key] === g).length, wasReady = out.filter(o => o.wasTo >= 70).length;
    console.log(`\n${n} drafts. Scores are today's scorer, so both columns are measured the same way.`);
    console.log(`round 73: hit ${cnt('gb', 'h')} (${pct(cnt('gb', 'h'))}) · ok ${cnt('gb', 'o')} · miss ${cnt('gb', 'm')} · Ready after one tap ${wasReady}/${n}`);
    console.log(`round 74: hit ${cnt('ga', 'h')} (${pct(cnt('ga', 'h'))}) · ok ${cnt('ga', 'o')} · miss ${cnt('ga', 'm')} · Ready after one tap ${ready}/${n} · no hard failure ${clean}/${n}${out.some(o => o.regrade) ? ' · some outputs changed since grading' : ''}`);
  }
}
