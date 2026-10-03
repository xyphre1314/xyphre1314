import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const core = createRequire(import.meta.url)('../../core.js');

const ARCHIVE = `window.YTD.tweets.part0 = [
 {"tweet":{"id_str":"1","full_text":"I charged 10x more and got more customers.","created_at":"Tue Mar 05 14:40:00 +0000 2024","favorite_count":"980","retweet_count":"120","in_reply_to_status_id_str":null}},
 {"tweet":{"id_str":"2","full_text":"Part two of the thread https://t.co/abc","created_at":"Tue Mar 05 14:41:00 +0000 2024","favorite_count":"40","retweet_count":"2","in_reply_to_status_id_str":"1","in_reply_to_user_id_str":"99"}},
 {"tweet":{"id_str":"3","full_text":"RT @someone: not mine","created_at":"Wed Mar 06 10:00:00 +0000 2024","favorite_count":"0","retweet_count":"0"}},
 {"tweet":{"id_str":"4","full_text":"@friend congrats!","created_at":"Wed Mar 06 11:00:00 +0000 2024","favorite_count":"3","retweet_count":"0","in_reply_to_status_id_str":"777","in_reply_to_user_id_str":"55"}},
 {"tweet":{"id_str":"5","full_text":"so i think pricing is kind of important &amp; stuff","created_at":"Thu Mar 07 22:00:00 +0000 2024","favorite_count":"4","retweet_count":"0"}}
]`;
const ACCOUNT = `window.YTD.account.part0 = [{"account":{"username":"heycape_","accountDisplayName":"Cape","accountId":"99"}}]`;

test('hook score rewards specifics and punishes hedges', () => {
  assert.ok(core.hookScore('Double your price. Signups went up 31%.').score >= 70);
  assert.ok(core.hookScore('so i think pricing is kind of important').score < 50);
  assert.equal(core.hookScore('').score, 0);
});

test('X archive: keeps originals, folds self-replies into threads, drops RTs and replies to others', () => {
  const r = core.parseXArchive([{ name: 'tweets.js', text: ARCHIVE }, { name: 'account.js', text: ACCOUNT }]);
  assert.equal(r.account.handle, 'heycape_');
  assert.deepEqual(r.posts.map(p => p.id).sort(), ['x-1', 'x-5']);
  const one = r.posts.find(p => p.id === 'x-1');
  assert.equal(one.likes, 980); assert.equal(one.reposts, 120);
  assert.deepEqual(one.thread, ['Part two of the thread']);
  assert.equal(one.url, 'https://x.com/heycape_/status/1');
  assert.ok(r.posts.find(p => p.id === 'x-5').text.includes('& stuff'));
});

test('CSV: quoted commas and newlines, column detection, 1.2k numbers', () => {
  const csv = 'Post Text,Likes,Impressions,Date\n"line one, still one\nline two",1.2k,40000,2025-01-02\nsecond,5,100,2025-01-03\n';
  const p = core.parseCSV(csv);
  assert.equal(p.length, 2); assert.equal(p[0].likes, 1200); assert.equal(p[0].views, 40000); assert.match(p[0].text, /line two/);
});

test('LinkedIn Shares.csv shape', () => {
  const p = core.parseCSV('Date,ShareLink,ShareCommentary,SharedUrl\n2025-02-01 10:00:00,https://li/x,"I almost quit in March.",\n', 'linkedin');
  assert.equal(p[0].text, 'I almost quit in March.'); assert.equal(p[0].src, 'linkedin');
});

test('pasted posts split on --- and pick up likes', () => {
  const p = core.parsePasted('first post here\nlikes: 120\n---\nsecond post here');
  assert.equal(p.length, 2); assert.equal(p[0].likes, 120); assert.equal(p[0].text, 'first post here');
});

test('Typefully drafts', () => {
  const p = core.parseTypefully([{ id: 7, text: 'Hook line\n\n\n\nSecond tweet', published_on: '2025-03-01T10:00:00Z', twitter_url: 'https://x.com/a/status/1' }]);
  assert.equal(p[0].text, 'Hook line'); assert.deepEqual(p[0].thread, ['Second tweet']);
});

test('analyze: kinds, calibration, voice stats, old top posts', () => {
  const now = Date.parse('2026-09-30');
  const posts = [];
  for (let i = 0; i < 12; i++) posts.push(core.normPost({ id: 'c' + i, text: `Unpopular opinion: pricing page ${i} is overrated. Charge 2x.`, likes: 400 + i, at: now - (90 + i) * 864e5 }));
  for (let i = 0; i < 12; i++) posts.push(core.normPost({ id: 'w' + i, text: `so i think maybe things are kind of ok today ${'abcdefghijkl'[i]}`, likes: 10 + i, at: now - i * 864e5 }));
  const a = core.analyze(posts, now);
  assert.equal(a.n, 24);
  assert.equal(a.bestKind.k, 'Contrarian');
  assert.ok(a.calib && a.calib.x > 5, 'strong hooks earned more here');
  assert.ok(a.oldTop.length > 0);
  assert.ok(a.stats.wps > 0);
});

test('checkPost flags bait, blanks, links and never-say words', () => {
  const c = core.checkPost('https://a.com I lost [amount] and we leverage it. Agree?', { never: ['leverage'] });
  assert.ok(c.some(x => /blank/.test(x))); assert.ok(c.some(x => /link/i.test(x))); assert.ok(c.some(x => /bait/.test(x))); assert.ok(c.some(x => /leverage/.test(x)));
});

test('prompts carry the voice evidence and ask for JSON', () => {
  const s = core.prompts.rewrite({ text: 'draft', kind: 'hook', voice: { summary: 'lowercase, dry', examples: ['my best post'], never: ['delve'] } });
  assert.equal(s.tier, 'default'); assert.equal(s.json, true);
  assert.match(s.prompt, /my best post/); assert.match(s.prompt, /delve/); assert.match(s.prompt, /Never invent/);
  assert.equal(core.prompts.voiceProfile({ posts: [] }).tier, 'complex');
});

test('X character count: links are 23, emoji and CJK are 2', () => {
  assert.equal(core.xLength('hello'), 5);
  assert.equal(core.xLength('see https://example.com/' + 'a'.repeat(200)), 27);
  assert.equal(core.xLength('🚀🚀'), 4);
  assert.equal(core.xLength('日本語'), 6);
  assert.equal(core.xLength('👍🏽 ok'), 5);
});

test('sounds-like-you flags what drifts from your habits', () => {
  const r = core.voiceMatch('I am thrilled to leverage this game-changer!! 🚀🚀 #growth', { wps: 9, emojiPer: .05, tagsPer: 0, lower: 60 }, { never: ['leverage'] });
  assert.ok(r.score < 50); const frags = r.miss.map(m => m.frag);
  for (const f of ['#growth', 'leverage', 'game-changer']) assert.ok(frags.includes(f), f);
  assert.ok(core.voiceMatch('shipped the pricing page. 3 plans to 1.', { wps: 8, emojiPer: 0, tagsPer: 0, lower: 80 }).score >= 90);
});
test('predict from history uses the nearest past posts', () => {
  const posts = [core.normPost({ id: 'a', text: 'I raised my price and lost zero customers', likes: 900 }), core.normPost({ id: 'b', text: 'my morning routine, ranked', likes: 20 })];
  const p = core.predictFromHistory('I doubled my price. Customers stayed.', posts); assert.ok(p && p.near[0].id === 'a' && p.estimate > 300);
});

test('visualPlan picks the picture a post wants and copies numbers exactly', () => {
  const d = core.visualPlan('Redesigned onboarding from 7 screens to 2. Activation went from 21% → 38%.');
  assert.equal(d.template, 'data'); assert.equal(d.metric, 'Activation'); assert.equal(d.before, '21%'); assert.equal(d.after, '38%'); assert.equal(d.delta, '+81%');
  assert.equal(d.headline, 'Redesigned onboarding from 7 screens to 2.'); assert.equal(d.chip, '', 'no chip when the headline already says it');
  const churn = core.visualPlan('Churn fell from 9% to 4% after we added onboarding calls.'); assert.equal(churn.delta, '−56%'); assert.equal(churn.good, true, 'lower churn is good');
  const words = core.visualPlan('Before: 40 meetings a week\nAfter: 6 meetings a week'); assert.equal(words.template, 'data'); assert.equal(words.metric, 'Meetings a week');
  assert.equal(core.visualPlan('We doubled our price. Signups went up 31%.').template, 'stat');
  assert.equal(core.visualPlan('5 things I learned:\n\n1. Ship daily\n2. Talk to users\n3. Charge more').template, 'list');
  assert.equal(core.visualPlan('Old way: ship when ready\nNew way: ship on Fridays').template, 'compare');
  const q = core.visualPlan('I almost quit my startup in March.'); assert.equal(q.template, 'quote'); assert.equal(q.emphasis, 'quit');
  assert.equal(core.visualPlan('Shipped at 2am in 2024.').template, 'quote', 'times and years are not stats');
  const p = core.prompts.visual({ text: 'x', plan: d }); assert.equal(p.tier, 'quick'); assert.match(p.prompt, /never invent/);
});

test('briefs: facts ranked, hype flagged, gaps found, drafts keep numbers, factCheck catches invented ones', () => {
  const b = 'Launching Tally Notes 2.0. We rebuilt sync from scratch. Load time dropped from 3.2s to 0.4s. 1,200 teams on the beta. It is the fastest notes app ever made. Try it on the waitlist.';
  const r = core.briefRead(b);
  assert.equal(r.facts[0].quote, 'Load time dropped from 3.2s to 0.4s.');
  assert.deepEqual(r.careful, ['It is the fastest notes app ever made.']);
  assert.ok(r.gaps.some(g => /when/.test(g)) && r.gaps.some(g => /link/.test(g)));
  const t = core.briefDraft(b, { format: 'thread' }); assert.equal(t[0], 'Load time dropped from 3.2s to 0.4s.'); assert.ok(!t.join(' ').includes('fastest'), 'hype stays out'); assert.match(t[t.length - 1], /\[link\]/);
  assert.ok(t.every(p => p.length <= 280));
  assert.deepEqual(core.factCheck('Now 0.4s, down from 3.2s. 1,500 teams. [x] 3 tips.', b), ['1,500']);
  assert.equal(core.tidySpoken('um so i think uh the the thing is, you know, we shipped it'), 'So I think the thing is, we shipped it.');
  assert.equal(core.prompts.briefWrite({ text: b, format: 'long', limit: 25000 }).prompt.includes('25,000'), true);
});

/* ---- data-correctness fixes ---- */
test('imports: a second import never overwrites earlier posts; the same post dedupes and updates', () => {
  let h = core.mergeHistory([], core.parseCSV('text,likes\nAlpha post,1\nBeta post,2'));
  h = core.mergeHistory(h, core.parseCSV('text,likes\nGamma post,5'));
  assert.deepEqual(h.map(p => p.text).sort(), ['Alpha post', 'Beta post', 'Gamma post']);
  h = core.mergeHistory(h, core.parseCSV('text,likes\nAlpha  post,40'));
  assert.equal(h.length, 3, 'same words (whitespace aside) is the same post');
  assert.equal(h.find(p => p.text === 'Alpha post').likes, 40, 'numbers update');
  const p1 = core.parsePasted('first pasted\n---\nsecond pasted'), p2 = core.parsePasted('third pasted');
  assert.equal(core.mergeHistory(core.mergeHistory([], p1), p2).length, 3);
  assert.notEqual(p1[0].id, p2[0].id);
  const t1 = core.parseTypefully([{ text: 'Draft without an id one' }]), t2 = core.parseTypefully([{ text: 'Draft without an id two' }]);
  assert.equal(core.mergeHistory(core.mergeHistory([], t1), t2).length, 2);
  assert.equal(core.parseTypefully([{ id: 7, text: 'Has an id' }])[0].id, 'tf-7');
});
test('imports: an id collision with different text keeps both', () => {
  const h = core.mergeHistory([{ id: 'csv-1', text: 'first text', likes: 1, reposts: 0, replies: 0, views: 0 }], [{ id: 'csv-1', text: 'other text', likes: 2, reposts: 0, replies: 0, views: 0 }]);
  assert.equal(h.length, 2); assert.deepEqual(h.map(p => p.id).sort(), ['csv-1', 'csv-1-2']);
  /* within one file too: identical rows share an id, different rows never do */
  const rows = core.parseCSV('text,likes\nsame row,1\nsame row,3\nanother row,2');
  assert.equal(rows[0].id, rows[1].id); assert.notEqual(rows[0].id, rows[2].id);
  const m = core.mergeHistory([], rows); assert.equal(m.length, 2); assert.equal(m.find(p => p.text === 'same row').likes, 3);
  /* an X post re-imported with different link text is still the same post */
  const x = core.mergeHistory([{ id: 'x-9', text: 'Hello world', likes: 5, reposts: 0, replies: 0, views: 0 }], [{ id: 'x-9', text: 'Hello world https://t.co/abc', likes: 9, reposts: 0, replies: 0, views: 0 }]);
  assert.equal(x.length, 1); assert.equal(x[0].likes, 9);
  /* an archive tweet without an id gets a content id, not "x-undefined" */
  const a = core.parseXArchive([{ name: 'tweets.js', text: 'window.YTD.tweets.part0 = [{"tweet":{"full_text":"no id here one"}},{"tweet":{"full_text":"no id here two"}}]' }]);
  assert.equal(new Set(a.posts.map(p => p.id)).size, 2); assert.ok(a.posts.every(p => !/undefined/.test(p.id)));
});

test('hook score: figures, not digit runs; comparisons are one idea; anti-gaming still holds', () => {
  const cpi = core.hookScore("CPI came in at 2.4% vs 2.6% expected. Here's what I'm watching:");
  assert.ok(cpi.score >= 70, `CPI line ${cpi.score}`); assert.doesNotMatch(cpi.reason, /Too many numbers/);
  const dense = core.hookScore('Q3 revenue $4.2M, up 31% YoY, margins 62%, churn 1.9%.');
  assert.ok(dense.score >= 60 && dense.score <= 75, `dense line ${dense.score}`);
  const macro = core.hookScore('CPI 3.1% vs 3.3% est. Core 3.8%. 10Y at 4.21%. Here is what moved:');
  assert.ok(macro.score >= 60 && macro.score <= 80, `macro ${macro.score}`);
  assert.ok(core.hookScore('Revenue went from $1.2M to $3.4M in 18 months. Here is how:').score >= 75);
  assert.ok(core.hookScore('7 secrets nobody tells you about 3 things that 10x your 5 habits:').score < 50);
  assert.ok(core.hookScore("asdf qwerty 99% of you won't read this:").score <= 30);
  assert.ok(core.hookScore('Stop doing X. Do Y instead.').score <= 40);
  assert.ok(core.hookScore('Double your price. Signups went up 31%.').score >= 75);
  assert.ok(core.hookScore('My BTC PnL this week: -4%. Here is why.').score >= 70);
});
test('hook score: lowercase crypto lines; "ngl" and "tbh" are soft words', () => {
  const ngl = core.hookScore('eth looking bullish into the weekend ngl'), plain = core.hookScore('eth looking bullish into the weekend');
  assert.ok(ngl.score < plain.score); assert.match(ngl.reason, /ngl/);
  assert.match(core.hookScore('pricing is the whole game tbh').reason, /tbh/);
  for (const l of ['gm. btc reclaimed 64k', 'funding flipped negative on most majors overnight']) { const h = core.hookScore(l); assert.ok(h.score >= 50 && h.score <= 80, `${l}: ${h.score}`); assert.doesNotMatch(h.reason, /read as words/); }
});

test('X character count: links need a real TLD boundary; flags and keycaps are one emoji', () => {
  assert.equal(core.xLength('I ship.Today'), 12);
  assert.equal(core.xLength('name.company'), 12);
  assert.equal(core.xLength('example.com'), 23);
  assert.equal(core.xLength('see x.com/abc.'), 27);
  assert.equal(core.xLength('mail me@name.com'), 16, 'an email is not a link');
  assert.equal(core.xLength('🇺🇸'), 2); assert.equal(core.xLength('🇺🇸🇯🇵'), 4);
  assert.equal(core.xLength('1️⃣'), 2); assert.equal(core.xLength('#️⃣ go'), 5);
});
test('checkPost counts like X (links 23, CJK 2) unless told otherwise', () => {
  const withLink = 'see https://example.com/' + 'a'.repeat(300) + ' bb';
  assert.ok(!core.checkPost(withLink).some(x => /over the/.test(x)), 'a long link is 23 on X');
  const cjk = '日'.repeat(180);
  assert.ok(core.checkPost(cjk).includes('80 characters over the 280 limit.'));
  assert.ok(!core.checkPost(cjk, { platform: 'linkedin', limit: 3000 }).some(x => /over the/.test(x)));
});

test('no slow regexes on 25k-character adversarial input', () => {
  const N = 25000, ms = f => { let best = Infinity; for (let k = 0; k < 3; k++) { const t = performance.now(); f(); best = Math.min(best, performance.now() - t); } return best; };
  const cases = {
    'visualPlan 1,1,1': () => core.visualPlan('1,'.repeat(N / 2)),
    'visualPlan 1111': () => core.visualPlan('1'.repeat(N)),
    'checkPost spaces': () => core.checkPost('a' + ' '.repeat(N) + 'b'),
    'checkPost spaces before Agree': () => core.checkPost(' '.repeat(N) + 'Agree x'),
    'xLength ab-ab': () => core.xLength('ab-'.repeat(N / 3)),
    'xLength a.a.a': () => core.xLength('a.'.repeat(N / 2)),
    'hookScore X X X': () => core.hookScore('X '.repeat(N / 2)),
    'hookScore 1,1,1': () => core.hookScore('1,'.repeat(N / 2) + ' vs 2')
  };
  for (const [name, f] of Object.entries(cases)) { const t = ms(f); assert.ok(t < 50, `${name} took ${t.toFixed(1)}ms`); }
  assert.ok(core.checkPost('So true. Let that sink in.').some(x => /sink in/.test(x)), 'the rules still fire');
  assert.ok(core.checkPost('We shipped it. Thoughts?').some(x => /bait/.test(x)));
});

test('a date-only CSV date is local midnight; full timestamps are kept as given', () => {
  const tz = process.env.TZ; process.env.TZ = 'America/New_York';
  try {
    const p = core.normPost({ text: 'dated post', at: '2026-01-01' }), d = new Date(p.at);
    assert.deepEqual([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getDay()], [2026, 0, 1, 0, 4]);
    assert.equal(core.normPost({ text: 'dated post', at: '2026-01-01T15:00:00Z' }).at, Date.parse('2026-01-01T15:00:00Z'));
    assert.equal(core.parseCSV('text,date\nfrom a csv,2026-03-10\n')[0].at, new Date(2026, 2, 10).getTime());
  } finally { if (tz === undefined) delete process.env.TZ; else process.env.TZ = tz; }
});
