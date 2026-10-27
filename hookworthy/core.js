/* Hookworthy core: the parts that run the same in the browser, the server and the MCP server.
   Hook scoring, pre-post rules, importers (X archive, CSV, Typefully, pasted text),
   history analytics (voice stats, best times, hook calibration) and the prompts sent to Claude.
   No DOM, no network. Loaded as a classic script (window.HWCore) or with require(). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HWCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /* ---------------- small text helpers ---------------- */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
  const STOP = new Set(("a an the and or but so to of in on for with at by from is are was were be been being it its it's this that these those i me my we our you your he she they them their his her what which who whom when where why how all any both each few more most other some such no nor not only own same than too very can will just don should now do does did have has had having if then else about into over after before under again further once here there out up down off am im i'm i've i'd i'll get got like one also would could really even much many make made go going know think thing things way people time day year").split(' '));
  const words = t => (String(t).toLowerCase().match(/[a-z][a-z’'-]+/g) || []);
  const median = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const hashStr = s => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  const EMOJI = /\p{Extended_Pictographic}/gu;

  /* ---------------- X's character count ----------------
     X counts every link as 23, emoji as 2, and CJK and most non-Latin scripts as 2 per character. */
  /* a bare domain starts at a word edge (not mid-label, not after "@" or "."), so the scan stays linear on long
     runs like "ab-ab-ab…", and the TLD must end there: "ship.Today" and "name.company" are not links */
  const URL_RX = /\bhttps?:\/\/\S+|(?<![\w.@/-])(?:[a-z0-9-]+\.)+(?:com|io|xyz|co|ai|app|dev|so|gg|me|org|net|ly|to)(?![a-z0-9-])(?:\/\S*)?/gi;
  /* one emoji, X counts 2: pictographs (with skin tones and ZWJ joins), flags (two regional indicators) and keycaps */
  const EMOJI_G = /\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20E3/u;
  const light = cp => cp <= 4351 || (cp >= 8192 && cp <= 8205) || (cp >= 8208 && cp <= 8223) || (cp >= 8242 && cp <= 8247);
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  function xLength(text) {
    let n = 0; const t = String(text || '').replace(URL_RX, () => { n += 23; return ''; });
    const gs = seg ? [...seg.segment(t)].map(x => x.segment) : (t.match(/\p{Regional_Indicator}{2}|[0-9#*]\uFE0F?\u20E3|[\s\S]/gu) || []);
    for (const g of gs) { if (EMOJI_G.test(g)) { n += 2; continue; } for (const ch of g) { const cp = ch.codePointAt(0); if (cp >= 0xFE00 && cp <= 0xFE0F || cp === 0x200D) continue; n += light(cp) ? 1 : 2; } }
    return n;
  }

  /* ---------------- links in a post ----------------
     What a link card can say before anything is fetched: the site, what kind of page it is, and a title read
     from the path. The same reading runs in the composer, the previews and the server's unfurl. */
  const LK_TRAIL = /[.,!?;:'"’”…]+$/;
  const LK_KNOWN = { 'substack.com': 'Substack', 'medium.com': 'Medium', 'linkedin.com': 'LinkedIn', 'threads.net': 'Threads', 'threads.com': 'Threads', 'bsky.app': 'Bluesky', 'tradingview.com': 'TradingView', 'coingecko.com': 'CoinGecko', 'coinmarketcap.com': 'CoinMarketCap', 'etherscan.io': 'Etherscan', 'solscan.io': 'Solscan', 'dune.com': 'Dune', 'defillama.com': 'DefiLlama', 'binance.com': 'Binance', 'coinbase.com': 'Coinbase', 'kraken.com': 'Kraken', 'bloomberg.com': 'Bloomberg', 'reuters.com': 'Reuters', 'ft.com': 'Financial Times', 'wsj.com': 'The Wall Street Journal', 'nytimes.com': 'The New York Times', 'coindesk.com': 'CoinDesk', 'theblock.co': 'The Block', 'reddit.com': 'Reddit', 'notion.site': 'Notion', 'producthunt.com': 'Product Hunt', 'news.ycombinator.com': 'Hacker News', 'wikipedia.org': 'Wikipedia', 'spotify.com': 'Spotify', 'gumroad.com': 'Gumroad', 'beehiiv.com': 'beehiiv', 'loom.com': 'Loom', 'figma.com': 'Figma', 'vimeo.com': 'Vimeo' };
  const X_RESERVED = new Set(['home', 'explore', 'search', 'i', 'settings', 'notifications', 'messages', 'hashtag', 'intent', 'share', 'compose', 'login', 'signup', 'tos', 'privacy']);
  /* every link in a text, in order, without the sentence punctuation stuck to its end */
  function linkFind(text) {
    const s = String(text || ''), out = [];
    for (const m of s.matchAll(URL_RX)) {
      let u = m[0].replace(LK_TRAIL, '');
      /* a closing bracket belongs to the link only when the link opened one: "(see x.com/a)" vs "wiki/Foo_(bar)" */
      while (/[)\]]$/.test(u) && (u.match(/[([]/g) || []).length < (u.match(/[)\]]/g) || []).length) u = u.slice(0, -1).replace(LK_TRAIL, '');
      if (u) out.push({ url: u, at: m.index });
    }
    return out;
  }
  const lkWords = seg => { let s = seg.replace(/\.(html?|php|aspx?|jsp|md)$/i, '').replace(/^(?=[A-Za-z]*\d)[A-Za-z0-9]{5,12}-(?=[A-Za-z])/, '').replace(/[-_+]+/g, ' ').replace(/\s+/g, ' ').trim(); if (!s) return ''; if (s === s.toLowerCase()) s = (s[0].toUpperCase() + s.slice(1)).replace(/\bi(?=\b|[’'])/g, 'I'); return s.length > 90 ? s.slice(0, 89).replace(/\s+\S*$/, '') + '…' : s; };
  /* the link read on its own: { url, domain, site, kind: 'post' | 'profile' | 'video' | 'repo' | 'link', title, handle?, id? } */
  function linkGuess(raw) {
    let u; try { u = new URL(/^https?:\/\//i.test(String(raw)) ? String(raw) : 'https://' + raw); } catch (e) { return null; }
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) return null;
    const host = u.hostname.toLowerCase().replace(/^(www|m|mobile)\./, '');
    const segs = u.pathname.split('/').filter(Boolean).map(s => { try { return decodeURIComponent(s); } catch (e) { return s; } });
    const base = { url: u.href, domain: host, site: null, kind: 'link', title: '' };
    if (/^(x|twitter)\.com$/.test(host)) {
      const h = segs[0] && /^\w{1,15}$/.test(segs[0]) && !X_RESERVED.has(segs[0].toLowerCase()) ? segs[0] : null;
      if (h && segs[1] === 'status' && /^\d{5,25}$/.test(segs[2] || '')) return { ...base, domain: 'x.com', site: 'X', kind: 'post', handle: h, id: segs[2], title: `Post by @${h}` };
      if (h && segs.length === 1) return { ...base, domain: 'x.com', site: 'X', kind: 'profile', handle: h, title: `@${h} on X` };
      return { ...base, domain: 'x.com', site: 'X', title: 'X' };
    }
    let yt = null;
    if (host === 'youtu.be') yt = segs[0]; else if (/(^|\.)youtube\.com$/.test(host)) yt = u.searchParams.get('v') || (/^(shorts|live|embed)$/.test(segs[0] || '') ? segs[1] : null);
    if (yt && /^[\w-]{11}$/.test(yt)) return { ...base, domain: 'youtube.com', site: 'YouTube', kind: 'video', id: yt, short: segs[0] === 'shorts', title: segs[0] === 'shorts' ? 'YouTube Short' : 'YouTube video' };
    if (host === 'github.com' && segs[0]) {
      const sub = segs[2] === 'pull' && segs[3] ? `Pull request #${segs[3]}` : segs[2] === 'issues' && segs[3] ? `Issue #${segs[3]}` : segs[2] === 'releases' ? 'Releases' : '';
      return { ...base, site: 'GitHub', kind: segs[1] ? 'repo' : 'profile', title: segs.slice(0, 2).join('/') + (sub ? ` · ${sub}` : '') };
    }
    const site = LK_KNOWN[host] || LK_KNOWN[host.split('.').slice(-2).join('.')] || null;
    /* the title: the last part of the path that reads like words, skipping ids and hashes */
    const wordy = segs.filter(s => !/^[\w-]{0,3}$/.test(s) && !/^[0-9a-f-]{8,}$/i.test(s) && !/^\d+$/.test(s) && /[a-z]{3}/i.test(s));
    const title = lkWords(wordy[wordy.length - 1] || '') || site || host;
    return { ...base, site, title };
  }
  /* how platforms print a link in the text: no scheme, no www, cut with an ellipsis */
  function linkShow(raw, max = 26) {
    const s = String(raw || '').replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');
    return s.length > max ? s.slice(0, max - 1) + '…' : s;
  }
  const LINKS = { find: linkFind, guess: linkGuess, show: linkShow, RX: URL_RX };

  /* ---------------- hook score ----------------
     A transparent heuristic: five parts, each explainable in one sentence.
     calibrate() below checks it against the author's own results. */
  /* one figure: "2.4%", "$1.2M", "64k", "10x", "1,200". Never starts mid-number (keeps long digit runs linear). */
  const FIG = /(?<![\w.,])\$?\d+(?:[.,]\d+)*(?:\s?[%kKmMbB]|x\b)?/g;
  const FIG_VS = new RegExp(`(${FIG.source})\\s*(?:vs\\.?|versus)\\s*${FIG.source}`, 'gi');
  /* ---------------- soft words (round 74) ----------------
     What the wavy line marks and Sharpen cuts first. One table for the marks, the cut, the score's reason and the
     tooltips, so a word is never flagged for one reason and cut for another. Whole warm-ups come first and go as one
     piece ("just wanted to share that" is one cut, not a stray "that" left behind). why: the reason, said the way one
     writer tells another; short: the same, small enough for the score's one-line reason. */
  const RXC = new Map(), rx = (src, flags) => { const k = flags + '\u0000' + src; let r = RXC.get(k); if (!r) RXC.set(k, r = new RegExp(src, flags)); r.lastIndex = 0; return r; };
  const gFlags = f => f.includes('g') ? f : f + 'g';
  const S0 = '(?:^|(?<=[.!?:]\\s{1,3}))';
  /* r86: "just" before a past-tense verb means "recently" ("btc just reclaimed 68k", "just shipped v2"): news, not filler */
  const JUST_PAST = String.raw`(?:(?!(?:n|f|sp|s|bl|proc|succ|exc|br|h|w)eed\b|red\b|bed\b|shed\b)[a-z]{2,}ed\b|(?:hit|got|made|won|lost|sold|bought|ran|broke|began|put|cut|set|quit|left|found|wrote|built|sent|paid|spent|took|came|went|saw|told|said|heard|did|had|became|fell|grew|rose|drew|shut|led|met|threw|woke|stole|sank|swam|beat|forgot|flew|gave|wore|won|ate|drank|bit|hung|slept|kept|felt|meant|shot|struck|swore|tore|spoke)\b)`;
  const SOFT = [
    { k: 'announce', re: new RegExp(`${S0}(?:(?:i|we)(?:['’]m|['’]re| am| are) )?(?:so |super |really |very |beyond )?(?:excited|thrilled|happy|proud|pleased|humbled|delighted|stoked|pumped) to (?:finally )?(?:announce|share|say|tell you|let you know|introduce)(?: that)?`, 'gi'),
      why: 'Announcing the announcement. Lead with the news itself: what you did shows the excitement better than saying it.', short: 'announces the news instead of saying it' },
    { k: 'announce', re: new RegExp(`${S0}(?:(?:in )?(?:today['’]s|this week['’]s|this) (?:issue|newsletter|edition|post|thread|episode|video)[,:]?\\s+|(?:today|this week|real quick),? )?(?:(?:i|we) )?(?:just )?(?:wanted|want|would like|['’]d like|thought i['’]?d|am going|['’]m going) to (?:quickly )?(?:share|say|announce|let (?:you|everyone|y['’]all|you all) know|talk about|write about|post about|give (?:a quick |an |a )update on)(?: (?:that|some (?:quick )?thoughts on|a few thoughts on|my thoughts on|some thoughts about))?\\b`, 'gi'),
      why: 'Announcing the announcement. Lead with the news itself: what you did shows the excitement better than saying it.', short: 'announces the post instead of starting it' },
    { k: 'label', re: new RegExp(`${S0}(?:quick (?:thought|reminder|update|psa|take|question|one|tip|note)(?: that)?|(?:friendly )?reminder that|psa|til(?: that)?|fun fact|real talk|food for thought|hot take|unpopular opinion|pro tip|life hack|heads up|(?:some|a few|quick|random) (?:thoughts|notes) on(?= \\S)|(?:here(?: is|['’]s) )?a (?:quick |short |mini |little )?thread (?:on|about)(?= \\S)|new (?:post|issue|episode|video|essay|article|blog post|thread|drop|podcast(?: episode)?)(?=:\\s*\\S)|(?:in )?(?:this week['’]s|today['’]s|this|the latest|our latest|my latest) (?:issue|edition|newsletter|episode)(?=:)|our new (?:case study|post|guide|report|article|video|episode|podcast|course) is (?:live|out|up|here)(?=[:!—-])|(?:(?:ok(?:ay)?,? )?so )?(?:here['’]s|here is) my (?:honest |hot |quick |unpopular |real )?(?:take|thoughts?|two cents|read) on [^.!?:\\n]{2,40}[a-z0-9](?=[.:]\\s+\\S))\\b[:,.!—-]*`, 'gi'),
      why: 'A label, not a line. Delete it and the post starts where your point does.', short: 'is a label, not the point' },
    { k: 'disclaim', re: new RegExp(`${S0}(?:(?:this is )?not financial advice|nfa|(?:i['’]m|i am) (?:not an|no) expert|this (?:might|may|could|will) be (?:controversial|unpopular|a hot take)|(?:idk|i don['’]t know) who needs to hear this|not sure if (?:this makes sense|anyone cares|this is useful))\\b,?(?: but\\b)?[:,.!—-]*`, 'gi'),
      why: 'A disclaimer up front tells people to trust the next words less. If it has to be said, say it at the end.', short: 'tells people to trust what follows less' },
    { k: 'stock', re: /\bin today['’]s (?:fast[- ]paced|competitive|digital|ever[- ]changing|modern|busy|crowded|noisy|always[- ]on) (?:world|landscape|market|economy|environment|climate|age|era)\b,?|\bat the end of the day\b,?|\bit goes without saying(?: that)?\b,?|\bneedless to say\b,?|\bwithout further ado\b,?/gi,
      why: 'A stock phrase. Readers have seen it so often their eyes skip it, and the line along with it.', short: 'is a phrase readers skip on sight' },
    { k: 'throat', re: /\bafter (?:a lot of|lots of|much|weeks of|months of) (?:back and forth|deliberation|thought|thinking|consideration|discussion)\b,?|(?:^|(?<=^(?:(?:ok(?:ay)?,?\s+)?so|well|ok(?:ay)?)[,.!]?\s+))(?:i|we)(?:['’]ve| have) been thinking (?:about (?:this|it) )?(?:a lot |so much )?(?:about (?:this|it) )?(?:lately |recently )?(?:and )?(?=(?:the|i|we|most|my|our)\b)|^(?:(?:i|we)(?:['’]m|['’]re| am| are) )?(?:so |super |really )?(?:excited|thrilled|honou?red|proud|pumped|stoked|humbled|happy) to be (?=\w+ing\b)/gi,
      why: 'Backstory before the point. Say the decision first; how you got there can be the second line.', short: 'is backstory before the point' },
    { k: 'open', re: /^\s*(?:(?:ok(?:ay)?,?\s+)?so(?! (?:what|far|much|many|long|good|bad|true|close|yeah|cool)\b)|well(?! (?:done|said|known|made|paid|played|over|worth|before|after)\b)|hey(?: (?:everyone|guys|all|y['’]all|friends|fam|folks|team))?|hi(?: (?:everyone|all|friends|folks))?|hello(?: (?:everyone|all))?|guys|(?:look|listen)(?=[,.!:—]| (?:i|we|you|guys|people|man|y['’]all)\b)|anyway|ok(?:ay)?|alright)\b[,.!:]*(?=\s)/gi,
      why: 'A warm-up word. Readers decide in the first few words, so don’t spend one clearing your throat.', short: 'spends your first word on a warm-up' },
    { k: 'feel', re: /,?[ \t]?(?:(?:pretty|really|so|super|very) )?(?:happy|stoked|pumped|excited|proud|thrilled) (?:with|about) (?:it|this|that|this one|how it turned out)\b[.!]*(?=[ \t]*(?:\n|$))|,?[ \t]?wish me luck\b[.!]*(?=[ \t]*(?:\n|$))/gi,
      why: 'Telling them how to feel about it. The result already says that, so end on the result.', short: 'tells them how to feel instead of showing it' },
    { k: 'opinion', re: /(?<!\bas an? [^,.!?]{2,40},\s?)\b(?:i (?:really |personally |honestly |just |actually |genuinely |truly |firmly |strongly |do |kind of |kinda |sort of )?(?:think|feel like|believe|guess|reckon|feel that)(?: that)?(?! (?:about|of|through|back|so|twice|again|too|in)\b)|in my (?:humble )?opinion|imo|imho)\b,?/gi,
      why: 'Your name is on the post, so it’s already your opinion. Saying so just hands readers a reason to doubt it.', short: 'hedges a claim that’s already yours' },
    { k: 'honest', re: /\b(?:honestly|to be honest|tbh|ngl|not gonna lie|if i['’]m (?:being )?honest|truthfully|frankly)\b,?/gi,
      why: 'It hints the rest might not be honest. Lines that land never announce their honesty.', short: 'hints the rest might not be honest' },
    { k: 'intens', re: /(?<!\b(?:really|very|so|super),?\s)\b(?:really|very|quite|somewhat|pretty much|extremely|incredibly|totally)\b(?!,?\s(?:really|very|so|super)\b)/gi,
      why: 'An intensifier propping up a weaker word. Cut it, or trade the pair for one sharp word: “very tired” → “exhausted”.', short: 'props up the word next to it' },
    { k: 'filler', re: new RegExp(String.raw`\b(?:(?<!\b(?:not|only|is it|it['’]s|it is|that['’]s|that is|i['’]m|you['’]re) )just(?! (?:\$?\d|one\b|two\b|a few\b|now\b|in case\b|as\b|like\b|because\b|enough\b|in time\b|me\b|(?:can['’]?t|cannot|couldn['’]?t|won['’]?t|don['’]?t|didn['’]?t)\b|${JUST_PAST}))|(?<!\b(?:what|who|which|that|you['’]re|you are) )actually(?! (?:liked?|loved?|prefer(?:red|s)?|matters?|works?|worked|happened|need(?:ed|s)?|want(?:ed|s)?|read|use[ds]?|cares?|cared)\b)|basically|literally|simply|essentially|officially(?= (?:launched|shipped|released|opened|joined|started|hit|crossed|signed|live|out)\b))\b`, 'gi'),
      why: 'Talking filler. Out loud it buys you a second; in the feed it costs you one.', short: 'is filler from talking out loud' },
    { k: 'hedge', re: /\b(?:(?:maybe|perhaps|probably)(?! (?:i|i['’]m|i am|i['’]ll|we|we['’]re|you|you['’]re|it|it['’]s|not|they|he|she|this|that|the real)\b)|(?<!\b(?:what|which|this|that|the|a|any|some|every|one|same|different|other|right|wrong) )(?:kind|sort) of(?! a (?:big deal|thing|mess|legend|genius|joke|vibe)\b)|kinda|sorta)\b/gi,
      why: 'A hedge. If you’d post it, you mean it. Commit here, and defend it in the replies.', short: 'hedges the claim' },
    { k: 'likeNum', re: /(?<=\b(?:for|in|took|took me|after|lost|made|spent|ran|did|got|hit|of|at|around|with|was|is|are|were|had|have|about|over|only) )like(?= (?:\$?\d|a (?:year|month|week|day|hundred|thousand|million)\b|one |two |three |four |five |six |seven |eight |nine |ten |twenty |fifty |a hundred ))/gi,
      why: '“Like” blurs your own number. If it was 5 years, say 5 years: exact reads as true.', short: 'blurs your own number' },
    { k: 'tail', re: /[ \t]?\b(?:lol|lmao|lmfao|haha+|hehe|smh)\b[.!]*(?=[ \t]*(?:\n|$))/gi,
      why: 'A nervous laugh at the end takes the weight off the line. Let it land.', short: 'takes the weight off the line' }
  ];
  /* r86: a price call's hedge is the writer's stance, not filler. "i think eth goes to 5k" without "i think" is a
     certainty they never posted, so on a call the opinion words and hedges stay, for the site and the app alike */
  const ST_FORE = /\b(?:will|won['’]t|going to|gonna|go(?:es)? to|to \$?\d[\d,.]*k?|pulls? back|dips?|rips?|pumps?|dumps?|moons?|sends?|breaks? (?:out|down)|bottom(?:ed|s)?|top(?:ped|s)?|targets?|hits?|flip(?:s|ping|ped)?|sees?|reclaims?|retests?|eoy|eow|undervalued|overvalued|higher|lower|(?:get|gets|be) cut|rate cuts?|still early|breakout|reset|consolidat\w*|accumulat\w*|bull(?:ish)?|bear(?:ish)?|rally|crash|correction|squeeze|the (?:top|bottom) is in|by (?:eoy|summer|march|june|december|q\d|the halving))\b/i;
  const ST_ASSET = /\$[a-z]{2,10}\b|\b(?:btc|eth|sol|bitcoin|ethereum|solana|xrp|doge|bnb|avax|link|spx|spy|qqq|nvda|tsla|gold|silver|oil|rates|the fed|alts?|altcoins?|memecoins?|stocks?|the market|crypto|nasdaq|s&p)\b|\b\d+(?:\.\d+)?k\b/i;
  const isCall = t => ST_FORE.test(t) && ST_ASSET.test(t);
  function stanceKeep(text) {
    const t = String(text || ''); if (!isCall(t)) return [];
    const out = []; SOFT.filter(s => s.k === 'opinion' || s.k === 'hedge').forEach(s => { for (const m of t.matchAll(rx(s.re.source, gFlags(s.re.flags)))) { const w = m[0].replace(/[,\s]+$/, ''); if (w && !out.includes(w)) out.push(w); } });
    return out;
  }
  /* where the soft words are: [start, end, why, kind], first match wins, no overlaps; keep: words this voice puts back */
  const softKept = (frag, keep) => !!keep && keep.length > 0 && keep.map(k => String(k).toLowerCase()).includes(String(frag).toLowerCase().replace(/[,:.!\s]+$/, '').trim());
  function softMarks(text, keep) {
    const t = String(text || ''), out = []; keep = [...(keep || []), ...stanceKeep(t)];
    SOFT.forEach(s => { const re = rx(s.re.source, gFlags(s.re.flags)); let x; while ((x = re.exec(t))) { if (!x[0].trim()) { re.lastIndex++; continue; } const lead = x[0].search(/[^\s,:;.—-]/); if (lead < 0) continue; const a = x.index + lead, b = x.index + x[0].replace(/[\s,:;.!—-]+$/, '').length; if (b > a) out.push([a, b, s.why, s.k]); } });
    /* earliest first, and of two that start together the longer one, so a whole warm-up wins over a word inside it */
    out.sort((a, b) => a[0] - b[0] || (b[1] - b[0]) - (a[1] - a[0]));
    const keepOut = []; out.forEach(r => { const q = keepOut[keepOut.length - 1]; if (!q || r[0] >= q[1]) keepOut.push(r); });
    return keepOut.filter(r => !softKept(t.slice(r[0], r[1]), keep));
  }
  /* the soft words out, nothing else changed. Returns { s, cut: [the words cut, as written] } */
  function softCut(line, keep) {
    let s = String(line || ''); const cut = [], kinds = []; keep = [...(keep || []), ...stanceKeep(s)];
    for (let pass = 0; pass < 2; pass++) SOFT.forEach(({ re, k }) => { s = s.replace(rx(re.source + '[,:?]?[ \\t]*', gFlags(re.flags)), m => { if (softKept(m, keep) || !m.trim()) return m; cut.push(m.replace(/^[\s,]+|[\s,:.!—-]+$/g, '')); kinds.push(k); return ''; }); });
    s = s.replace(/^(\s*)that\s+(?=(?:i|we|my|our|the|this|it|you|your|a|an|they|he|she)\b)/i, '$1');
    s = s.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+([,.!?;:])/g, '$1').replace(/^[,;:.!?\s]+/, '').replace(/([.!?])[,;:]+/g, '$1').trim();
    const up = /^\P{L}*\p{Lu}/u.test(String(line || '')); if (cut.length && up) s = cap(s);
    return { s, cut, kinds };
  }
  const softWhy = w => { const lc = String(w || '').toLowerCase(); const s = SOFT.find(x => rx(`^(?:${x.re.source})$`, x.re.flags.replace('g', '')).test(lc)); return s || null; };
  function hookScore(raw) {
    const text = (raw || '').trim();
    const zero = { clarity: 0, curiosity: 0, specificity: 0, tension: 0, brevity: 0 };
    if (!text) return { score: 0, parts: zero, reason: 'Nothing to read yet. Your first line is the hook.', tone: 'none', step: 'Write your first line', why: 'It’s the hook.', fix: null };
    const lines = String(text).replace(/https?:\/\/\S+/g, 'link').split(/\n/).map(l => l.trim()).filter(Boolean); let first = lines[0]; if (first.length < 40 && lines[1]) first += ' ' + lines[1];
    const lc = first.toLowerCase(); const len = first.length;
    let clarity = 72, curiosity = 30, spec = 25, tension = 30, brevity;
    brevity = len < 22 ? 80 : len <= 100 ? 96 - Math.max(0, len - 70) * .35 : Math.max(12, 86 - (len - 100) * .55);
    const fillers = lc.match(/\b(really|very|just|basically|actually|literally|kind of|sort of|kinda|sorta|i think|maybe|perhaps|somewhat|quite|honestly|tbh|ngl|i['’]m not an expert|i['’]m no expert|who needs to hear this|this might be controversial)\b/g) || [];
    const lcT = lc.replace(/\b(i['’]m not an expert|i['’]m no expert|not financial advice|(?:idk|i don['’]t know) who needs to hear this)\b/g, ' ');
    clarity -= Math.max(fillers.length, softMarks(first).filter(r => r[0] > 1 || !['announce', 'label', 'disclaim', 'stock', 'throat', 'open'].includes(r[3])).length) * 14 + Math.min(2, (lc.match(/\b(?:unlock\w*|leverag\w*|supercharg\w*|elevat(?:e|es|ed|ing)|seamless\w*|game[- ]?changer|delv(?:e|es|ed|ing))\b/g) || []).length) * 12;
    const warm0 = lc.match(/^(so|hey|hi|hello|ok|okay|well|guys)\b|^here (?:are|is|['’]s) (?=\d|three |four |five |six |seven |eight |nine |ten |a (?:quick |short )?thread\b)/);
    /* r74: an announcement, a label or a disclaimer up front is a warm-up too ("Excited to announce that…", "Quick thought:") */
    const lead0 = softMarks(first).find(r => r[0] <= 1 && ['announce', 'label', 'disclaim', 'stock', 'throat'].includes(r[3]));
    const warm = warm0 || (lead0 ? [first.slice(lead0[0], lead0[1])] : null), warmS = lead0 ? SOFT.find(s => s.k === lead0[3]) : null;
    if (warm) clarity -= 18;
    if (/^(i think|in my opinion|i feel like)/.test(lc)) clarity -= 10;
    if (/[.!?:]$|↓|👇/.test(first)) clarity += 8;
    const imperative = /^(stop|start|quit|double|charge|raise|cut|ship|write|build|never|don[’']?t|forget|ignore|delete|kill|hire|ask|steal|try|drop|take|sell|buy|size|journal|reply|wait|protect|skip|trust|scale|keep|move|post|read|learn|pick|set)\b/.test(lc) && !/^(take|keep|move|post|read|set|pick|learn) (a |the )?(look|break|day|while)\b/.test(lc);
    if (imperative) clarity += 6;
    const cur = lc.match(/\b(nobody|no one|secret|mistake|wrong|why|how|learned|taught|truth|stop|never|most people|here[’']?s|finally|until|almost|wish i|what happened|what changed|the one)\b/g) || [];
    curiosity += Math.min(3, cur.length) * 18;
    if (/[:…]\s*$|\.\.\.|↓|👇|🧵|\(thread\)/.test(first)) curiosity += 14;
    if (/\?\s*$/.test(first)) curiosity += 10;
    /* r74: "Why we stopped cold calls." as the whole post is a title that promises a reason and never gives it: no credit for the "why" */
    if (lines.length === 1 && !/\blink\b|(?<![\w.@/-])(?:[a-z0-9-]+\.)+(?:com|io|xyz|co|ai|app|dev|so|gg|me|org|net|ly|to)(?![a-z0-9-])/i.test(first) && /^(?:why|how|what) (?:[^?.!:]|\.(?=\S)){8,}$/i.test(first.replace(/[.:!…]+$/, ''))) curiosity -= 18;
    if (!fillers.length && len < 90 && /\.$/.test(first)) curiosity += 8;
    if (/\d/.test(first)) spec += 34;
    if (/[$€£%×]|\b\d+x\b|\b\d+k\b/i.test(first)) spec += 14;
    if (/\b(i|my|we|our)\b/.test(lc)) spec += 10;
    if (/\b(you|your)\b/.test(lc)) spec += 8;
    spec += Math.min(2, (first.slice(1).match(/\b[A-Z][a-z]{2,}/g) || []).length) * 5;
    /* structure, the moves editors use on openers: ask then answer, a contrast in two beats, the number up front, a turn
       ("Then I…"), a reveal after a colon. Each is worth something only once, and only in a short first line */
    const beats = first.split(/(?<=[.!?])\s+(?=\S)/).filter(Boolean);
    if (len <= 120) {
      if (/^[^?]{4,80}\?\s+[^?]{2,70}$/.test(first) && beats.length <= 3) { curiosity += 16; clarity += 4; if ((first.split('?')[1].match(/\S+/g) || []).length <= 5) curiosity += 6; }
      if (beats.length >= 2 && beats.length <= 3) { const ng = beats.map(b => /\b(?:\w+n['’]t|not|never|no|nobody|none)\b/i.test(b)); if (ng.some(Boolean) && ng.some(v => !v)) tension += 14; else if (/^(most|everyone|nobody)\b/i.test(beats[0]) && /^(i|we|the ones|winners|pros)\b/i.test(beats[1])) tension += 14; }
      if (beats.length >= 2 && /^(then|now|until|so|but|that['’]s when)\b/i.test(beats[1] || '')) curiosity += 8;
      if (/^\P{L}{0,2}(?:\S+\s){0,2}\$?\d/u.test(first)) spec += 8;
      if (/^[^:?]{6,60}:\s+\S.{2,70}[.!]$/.test(first)) curiosity += 8;
    }
    const ten = lcT.match(/\b(unpopular|overrated|underrated|wrong|myth|lie|stop|don[’']?t|backwards|nobody|hot take|instead|not|never|quit|fired|failed|broke|lost|hate|cop-out|hedge)\b/g) || [];
    tension += Math.min(3, ten.length) * 17 + (imperative ? 20 : 0);
    /* guards against gaming: unfilled blanks, keyboard mash, stacked bait phrases and number stuffing */
    /* blanks: [brackets], {braces}, ___ and TK; a lone X only counts when a Y placeholder sits beside it ("Stop X. Do Y."), so "grow on X" is just X */
    const xAt = first.search(/\bX\b/);
    const blank = /\[[^\]]+\]|\{[^}]+\}|_{3,}|\bTK\b/.test(first) || (xAt >= 0 && /\bY\b/.test(first.slice(xAt)));
    /* words in any script; Chinese, Japanese and Korean run together, so every two characters count as a word there */
    const cjkN = (first.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu) || []).length;
    const toks = [...(first.replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]+/gu, ' ').match(/\p{L}{3,}/gu) || []), ...Array(Math.floor(cjkN / 2)).fill('字字')];
    /* tickers, acronyms and chat shorthand (BTC, PnL, tbh, nfts) are words, not mash: only lowercase vowel-less runs of 4+ count, minus a known list */
    const SHORT_OK = /^(btc|eth|sol|nfts?|pnl|tbh|imo|imho|ngl|dca|tvl|cpi|ppi|fomc|gm|gn|ath|atl|rsi|dma|ema|sma|lfg|wagmi|ngmi|wtf|smh|brb|ltv|cltv|mrr|arr|cac|kpis?|ctr|crm|cms|dms?|pfp|yolo|hmm+|psst|shh+|grr+|tsk|nth|rhythms?|crypts?|lynch|nymphs?|psych|spry|sync|synth|myth|lymph|gym|hymn|tryst|dryly|shyly|slyly|why|fly|cry|dry|try|sky|spy|sly|shy|pry|ply)$/i;
    const mash = toks.filter(w => /^(asdf|qwer|zxcv|sdfg|hjkl|uiop|lorem|ipsum|blah)/i.test(w) || /[bcdfghjklmnpqrstvwxz]{6,}/i.test(w) || (w.length >= 4 && w === w.toLowerCase() && !/[aeiouy]/.test(w) && !SHORT_OK.test(w))).length;
    const gib = toks.length ? mash / toks.length : 1;
    const bait = (lc.match(/\b(\d+% of (you|people)|won[’']?t (read|believe|see)|nobody (tells|talks)|secrets?|10x your|game[- ]?changer|you need to see|read (this|till the end)|bookmark this|thank me later|this will change|most people (don[’']?t|won[’']?t|will never)|nobody(?: is|['’]s) talking|stop scrolling|change your life|breaking|unpopular opinion|hot take)\b/g) || []).length + (/\b(agree|thoughts|am i wrong)\s*\?\s*$/i.test(text.trim()) ? 1 : 0) + ((first.match(/\p{Extended_Pictographic}/gu) || []).length >= 3 ? 1 : 0);
    const short = toks.length < 3 && !/\d/.test(first);
    /* number stuffing: count figures, not digit runs ("2.4%", "$1.2M", "64k" and "10x" are one each), a
       comparison ("2.4% vs 2.6%") is one idea, and only 4+ distinct figures cost anything, capped so a dense
       but clear macro line ("CPI 3.1% vs 3.3% est. Core 3.8%. 10Y 4.21%. 2Y 4.6%.") can still do well */
    const figs = new Set((first.replace(FIG_VS, '$1').match(FIG) || []).map(f => f.replace(/\s/g, '').toLowerCase()));
    const nums = figs.size, over = Math.max(0, nums - 3);
    if (over) spec -= Math.min(30, 12 * over);
    const c = v => clamp(Math.round(v), 4, 99);
    const parts = { clarity: c(clarity), curiosity: c(curiosity), specificity: c(spec), tension: c(tension), brevity: c(brevity) };
    const raw0 = parts.clarity * .22 + parts.curiosity * .24 + parts.specificity * .2 + parts.tension * .18 + parts.brevity * .16;
    let score = c(raw0 * 1.35 - 10);
    if (bait) score = c(score - (bait > 1 ? 14 * Math.min(3, bait) + 10 : 8));
    if (over) score = c(score - Math.min(12, 6 * over));
    const noWords = !toks.length && !/\d/.test(first);
    if (gib > .25 || noWords) score = Math.min(score, 30);
    else if (short) score = Math.min(score, 50);
    if (blank) score = Math.min(score, 40);
    /* reason: one plain sentence. step: the one next move, as an instruction ("Cut “i think”"). why: half a sentence on why.
       fix: for a cut that can be tried right here (a hedge, a warm-up), what the line would read without it, so hookNext can say where it lands */
    let reason, tone, step, why, fix = null;
    const drop = re => String(text).replace(re, ' ').replace(/[ \t]{2,}/g, ' ').replace(/^\s*[,.;:]\s*/, '').replace(/\s+([,.;:!?])/g, '$1').trim();
    /* r74: the reasons name the exact words and teach the move, the way one writer tells another. No invented numbers */
    const figAt = (() => { const m = first.match(/(?<![\w.,])\$?\d[\d,.]*(?:\s?[%kKmMbBx]\b|%)?/); if (!m) return null; return { fig: m[0].trim(), n: (first.slice(0, m.index).match(/\S+/g) || []).length }; })();
    const passive = first.match(/\b(?:was|were|has been|have been|is being|are being|got) ((?:\w+ed)|built|made|cut|done|run|shipped|written|rewritten|redone|grown) by\b/i);
    const vague = first.match(/\b(a lot of|lots of|tons of|so many|a bunch of|countless|a ton of)\b/i);
    if (blank) { reason = 'There’s still a blank. Fill it with what actually happened: a real detail beats any placeholder.'; tone = 'fix'; step = 'Fill in the blanks'; why = 'A real detail beats any placeholder.'; }
    else if (gib > .25 || noWords) { reason = 'That doesn’t read as words yet. Say it the way you’d say it to a friend.'; tone = 'fix'; step = 'Say the thing plainly'; why = 'It doesn’t read as words yet.'; }
    else if (short) { reason = 'Too short to stop anyone. Say what it’s about: the number, the name, or what changed.'; tone = 'fix'; step = 'Say what it’s about'; why = 'A few more words give people a reason to stop.'; }
    else if (bait > 1 || (bait && score < 66)) { reason = 'It reads like bait, and people have learned to scroll past it. The real claim is more interesting than the tease.'; tone = 'fix'; step = 'Say the real thing'; why = 'Readers have learned to scroll past bait.'; }
    else if (over) { reason = 'Too many numbers at once, so none of them lands. Keep the one that tells the story.'; tone = 'fix'; step = 'Keep the one number that matters'; why = 'Several numbers at once blur the point.'; }
    else if (fillers.length && !lead0) { const orig = (String(text).match(new RegExp(`\\b${fillers[0]}\\b`, 'i')) || [fillers[0]])[0], s = softWhy(orig); reason = s ? `“${orig}” ${s.short}. Cut it and the claim stands on its own.` : `“${orig}” softens the claim. Cut it and the claim stands on its own.`; tone = 'fix'; step = `Cut “${orig}”`; why = s ? `It ${s.short}.` : 'It softens the claim.'; fix = drop(new RegExp(`\\b${fillers[0]}\\b,?`, 'i')); }
    else if (warm) { const w = warm[0], W = w.length > 26 ? w.split(/\s+/).slice(0, 3).join(' ') + '…' : cap(w); reason = warmS ? `Opening on “${W}” ${warmS.short}. Start where your point does.` : `Opening with “${W}” spends your first word on a warm-up. Start where your point does.`; tone = 'fix'; step = warmS ? `Cut “${W}”` : `Drop the “${W}” opener`; why = warmS ? `It ${warmS.short}.` : 'Your first words decide the scroll.'; fix = cap(drop(new RegExp(`^\\s*${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b[,:.!]*`, 'i'))); }
    else if (passive && score < 70) { const v = passive[1].toLowerCase(); reason = `“…${passive[0].split(' ').slice(0, -2).join(' ')} ${v} by…” hides who did it. Put the doer first: “we ${v}…”.`; tone = 'fix'; step = 'Say who did it'; why = 'Passive voice hides the doer.'; }
    else if (parts.brevity < 45) { reason = 'Long first line. People decide on the opening words, so land the point in under 100 characters and let line two carry the rest.'; tone = 'fix'; step = 'Land the point in under 100 characters'; why = 'Long first lines get skimmed.'; }
    else if (figAt && figAt.n >= 7 && score < 70) { reason = `Your sharpest detail, “${figAt.fig}”, shows up ${figAt.n} words in. Lead with it: people stop for a result, not for the setup.`; tone = 'fix'; step = `Lead with “${figAt.fig}”`; why = `It shows up ${figAt.n} words in.`; }
    else if (score >= 70) {
      const s = [];
      if (parts.specificity >= 65) s.push('a concrete number');
      if (parts.curiosity >= 60) s.push('an open loop');
      if (parts.tension >= 60) s.push('real tension');
      if (!s.length) s.push('tight, clear phrasing');
      reason = `${cap(s.slice(0, 2).join(' and '))}. A strong first line.`; tone = 'good';
      /* what would take it further, for anyone who wants more than ready */
      step = parts.specificity < 65 ? 'Add a number or a name' : parts.curiosity < 60 ? 'Leave one question open' : parts.tension < 60 ? 'Say what most people get wrong' : 'Cut one more word'; why = `${cap(s.slice(0, 2).join(' and '))}.`;
    }
    else if (parts.specificity < 45 && vague) { reason = `“${vague[1]}” is a number you haven’t said yet. If you know it, write it: exact reads as true.`; tone = 'fix'; step = `Swap “${vague[1]}” for the number`; why = 'Exact reads as true.'; }
    else if (parts.specificity < 45) { reason = 'Nothing a reader could picture yet. One real number, name or timeframe makes it concrete.'; tone = 'fix'; step = 'Add a number or a name'; why = 'Concrete beats clever.'; }
    else if (parts.curiosity < 45) { reason = 'It closes itself. Leave one thing open: the result, the reason, or what happened next.'; tone = 'fix'; step = 'Leave one question open'; why = 'Right now it answers itself.'; }
    else if (parts.tension < 45) { reason = 'Nothing here anyone would push back on. What does your niche get wrong about this? Say that.'; tone = 'fix'; step = 'Say what most people get wrong'; why = 'Push against what people assume.'; }
    else { reason = score >= 45 ? `Nearly there. Trade the weakest verb for a sharper one, or add the number, and it’s ${HOOK_TIERS[2].word}.` : 'Nothing wrong with it, nothing pulling yet. Trade the weakest verb for a sharper one, or add the number.'; tone = 'ok'; step = 'Try a stronger verb or a number'; why = 'Nothing wrong with it, nothing pulling yet.'; }
    return { score, parts, reason, tone, step, why, fix, tier: hookTier(score).word };
  }

  /* ---------------- hook states ----------------
     The score stays 0–100 underneath (sorting, thresholds, the learning model). People see one of four words, each a step
     toward ready, never a verdict on the person, and never a forecast of reach. 70 is the bar: Ready.
     Keys are internal and stable (they were the old tier names); only the words show. */
  const HOOK_TIERS = [
    { key: 'flat', word: 'Getting there', min: 0 },
    { key: 'warming', word: 'Almost', min: 45 },
    { key: 'sharp', word: 'Ready', min: 70 },
    { key: 'honed', word: 'Outstanding', min: 85 }
  ];
  function hookTier(score) {
    const s = +score || 0; let i = 0;
    for (let k = 1; k < HOOK_TIERS.length; k++) if (s >= HOOK_TIERS[k].min) i = k;
    return { ...HOOK_TIERS[i], rank: i, next: HOOK_TIERS[i + 1] || null };
  }
  /* what a change did to the line, in words: a new state ("Almost → Ready"), a clear step within one ("Stronger",
     "A bit softer"), or about the same (a point or two is noise in a rule of thumb, so it isn't called better) */
  function hookMove(a, b) {
    const A = hookTier(a), B = hookTier(b), d = (+b || 0) - (+a || 0);
    if (B.rank !== A.rank) return { dir: B.rank > A.rank ? 'up' : 'down', cross: true, from: A, to: B, text: `${A.word} → ${B.word}` };
    if (d >= 3) return { dir: 'up', cross: false, from: A, to: B, text: 'Stronger' };
    if (d <= -3) return { dir: 'down', cross: false, from: A, to: B, text: 'A bit softer' };
    return { dir: 'same', cross: false, from: A, to: B, text: 'About the same' };
  }
  /* the next single step, as the headline: "Cut “i think” to make it Ready." Where the fix can be tried here (a hedge, a
     warm-up), it's scored first, so the sentence only promises a state the line would really reach. Ready and Outstanding
     lead with that, and offer the step as optional. */
  function hookNext(raw, h) {
    h = h || hookScore(raw); const T = hookTier(h.score), bar = HOOK_TIERS[2];
    if (!String(raw || '').trim()) return { lead: 'Write your first line.', sub: 'It’s the hook. It’s read as you type.', state: T, to: null, step: h.step };
    if (T.rank >= 3) return { lead: 'Ready to post. This one stands out.', sub: h.why || h.reason, state: T, to: null, step: null };
    if (T.rank === 2) return { lead: 'Ready to post.', sub: `For ${HOOK_TIERS[3].word}: ${h.step.charAt(0).toLowerCase() + h.step.slice(1)}.`, state: T, to: HOOK_TIERS[3], step: h.step };
    let to = null;
    if (h.fix != null) { const f = hookTier(hookScore(h.fix).score); if (f.rank > T.rank) to = f; }
    const verb = w => w.rank >= 2 ? `make it ${w.word}` : `get it to ${w.word}`;
    const lead = to ? `${h.step} to ${verb(to)}.` : `${h.step} to get closer to ${bar.word}.`;
    return { lead, sub: h.why || h.reason, state: T, to: to || bar, step: h.step };
  }
  /* one sub-check as a state: strong (filled), some (half), not yet (empty) */
  function partState(v) { return v >= 70 ? { key: 'full', word: 'Yes' } : v >= 45 ? { key: 'half', word: 'Some' } : { key: 'empty', word: 'Not yet' }; }

  /* ---------------- post kinds (for "what's working") ---------------- */
  function kindOf(text) {
    const t = String(text || '').trim(), lc = t.toLowerCase(), first = lc.split('\n')[0];
    if (/^(unpopular opinion|hot take)|\b(overrated|backwards|myth|is a lie|stop \w+ing|nobody tells you|everyone says)\b/.test(first)) return 'Contrarian';
    if (/^\d+\s|\b\d+ (things|ways|lessons|mistakes|tools|rules|tips|habits|books|reasons)\b|^(\d+[.)]|[-•])\s/m.test(lc)) return 'Listicle';
    if (/\?\s*$/.test(first) && first.length < 140) return 'Question';
    if (/\b(how to|here'?s how|step[- ]by[- ]step|the playbook|guide|template|framework)\b/.test(lc)) return 'How-to';
    if (/\b(i|we) (lost|quit|failed|got fired|almost|went from|shipped|launched|made|hit|crossed|raised)\b|\b(years? ago|last (week|month|year)|yesterday|today i)\b/.test(lc)) return 'Story';
    if (/[:…]\s*$|\bhere'?s what\b|\bthe (one|real) (thing|reason)\b/.test(first)) return 'Curiosity';
    if (/\b(launch(ed|ing)?|introducing|announc|now live|out today|just shipped)\b/.test(lc)) return 'Announcement';
    return 'Take';
  }
  /* the words people read for each kind (round 34): plain words anyone on X knows. The keys above stay put,
     so saved data, prompts and the API don't change; only these labels do. */
  const KIND_NAMES = { Contrarian: ['Hot take', 'hot takes'], Listicle: ['List', 'lists'], Curiosity: ['Teaser', 'teasers'], Take: ['Thought', 'thoughts'], Announcement: ['News', 'news posts'], Proof: ['Results', 'results posts'], 'How-to': ['How-to', 'how-tos'], Story: ['Story', 'stories'], Question: ['Question', 'questions'], Lesson: ['Lesson', 'lessons'], Thread: ['Thread', 'threads'] };
  const kindName = k => (KIND_NAMES[k] || [k])[0];
  const kindPlural = k => (KIND_NAMES[k] || [null, String(k || '').toLowerCase() + 's'])[1];
  /* a post with no likes, reposts, replies or views has no numbers to rank: a draft, a deleted post, or an export
     without metric columns. It still teaches your voice; it never counts as a flop (or a win). */
  const measured = p => !!p && ((p.likes || 0) + (p.reposts || 0) + (p.replies || 0) + (p.views || 0)) > 0;

  /* ---------------- CSV ---------------- */
  function parseCSVRows(text) {
    const rows = []; let row = [], cell = '', q = false; const s = String(text).replace(/^\uFEFF/, '');
    const firstLine = s.split('\n')[0]; const delim = (firstLine.match(/\t/g) || []).length > (firstLine.match(/,/g) || []).length ? '\t' : ',';
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (q) { if (ch === '"') { if (s[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; continue; }
      if (ch === '"') q = true;
      else if (ch === delim) { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && s[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += ch;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(c => c.trim()));
  }
  const num = v => { if (v == null || v === '') return 0; const s = String(v).trim().replace(/,/g, ''); const m = s.match(/^([\d.]+)\s*([kKmM])?$/); if (!m) return Number(s) || 0; return Math.round(Number(m[1]) * (m[2] ? (/k/i.test(m[2]) ? 1e3 : 1e6) : 1)); };
  const COLS = {
    text: ['text', 'full_text', 'content', 'post', 'body', 'sharecommentary', 'commentary', 'tweet', 'tweet text', 'post text', 'post content', 'caption', 'message'],
    at: ['date', 'created_at', 'created at', 'published', 'published_on', 'published at', 'publishedat', 'time', 'timestamp', 'posted', 'post date', 'post publish date', 'scheduled_date'],
    likes: ['likes', 'like', 'favorite_count', 'favorites', 'reactions', 'likes_count', 'like count', 'hearts'],
    reposts: ['retweets', 'retweet_count', 'reposts', 'repost', 'shares', 'share count', 'quotes'],
    replies: ['replies', 'reply_count', 'comments', 'comment count'],
    views: ['impressions', 'views', 'impression_count', 'view count', 'reach'],
    status: ['status', 'state', 'post status', 'draft status']
  };
  /* Typefully, Buffer and Hypefury exports carry drafts, queued and failed posts too: only posts that went out are posts */
  const NOT_POSTED = /^(draft|drafts|scheduled|queued|queue|pending|failed|error|deleted|archived|idea|unpublished)$/i;
  function parseCSV(text, src = 'csv') {
    const rows = parseCSVRows(text); if (rows.length < 2) return [];
    const head = rows[0].map(h => h.trim().toLowerCase());
    const col = k => head.findIndex(h => COLS[k].includes(h));
    const taken = new Map(); const ci = { text: col('text'), at: col('at'), likes: col('likes'), reposts: col('reposts'), replies: col('replies'), views: col('views'), status: col('status') };
    if (ci.text < 0) { let best = -1, bl = 0; head.forEach((_, i) => { const l = rows.slice(1, 30).reduce((a, r) => a + (r[i] || '').length, 0); if (l > bl) { bl = l; best = i; } }); ci.text = best; }
    return rows.slice(1).filter(r => !(ci.status >= 0 && NOT_POSTED.test(String(r[ci.status] || '').trim()))).map((r, i) => normPost({ text: r[ci.text], at: ci.at >= 0 ? r[ci.at] : null, likes: ci.likes >= 0 ? num(r[ci.likes]) : 0, reposts: ci.reposts >= 0 ? num(r[ci.reposts]) : 0, replies: ci.replies >= 0 ? num(r[ci.replies]) : 0, views: ci.views >= 0 ? num(r[ci.views]) : 0, src, id: textId(src, r[ci.text], taken) })).filter(Boolean);
  }
  /* import ids come from the words, not the row number, so a second import never lands on an earlier post's id.
     Same text → same id (re-importing dedupes); two different texts that hash alike both stay (suffixed). */
  const normText = t => String(t || '').normalize('NFC').replace(/\s+/g, ' ').trim();
  function textId(src, text, taken) {
    const key = normText(text), base = `${src}-${hashStr(key)}`; let id = base;
    for (let k = 2; taken && taken.has(id) && taken.get(id) !== key; k++) id = `${base}-${k}`;
    if (taken) taken.set(id, key); return id;
  }

  /* ---------------- X archive ----------------
     "Download an archive of your data" → data/tweets.js (window.YTD.tweets.part0 = [...]).
     Retweets and replies to other people are dropped; self-replies are folded into their thread. */
  function stripYTD(text) { const i = String(text).indexOf('['); const j = String(text).lastIndexOf(']'); return i < 0 || j < i ? '[]' : String(text).slice(i, j + 1); }
  function parseXArchive(files) {
    const list = Array.isArray(files) ? files : [files];
    let items = [], account = null, following = [];
    for (const f of list) {
      const name = (f.name || '').toLowerCase(), body = f.text || '';
      if (/account\.js$/.test(name)) { try { const a = JSON.parse(stripYTD(body))[0]; account = a && a.account ? { handle: a.account.username, name: a.account.accountDisplayName, id: a.account.accountId } : null; } catch (e) { /* keep going */ } continue; }
      if (/following\.js$/.test(name)) { try { following = JSON.parse(stripYTD(body)).map(x => x.following && x.following.accountId).filter(Boolean); } catch (e) { /* keep going */ } continue; }
      /* deleted-tweets.js ends in "tweets.js" too: posts you deleted aren't your posts any more */
      if (/deleted|note-tweet/.test(name) || /^\s*window\.YTD\.deleted/.test(body)) continue;
      if (/tweets?(-part\d+)?\.js$/.test(name) || /^\s*window\.YTD\.tweets?/.test(body)) { try { items = items.concat(JSON.parse(stripYTD(body))); } catch (e) { /* keep going */ } }
    }
    const tw = items.map(x => x.tweet || x).filter(t => t && (t.full_text || t.text) && !t.deleted_at);
    const byId = new Map(tw.map(t => [t.id_str || t.id, t]));
    const selfId = account && account.id;
    const isSelfReply = t => t.in_reply_to_status_id_str && (t.in_reply_to_user_id_str === selfId || byId.has(t.in_reply_to_status_id_str));
    const heads = tw.filter(t => !/^RT @/.test(t.full_text || t.text) && !t.in_reply_to_status_id_str);
    const kids = new Map(); tw.filter(isSelfReply).forEach(t => { const p = t.in_reply_to_status_id_str; if (!kids.has(p)) kids.set(p, []); kids.get(p).push(t); });
    const thread = t => { const out = [t]; let cur = t; for (let k = 0; k < 25; k++) { const c = (kids.get(cur.id_str) || [])[0]; if (!c) break; out.push(c); cur = c; } return out; };
    const clean = s => String(s).replace(/https:\/\/t\.co\/\w+/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    const taken = new Map(); const posts = heads.map(t => { const th = thread(t); return normPost({ id: (t.id_str || t.id) ? 'x-' + (t.id_str || t.id) : textId('x-archive', clean(t.full_text || t.text), taken), text: clean(t.full_text || t.text), thread: th.slice(1).map(x => clean(x.full_text || x.text)), at: t.created_at, likes: num(t.favorite_count), reposts: num(t.retweet_count), replies: num(t.reply_count), views: num(t.view_count || t.impression_count), src: 'x-archive', url: account ? `https://x.com/${account.handle}/status/${t.id_str}` : undefined }); }).filter(Boolean);
    return { posts, account, following };
  }

  /* ---------------- Typefully (API JSON) and pasted text ---------------- */
  function parseTypefully(json) {
    const arr = Array.isArray(json) ? json : (json && (json.results || json.drafts || json.data)) || [];
    const taken = new Map();
    /* the API returns drafts and scheduled posts as well: only ones that went out (a publish date, a live link or numbers) are posts */
    const went = d => { const st = String(d.status || '').toLowerCase(); if (st) return st === 'published' || st === 'posted' || st === 'sent'; return !(d.scheduled_date && !d.published_on && !d.published_at); };
    return arr.filter(went).map(d => { const text = d.text || d.content || (Array.isArray(d.tweets) ? d.tweets.map(t => t.text || t).join('\n\n') : '') || (d.platforms && d.platforms.x && d.platforms.x.posts ? d.platforms.x.posts.map(p => p.text).join('\n\n') : '');
      const parts = String(text).split(/\n{4,}/); return normPost({ id: d.id != null && d.id !== '' ? 'tf-' + d.id : textId('typefully', parts[0], taken), text: parts[0], thread: parts.slice(1), at: d.published_on || d.published_at || d.scheduled_date, likes: num(d.likes || d.favorite_count), reposts: num(d.retweets || d.reposts), replies: num(d.replies), views: num(d.impressions), src: 'typefully', url: d.twitter_url || d.x_published_url || d.share_url }); }).filter(Boolean);
  }
  function parsePasted(text) {
    const taken = new Map();
    return String(text).split(/\n\s*(?:-{3,}|={3,}|\*{3,})\s*\n|\n{3,}/).map(b => { const m = b.match(/(?:^|\n)\s*(?:❤️?|likes?:?)\s*([\d.,]+[kKmM]?)/); const body = b.replace(/(?:^|\n)\s*(?:❤️?|likes?:?)\s*[\d.,]+[kKmM]?\s*$/, ''); return normPost({ id: textId('paste', body, taken), text: body, likes: m ? num(m[1]) : 0, src: 'paste' }); }).filter(Boolean);
  }
  function normPost(p) {
    const text = String(p.text || '').trim(); if (!text || text.length < 3) return null;
    /* a bare date ("2026-01-01", common in CSV exports) is local midnight, not UTC midnight, or every post
       lands on the previous evening west of Greenwich and best-times shifts a weekday. Timestamps stay as given. */
    const day = p.at && String(p.at).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
    let at = day ? new Date(+day[1], +day[2] - 1, +day[3]).getTime() : p.at ? Date.parse(p.at) : NaN; if (isNaN(at) && p.at && /^\d+$/.test(String(p.at))) at = Number(p.at) * (String(p.at).length <= 10 ? 1000 : 1);
    return { id: p.id || 'p-' + hashStr(text), text, thread: (p.thread || []).filter(Boolean), at: isNaN(at) ? null : at, likes: p.likes || 0, reposts: p.reposts || 0, replies: p.replies || 0, views: p.views || 0, src: p.src || 'import', url: p.url, handle: p.handle };
  }
  /* the same post (same words, or the same X / Typefully id) updates in place and keeps the higher numbers;
     a different post never replaces one, even if the ids collide: it gets a suffixed id instead */
  const STABLE_ID = /^(x|tf)-/;
  function mergeHistory(old, add) {
    const out = (old || []).slice(), byId = new Map(), byText = new Map();
    out.forEach(p => { byId.set(p.id, p); const k = normText(p.text); if (!byText.has(k)) byText.set(k, p); });
    (add || []).forEach(p => {
      if (!p || !p.text) return;
      const key = normText(p.text); let k = byText.get(key);
      if (!k && p.id && STABLE_ID.test(p.id) && byId.has(p.id)) k = byId.get(p.id);
      if (k) { Object.assign(k, { likes: Math.max(k.likes || 0, p.likes || 0), reposts: Math.max(k.reposts || 0, p.reposts || 0), replies: Math.max(k.replies || 0, p.replies || 0), views: Math.max(k.views || 0, p.views || 0), at: k.at || p.at, url: k.url || p.url }); return; }
      const base = p.id || 'p-' + hashStr(key); let id = base; for (let n = 2; byId.has(id); n++) id = `${base}-${n}`;
      const q = id === p.id ? p : { ...p, id }; out.push(q); byId.set(id, q); byText.set(key, q);
    });
    return out.sort((a, b) => (b.at || 0) - (a.at || 0));
  }

  /* ---------------- analytics over your own history ---------------- */
  const eng = p => p.likes + p.reposts * 2 + p.replies * 3;
  function analyze(posts, now = Date.now()) {
    const P = (posts || []).filter(p => p.text);
    if (!P.length) return null;
    /* rankings, kinds, times and calibration use only posts that came with numbers; voice stats use every post */
    const M = P.filter(measured), R = M.length ? M : P;
    const E = R.map(eng), med = median(E) || 1;
    const top = [...M].sort((a, b) => eng(b) - eng(a));
    /* didn't land: well under your usual, old enough to have settled (2 days), and only once there's enough to compare */
    const flops = M.length >= 8 ? [...M].filter(p => eng(p) < med * .5 && (!p.at || now - p.at > 2 * 864e5)).sort((a, b) => eng(a) - eng(b)).slice(0, 6) : [];
    /* voice stats */
    const sents = P.flatMap(p => p.text.split(/(?<=[.!?])\s+|\n+/).filter(s => words(s).length >= 2));
    const wps = sents.length ? sents.reduce((a, s) => a + words(s).length, 0) / sents.length : 0;
    const emojiPer = P.reduce((a, p) => a + (p.text.match(EMOJI) || []).length, 0) / P.length;
    const tagsPer = P.reduce((a, p) => a + (p.text.match(/#\w+/g) || []).length, 0) / P.length;
    const oneSentOpen = P.filter(p => { const f = p.text.split('\n')[0]; return (f.match(/[.!?](\s|$)/g) || []).length <= 1; }).length / P.length;
    const lower = P.filter(p => /^[a-z]/.test(p.text)).length / P.length;
    const avgLen = P.reduce((a, p) => a + p.text.length, 0) / P.length;
    const threads = P.filter(p => p.thread && p.thread.length).length / P.length;
    const freq = {}; P.forEach(p => new Set(words(p.text).filter(w => w.length > 3 && !STOP.has(w))).forEach(w => { freq[w] = (freq[w] || 0) + 1; }));
    const lean = Object.entries(freq).filter(([, n]) => n >= Math.max(3, P.length * .03)).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([w, n]) => ({ w, n }));
    /* kinds */
    const kinds = {}; M.forEach(p => { const k = kindOf(p.text); (kinds[k] = kinds[k] || []).push(eng(p)); });
    const kindStats = Object.entries(kinds).map(([k, arr]) => ({ k, n: arr.length, x: +(median(arr) / med).toFixed(2) })).sort((a, b) => b.x - a.x);
    const bestKind = kindStats.find(k => k.n >= Math.max(3, M.length * .04) && k.x > 1.15) || null;
    /* times: day-of-week x hour, median engagement relative to overall */
    const dated = M.filter(p => p.at);
    const grid = {}; dated.forEach(p => { const d = new Date(p.at); const key = `${d.getDay()}-${d.getHours()}`; (grid[key] = grid[key] || []).push(eng(p)); });
    const slots = Object.entries(grid).filter(([, a]) => a.length >= 2).map(([k, a]) => { const [dow, h] = k.split('-').map(Number); return { dow, h, n: a.length, x: +(median(a) / med).toFixed(2) }; }).sort((a, b) => b.x - a.x);
    const hours = Array.from({ length: 24 }, (_, h) => { const a = dated.filter(p => new Date(p.at).getHours() === h).map(eng); return { h, n: a.length, x: a.length ? +(median(a) / med).toFixed(2) : 0 }; });
    /* hook calibration: does a higher hook score actually earn more here? */
    const scored = M.map(p => ({ s: hookScore(p.text).score, e: eng(p) }));
    const hi = scored.filter(x => x.s >= 70), lo = scored.filter(x => x.s < 45); /* Ready or better vs Getting there */
    const calib = hi.length >= 3 && lo.length >= 3 ? { hiN: hi.length, loN: lo.length, x: +(median(hi.map(x => x.e)) / Math.max(1, median(lo.map(x => x.e)))).toFixed(2), r: +pearson(scored.map(x => x.s), scored.map(x => Math.log1p(x.e))).toFixed(2) } : null;
    /* cadence */
    const datedAll = P.filter(p => p.at);
    const span = datedAll.length > 1 ? (Math.max(...datedAll.map(p => p.at)) - Math.min(...datedAll.map(p => p.at))) / 864e5 : 0;
    const perWeek = span > 6 ? +(datedAll.length / (span / 7)).toFixed(1) : null;
    const oldTop = top.filter(p => p.at && now - p.at > 60 * 864e5).slice(0, 5);
    return { n: P.length, measured: M.length, unmeasured: P.length - M.length, median: med, top: top.slice(0, 12), flops, oldTop, stats: { wps: +wps.toFixed(1), emojiPer: +emojiPer.toFixed(2), tagsPer: +tagsPer.toFixed(2), oneSentOpen: Math.round(oneSentOpen * 100), lower: Math.round(lower * 100), avgLen: Math.round(avgLen), threads: Math.round(threads * 100) }, lean, kindStats, bestKind, slots: slots.slice(0, 6), hours, calib, perWeek, span: Math.round(span) };
  }
  function pearson(a, b) { const n = a.length; if (n < 3) return 0; const ma = a.reduce((x, y) => x + y, 0) / n, mb = b.reduce((x, y) => x + y, 0) / n; let num = 0, da = 0, db = 0; for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; } return da && db ? num / Math.sqrt(da * db) : 0; }

  /* ---------------- prompts ----------------
     Every call carries the same editor brief plus the author's own evidence.
     tier: quick | default | complex → server runs Sonnet 5.5 at low and medium effort, and Opus 5.5 at high.
     Every structured call asks for one JSON value in the prompt (the claude.ai sample path reads that) and
     carries the same shape as a schema (the server turns it into structured outputs). */
  const BRIEF = `You are Hookworthy's editor: a sharp friend who edits social posts so they sound like the author on a good day.

The author posts what you write under their own name, so their facts are the post. Keep every fact, number, name and claim they gave. Never invent a number, a result, a person or an event; where a stronger version needs a detail only they know, write a [bracketed blank] like [number] for them to fill.

Match their voice from the evidence below: casing, punctuation, line breaks, sentence length, slang, and how they use emoji and hashtags (none unless their examples have them; lowercase stays lowercase). Write in plain words and short sentences, one idea per line, within the platform limit you're given.

Their readers know AI-sounding posts on sight and scroll past, and the app flags these before anything is posted, so leave them out: delve, game-changer, unlock, leverage, elevate, supercharge, seamless, "in today's fast-paced world", "let that sink in", "it's not X, it's Y" more than once, three adjectives in a row, filler rhetorical questions, and em dashes the author doesn't use. Bait openers and closers read the same way: "Here's the thing", "Unpopular opinion:", "Nobody talks about", "Most people…", "Stop X. Start Y.", "99% of you", and endings like "Agree?", "Thoughts?" or "Am I wrong?".`;
  function voiceBlock(v) {
    if (!v) return '';
    const bits = [];
    if (v.summary) bits.push(`How they write: ${v.summary}`);
    if (v.rules && v.rules.length) bits.push(`Their habits:\n- ${v.rules.slice(0, 8).join('\n- ')}`);
    if (v.never && v.never.length) bits.push(`Words they never use: ${v.never.join(', ')}`);
    if (v.tone) bits.push(`Tone dials (0-100): calm→spicy ${v.tone.spice}, casual→polished ${v.tone.polish}, short→rich ${v.tone.length}`);
    if (v.examples && v.examples.length) bits.push(`Their own posts, for voice only (don't reuse the content):\n${v.examples.slice(0, 5).map((e, i) => `<post ${i + 1}>\n${e}\n</post ${i + 1}>`).join('\n')}`);
    const L = v.learned;
    if (L) {
      if (L.habits && L.habits.length) bits.push(`What their own posts show (${L.posts} post${L.posts === 1 ? '' : 's'}):\n- ${L.habits.join('\n- ')}`);
      if (L.avoid && L.avoid.length) bits.push(`Words they keep deleting from suggestions, so leave them out: ${L.avoid.join(', ')}`);
      if (L.keep && L.keep.length) bits.push(`Words they put back after an edit took them out, so keep them: ${L.keep.join(', ')}`);
      if (L.prefer && L.prefer.length) bits.push(`First-line moves they keep: ${L.prefer.join(', ')}`);
      if (L.dislike && L.dislike.length) bits.push(`First-line moves they undo: ${L.dislike.join(', ')}`);
      if (L.pairs && L.pairs.length) bits.push(`How they edit suggestions before posting (learn the direction, not the content):\n${L.pairs.map((x, i) => `<suggested ${i + 1}>\n${x.from}\n</suggested ${i + 1}>\n<they posted ${i + 1}>\n${x.to}\n</they posted ${i + 1}>`).join('\n')}`);
    }
    return bits.join('\n\n');
  }
  /* ---------- voice memory: what Hookworthy learns from one voice's own use ----------
     Every voice (you, and each client you write for) keeps its own. It grows from what they do, never from guesses:
     the posts they schedule or send, the words they delete from a suggestion before posting, the words they put back
     after Sharpen cut them, and which first-line moves they keep or undo. memDigest turns it into the habits, words and
     moves every prompt and the local Sharpen use. Nothing here leaves the device unless a prompt does. */
  const MEM_POSTS = 60, MEM_EDITS = 30;
  const memNew = () => ({ posts: [], edits: [], moves: {}, keep: {}, drop: {}, n: 0 });
  const memNorm = t => String(t || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const memWords = t => (String(t || '').toLowerCase().match(/[\p{L}][\p{L}\p{N}’'-]*/gu) || []).map(w => w.replace(/[’']s$/, '')).filter(w => w.length > 2 && !STOP.has(w));
  function memPost(mem, text, { at = Date.now(), src = 'sent' } = {}) {
    const t = String(text || '').trim(); if (!mem || words(t).length < 3) return mem;
    const k = memNorm(t), had = mem.posts.some(p => memNorm(p.t) === k);
    mem.posts = [{ t, at, src }, ...mem.posts.filter(p => memNorm(p.t) !== k)].slice(0, MEM_POSTS); if (!had) mem.n++; return mem;
  }
  /* a suggestion they changed before posting: which words they took out, which they put in. A full rewrite isn't an edit of it */
  function memEdit(mem, from, to, { kind = '', at = Date.now() } = {}) {
    const a = String(from || '').trim(), b = String(to || '').trim(); if (!mem || !a || !b || memNorm(a) === memNorm(b)) return mem;
    const A = new Set(memWords(a)), B = new Set(memWords(b)), shared = [...A].filter(w => B.has(w)).length;
    if (!A.size || (shared < 2 && shared / A.size < .4)) return mem;
    [...A].filter(w => !B.has(w)).forEach(w => { mem.drop[w] = (mem.drop[w] || 0) + 1; });
    [...B].filter(w => !A.has(w)).forEach(w => { if (mem.drop[w]) mem.drop[w] = Math.max(0, mem.drop[w] - 1); });
    mem.edits = [{ from: a, to: b, kind, at }, ...mem.edits.filter(e => memNorm(e.to) !== memNorm(b))].slice(0, MEM_EDITS); mem.n++; return mem;
  }
  /* a first-line move kept or undone (Sharpen's moves, a rewrite's kind) */
  function memChoice(mem, key, kept) { if (!mem || !key) return mem; const m = mem.moves[key] || (mem.moves[key] = { k: 0, u: 0 }); if (kept) m.k++; else m.u++; mem.n++; return mem; }
  /* words Sharpen cut that they put straight back: theirs to keep */
  function memKeep(mem, list) { if (!mem) return mem; (list || []).map(w => String(w).toLowerCase().trim()).filter(w => w && w.length > 1).forEach(w => { mem.keep[w] = (mem.keep[w] || 0) + 1; if (mem.drop[w]) mem.drop[w] = 0; }); mem.n++; return mem; }
  const MOVE_NAMES = { ask: 'ask, then answer', number: 'lead with the number', result: 'result first', contrast: 'a two-beat contrast', loop: 'an open loop', straight: 'say it straight', story: 'a moment in time', moment: 'a moment in time', active: 'say who did it', payoff: 'the payoff first', order: 'the payoff last', tight: 'fewer words', confess: 'an honest confession', punchier: 'punchier', shorter: 'shorter', hook: 'a stronger first line', contrarian: 'a contrarian take', curiosity: 'a curiosity gap' };
  function memDigest(mem, more = []) {
    const own = mem ? mem.posts.map(p => ({ text: p.t, at: p.at })) : [], seen = new Set(own.map(p => memNorm(p.text)));
    const P = [...own, ...(more || []).filter(p => p && p.text && !seen.has(memNorm(p.text)))];
    const out = { n: mem ? mem.n : 0, posts: P.length, sent: own.length, edits: mem ? mem.edits.length : 0, habits: [], avoid: [], keep: [], prefer: [], dislike: [], pairs: [], lean: [], stats: null };
    if (P.length >= 3) {
      const an = analyze(P), st = an.stats, share = f => P.filter(p => f(p.text)).length / P.length; out.stats = st; out.lean = an.lean;
      if (st.lower >= 60) out.habits.push('Writes in lowercase, first word included.'); else if (st.lower <= 10) out.habits.push('Starts every post with a capital.');
      if (st.wps && st.wps <= 11) out.habits.push(`Short sentences, about ${Math.round(st.wps)} words each.`); else if (st.wps >= 20) out.habits.push(`Long, full sentences, about ${Math.round(st.wps)} words each.`);
      if (st.emojiPer < .15) out.habits.push('Almost never uses emoji.'); else if (st.emojiPer >= 1) out.habits.push('Uses emoji in most posts.');
      if (st.tagsPer < .05) out.habits.push('No hashtags.');
      if (share(t => /\n/.test(t.trim())) >= .5) out.habits.push('Breaks posts into short lines.');
      if (share(t => /\?\s*$/.test(t.split('\n')[0].trim())) >= .3) out.habits.push('Often opens with a question.');
      if (share(t => /\d/.test(t.split('\n')[0])) >= .4) out.habits.push('Often leads with a number.');
      const ex = share(t => /!/.test(t)); if (ex >= .4) out.habits.push('Uses exclamation marks.'); else if (ex <= .05 && P.length >= 5) out.habits.push('Rarely uses exclamation marks.');
      if (share(t => /—/.test(t)) <= .05 && P.length >= 5) out.habits.push('Never uses em dashes.');
      if (an.lean.length) out.habits.push(`Words they reach for: ${an.lean.slice(0, 5).map(l => l.w).join(', ')}.`);
      /* phrases of two or three words that recur across posts: the signature bits */
      const ph = {}; P.forEach(p => { const w = (p.text.toLowerCase().match(/[\p{L}\p{N}’']+/gu) || []); const set = new Set(); for (let n = 2; n <= 3; n++) for (let i = 0; i + n <= w.length; i++) { const g = w.slice(i, i + n); if (g.every(x => STOP.has(x))) continue; set.add(g.join(' ')); } set.forEach(g => { ph[g] = (ph[g] || 0) + 1; }); });
      const sig = Object.entries(ph).filter(([, c]) => c >= Math.max(3, P.length * .15)).sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).map(([g]) => g).filter((g, i, a) => !a.slice(0, i).some(h => h.includes(g))).slice(0, 3);
      if (sig.length) out.habits.push(`Phrases they repeat: ${sig.map(g => `“${g}”`).join(', ')}.`);
    }
    if (mem) {
      out.keep = Object.entries(mem.keep).filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w);
      out.avoid = Object.entries(mem.drop).filter(([w, c]) => c >= 2 && !mem.keep[w]).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w);
      const mv = Object.entries(mem.moves);
      out.prefer = mv.filter(([, m]) => m.k - m.u >= 2).sort((a, b) => (b[1].k - b[1].u) - (a[1].k - a[1].u)).map(([k]) => MOVE_NAMES[k] || k).slice(0, 4);
      out.dislike = mv.filter(([, m]) => m.u - m.k >= 2).map(([k]) => MOVE_NAMES[k] || k).slice(0, 4);
      out.pairs = mem.edits.slice(0, 3).map(e => ({ from: e.from, to: e.to }));
    }
    return out;
  }
  /* how much each Sharpen move is worth to this voice: kept minus undone, small and bounded so it nudges, never overrules */
  function memPref(mem) { const o = {}; if (!mem) return o; Object.entries(mem.moves).forEach(([k, m]) => { const d = m.k - m.u; if (Math.abs(d) >= 2) o[k] = clamp(d, -3, 3); }); return o; }
  const memKeepList = mem => mem ? Object.entries(mem.keep).filter(([, c]) => c >= 2).map(([w]) => w) : [];
  /* how a first line earns the stop, said once and shared by every prompt that writes one */
  /* r74: the moves the strongest first lines on X, Threads and LinkedIn make, in the order an editor tries them. One playbook for
     every prompt that writes a first line, and the same moves the offline Sharpen makes, so Claude and Quick mode agree */
  const HOOK_CRAFT = `How a first line earns the stop. Pick the move this draft's own facts support:
1. Cut the warm-up: everything before the point goes ("So", "Excited to announce that", "Just wanted to share", "Quick thought:", "I think", "honestly", "In today's … landscape"). The line starts where the news or the claim starts.
2. Lead with the number or the result when the draft has one, even if it's buried at the end: "Activation went from 21% to 38%. What changed: we rebuilt onboarding." beats "We rebuilt onboarding and activation went up to 38%."
3. Ask, then answer, when the draft names a best, worst, biggest or one thing: "Biggest mistake I made this cycle? Not taking profits."
4. Two beats for a turn or a cause, with a full stop between them: "I lost 40% of my account in 2022. I didn't use stop losses."
5. Advice as an instruction, or a question only when it bites: "Want to build muscle? Track your protein."
6. The stakes or the contrarian claim first, said plainly as a statement the author would defend in the replies.
7. Active voice, who did what: "Our team redesigned onboarding", not "onboarding was redesigned by our team".
8. An open loop ("Here's why:", "Here's what happened:") only when the post goes on to pay it off.
Keep every fact, number, name and "not"; add none (no new number, result, person or timeframe). Keep the author's casing (lowercase stays lowercase), slang and rhythm, so it sounds like them on a good day, talking to a friend, never like a marketer. Under 100 characters when it can be, 180 at most. No bait ("you won't believe", "nobody is talking about this", "read till the end"), no hype words, no emoji, thread emoji or hashtags the author didn't use.`;
  /* the same moves, short enough for a selection-sized prompt */
  const HOOK_MOVES = 'cut the warm-up and hedges; lead with the number or result the words already have; ask then answer a best/worst/one-thing; two beats for a turn; active voice; an open loop only if the post pays it off';
  const RIFF_ASK = {
    punchier: 'Make it punchier: cut warm-ups, hedges and filler ("just", "really", "I think", "basically"), trade a weak verb phrase for one strong verb, and split a long sentence into two beats. Same claim, same length or shorter.',
    shorter: 'Make it clearly shorter (aim for two thirds of the length) without losing the point. Cut the warm-up first, then repeats, then qualifiers. Never cut a number, a name or a "not".',
    hook: `Rewrite the first line so a fast scroller stops, and make each option a different move from the list. ${HOOK_CRAFT}\nKeep the rest of the post, lightly tightened. In "why", name the move and the words it moved, e.g. "Led with the result: 21% → 38%".`,
    contrarian: 'Reframe it as a contrarian take the author could defend with the facts already in the draft: say plainly what the common view gets wrong, as a statement. No "Unpopular opinion:" label and no strawman.',
    curiosity: 'Open a curiosity gap in the first line with something the post really delivers (a result, a reason, a turn), and pay it off by the end. No teaser the post can\'t pay.',
    grammar: 'Fix only spelling, grammar and punctuation. Keep their casing style and every word choice that isn\'t an error.',
    translate: 'Translate it naturally, keeping the tone, slang and line breaks.'
  };
  /* JSON Schemas for structured outputs: every object closed, every listed field required unless noted */
  const O = (props, opt = []) => ({ type: 'object', properties: props, required: Object.keys(props).filter(k => !opt.includes(k)), additionalProperties: false });
  const A = items => ({ type: 'array', items }), Str = { type: 'string' }, Int = { type: 'integer' }, E = (...v) => ({ type: 'string', enum: v });
  const KINDS = E('Contrarian', 'Story', 'Listicle', 'How-to', 'Curiosity', 'Question');
  /* the Room: six agents, each with one way into a first line. The app shows them; the prompt casts them */
  const ROOM = [
    { k: 'mo', n: 'Mo', role: 'The Straight Shooter', how: 'Says the claim plainly and first. No warm-up, no hedges.' },
    { k: 'rex', n: 'Rex', role: 'The Contrarian', how: 'Pushes against what people usually assume, with the same facts.' },
    { k: 'juno', n: 'Juno', role: 'The Storyteller', how: 'Opens on a moment or a turn, so the reader wants what happened.' },
    { k: 'ace', n: 'Ace', role: 'The Numbers Nerd', how: 'Leads with the most specific thing: a number, a name, a timeframe. Leaves [your number] if the author never gave one.' },
    { k: 'kit', n: 'Kit', role: 'The Teaser', how: 'Opens a loop the reader needs closed, and the post pays it off.' },
    { k: 'sol', n: 'Sol', role: 'The Minimalist', how: 'The fewest words that still land. Under 60 characters when it can.' }
  ];
  const SCHEMA = {
    options: O({ options: A(O({ text: Str, why: Str })), why: Str }, ['why']),
    versions: O({ versions: A(Str) }),
    voice: O({ summary: Str, traits: A(O({ name: Str, evidence: Str })), rules: A(Str), avoid: A(Str), works: A(Str), most_you: Str, niche: Str }),
    ideas: A(O({ text: Str, kind: KINDS, why: Str })),
    postmortem: O({ verdict: Str, reasons: A(Str), next_time: Str, rewrite: Str }),
    people: A(O({ pattern: Str, why: Str, example: Str, author: Str, try: Str })),
    replies: A(O({ id: Int, reply: Str, why: Str })),
    week: A(O({ slot: Int, kind: KINDS, posts: A(Str), why: Str })),
    shootout: O({ winner: E('a', 'b'), confidence: { type: 'number' }, why: Str }),
    digest: O({ subject: Str, headline: Str, why_best: Str, try_next: Str, first_line: Str }),
    briefRead: O({ title: Str, summary: Str, audience: Str, facts: A(O({ fact: Str, quote: Str })), gaps: A(Str), careful: A(Str), angles: A(O({ angle: Str, line: Str })) }),
    posts: O({ posts: A(Str), note: Str }, ['note']),
    radar: A(O({ id: Int, reply: Str, angle: E('number', 'counterexample', 'story', 'question') })),
    picture: O({ what: Str, kind: E('chart', 'dashboard', 'dm', 'tweet', 'receipt', 'photo', 'other'), facts: A(O({ fact: Str, where: Str })), private: A(Str), angles: A(O({ angle: Str, line: Str })), posts: A(Str),
      visual: { anyOf: [O({ template: { type: 'string', const: 'data' }, metric: Str, before: Str, after: Str }), O({ template: { type: 'string', const: 'stat' }, value: Str, label: Str }), O({ template: { type: 'string', const: 'quote' } })] } }),
    visual: O({ template: E('data', 'stat', 'list', 'compare', 'quote'), headline: Str, metric: Str, before: Str, after: Str, value: Str, label: Str, items: A(Str), left: Str, right: Str, emphasis: Str, why: Str }),
    critique: O({ reason: Str, better: A(Str) }),
    room: O({ lines: A(O({ agent: E(...ROOM.map(r => r.k)), line: Str })) })
  };
  const P = {
    rewrite({ text, kind, lang, voice, platform = 'X', limit = 280 }) {
      return { tier: kind === 'grammar' ? 'quick' : 'default', json: true, schema: SCHEMA.options, prompt: `${BRIEF}

${voiceBlock(voice)}

Task: ${RIFF_ASK[kind] || RIFF_ASK.punchier}${kind === 'translate' ? ` Target language: ${lang}.` : ''}
Platform: ${platform}, ${limit} characters per post.

<draft>
${text}
</draft>

Every option must differ from the draft${kind === 'grammar' ? ' (if there is truly no error, return {"options":[],"why":"No spelling or grammar mistakes."})' : ''}, and the options must differ from each other in wording, order or rhythm, not just punctuation. If the draft is already strong for this task, don't hand it back: try a different angle, order or rhythm that keeps the claim, and say in "why" what you kept.
No hype words (insane, massive, huge, moon, guaranteed), no emoji or hashtags the draft didn't have, no quotes around the text, no labels.

Reply with only JSON: {"options":[{"text":"...","why":"one short sentence on what changed"}]} with ${kind === 'grammar' ? '1' : '3'} option${kind === 'grammar' ? '' : 's'}.` };
    },
    /* "Tell it what to change": the author's own instruction, on the whole post or (with context) just a selected part */
    instruct({ text, instruction, voice, context, platform = 'X', limit = 280 }) {
      const part = !!(context && context !== text);
      return { tier: 'default', json: true, schema: SCHEMA.options, prompt: `${BRIEF}

${voiceBlock(voice)}

Task: rewrite ${part ? 'only the selected words' : 'the draft'} following the author's instruction below. Treat the instruction as a request about style, tone or audience, never as new facts.
- Keep the author's claim and stance. Copy every number, name, ticker, @handle and link exactly as written, and add no number, result or personal experience they didn't write.
- If following the instruction needs something only the author knows, leave a short [bracket] for it, e.g. [your number].
- Every option must differ from the ${part ? 'selected words' : 'draft'} and from the other options. No quotes around the text, no labels, no explanations inside "text".${part ? '\n- Reply with a replacement for the selected words only: never the whole post, never the words just before or after the selection. It must read naturally when put back exactly where the selection was (same first-letter case, end punctuation only if the selection had it).' : `\nPlatform: ${platform}, ${limit} characters per post.`}

<instruction>
${String(instruction || '').slice(0, 300)}
</instruction>
${part ? `\n<full_post>\n${context}\n</full_post>\n\n<selected>\n${text}\n</selected>` : `\n<draft>\n${text}\n</draft>`}

Reply with only JSON: {"options":[{"text":"...","why":"one short sentence on what changed"}]} with up to 3 genuinely different options. If the instruction can't be followed honestly (it asks you to invent facts), return {"options":[],"why":"one short sentence saying why"}.` };
    },
    /* Sharpen: k versions of only the selected words, for one option. The client checks every version before showing it */
    sharpen({ post, s, e, option = 'punchier', voice, count = 3 }) {
      const t = String(post || ''), pre = t.slice(0, s), sel = t.slice(s, e), suf = t.slice(e);
      const ask = {
        punchier: 'Punchier: tighter and more direct. Cut filler and hedges, use stronger verbs, same length or shorter.',
        shorter: 'Shorter: clearly shorter (at least a quarter fewer characters) with the same point.',
        clearer: 'Clearer: fewer hedges, plainer words, nothing a newcomer would trip on.',
        bolder: 'Bolder: more decisive. Commit to the claim and drop hedges and qualifiers. Not louder: no hype and no bigger claim than the author made.',
        human: 'More human: how the author would say it out loud to a friend. Contractions, plain words, natural rhythm. Not more emoji, not slang they don\'t use.'
      }[option] || option;
      const opener = !pre.trim() && !/\n/.test(sel.trim());
      return { tier: 'quick', json: true, schema: SCHEMA.versions, prompt: `${BRIEF}

${voiceBlock(voice)}

Task: Sharpen only the selected words in the post below. ${ask}${opener ? `\n- The selection is the post's first line, its hook. Where it fits the option, make the move a strong opener makes: ${HOOK_MOVES}. The first version should be the strongest.` : ''}
- Reply with replacements for the selected words only. Never the whole post, and never the words just before or after the selection: each replacement is put back exactly where the selection was, so it must read naturally there (same first-letter case; end punctuation only if the selection had it).
- Give ${count} versions that differ from the selection and from each other in wording, order or rhythm, not just punctuation. If the selected words are already strong, try a different angle, order or rhythm.
- Keep the claim and every "not". Copy every number, name, ticker, @handle and link exactly, and add no number, result, name or fact.
- No hype words (insane, massive, huge, moon, 100x, guaranteed, "full stop"), no emoji the selection didn't have, no hashtags, no quotes around the text, no labels, no explanations.
- Stay in the author's voice: lowercase stays lowercase, their slang stays.

<post>
${pre}<selected>${sel}</selected>${suf}
</post>

<selected>${sel}</selected>

Reply with only JSON: {"versions":["...","...","..."]}` };
    },
    voiceProfile({ posts, handle, niche }) {
      const sample = posts.slice(0, 120).map(p => `<post likes="${p.likes}" reposts="${p.reposts}" replies="${p.replies}">\n${p.text}${p.thread && p.thread.length ? '\n' + p.thread.slice(0, 3).join('\n') : ''}\n</post>`).join('\n');
      return { tier: 'complex', json: true, schema: SCHEMA.voice, prompt: `You study how one person writes on social media so an editor can match their voice exactly. ${handle ? `Account: @${handle}.` : ''} ${niche ? `Niche: ${niche}.` : ''}

Here are their posts, most engaging first, with engagement counts:
${sample}

Describe their voice from evidence only. Reply with only JSON:
{"summary":"2 sentences, plain words, how they sound","traits":[{"name":"one word, e.g. Direct","evidence":"a short measurable observation, e.g. 82% of openers are one sentence"}],"rules":["6-8 concrete habits an editor must keep, e.g. writes in lowercase, never uses hashtags, line break after the first sentence"],"avoid":["3-6 things that would sound wrong for them"],"works":["3-5 patterns that correlate with their best-performing posts, citing what you saw"],"most_you":"the exact text of the single post that sounds most like them","niche":"their niche in 2-4 words"}
Give exactly 3 traits.` };
    },
    ideas({ niche, voice, top, inbox, count = 6 }) {
      return { tier: 'default', json: true, schema: SCHEMA.ideas, prompt: `${BRIEF}

${voiceBlock(voice)}

The author writes about: ${niche || 'building in public'}.
Their best posts so far (what their audience rewards):
${(top || []).slice(0, 6).map(t => `- ${t.text.split('\n')[0]} (${t.likes} likes)`).join('\n') || '- (none yet)'}
Notes they saved to write about later:
${(inbox || []).slice(0, 8).map(t => `- ${t}`).join('\n') || '- (none)'}

Suggest ${count} first lines they could write today, grounded in their notes and what already works for them. No generic advice-guru lines. Reply with only JSON: [{"text":"the first line","kind":"Contrarian|Story|Listicle|How-to|Curiosity|Question","why":"one short sentence, tied to their evidence"}]` };
    },
    postmortem({ post, median, similar, voice }) {
      return { tier: 'default', json: true, schema: SCHEMA.postmortem, prompt: `${BRIEF}

You explain why one social post over- or under-performed for its author, using only the evidence given. Be specific and plain; no hype.

${voiceBlock(voice)}

The post (engagement ${eng(post)}; the author's median is ${Math.round(median)}):
<post likes="${post.likes}" reposts="${post.reposts}" replies="${post.replies}" posted="${post.at ? new Date(post.at).toUTCString() : 'unknown'}">
${post.text}
</post>

Their posts that did best, for comparison:
${(similar || []).slice(0, 5).map(p => `<post likes="${p.likes}">${p.text}</post>`).join('\n')}

Reply with only JSON: {"verdict":"one sentence","reasons":["2-4 specific reasons, each tied to the text, the timing or the comparison"],"next_time":"one concrete thing to do differently (or repeat)","rewrite":"the first line as you'd write it now, in their voice"}` };
    },
    people({ posts, niche }) {
      return { tier: 'default', json: true, schema: SCHEMA.people, prompt: `${BRIEF}

These are recent high-performing posts from accounts someone learns from${niche ? ` in ${niche}` : ''}. Find the reusable patterns, not the topics.

${posts.slice(0, 40).map(p => `<post author="@${p.handle || 'someone'}" likes="${p.likes}">\n${p.text}\n</post>`).join('\n')}

Reply with only JSON: [{"pattern":"short name","why":"why it works, one sentence","example":"the post's first line that shows it","author":"handle","try":"a fill-in-the-blank first line the reader could use, with [brackets] for their own details"}] — 4 to 6 items.` };
    },
    replies({ post, replies, voice }) {
      return { tier: 'default', json: true, schema: SCHEMA.replies, prompt: `${BRIEF}

${voiceBlock(voice)}

The author just posted this:
<post>
${post}
</post>

Replies in the first hour (the ones worth answering, most important first):
${replies.slice(0, 12).map((r, i) => `<reply id="${i}" from="@${r.handle}" followers="${r.followers || 0}">${r.text}</reply>`).join('\n')}

Write one reply for each, in the author's voice: short, warm or sharp as the reply deserves, adds something (a detail, a number, a question back), never generic thanks, never "Great question". Under 200 characters each. Reply with only JSON: [{"id":0,"reply":"...","why":"what this reply earns, in a few words"}]` };
    },
    weekPlan({ niche, voice, top, inbox, slots, count = 5, limit = 280 }) {
      return { tier: 'default', json: true, schema: SCHEMA.week, prompt: `${BRIEF}

${voiceBlock(voice)}

Plan this author's week: ${count} posts, one per slot below, grounded in their saved notes and in what already works for them. Mix the kinds (at most two of the same). Each post must be complete and ready to schedule, in their voice, within ${limit} characters unless it's a thread (then give the posts as separate strings, max 5).
Niche: ${niche || 'building in public'}
Slots: ${(slots || []).map(s => s.label).join('; ')}
What works for them:
${(top || []).slice(0, 5).map(t => `- ${t.text.split('\n')[0]} (${t.likes || 0} likes)`).join('\n') || '- (no history yet)'}
Notes they saved:
${(inbox || []).slice(0, 12).map(t => `- ${t}`).join('\n') || '- (none)'}

Reply with only JSON: [{"slot":0,"kind":"Contrarian|Story|Listicle|How-to|Curiosity|Question","posts":["post 1","optional post 2"],"why":"why this, this day, one short sentence"}]` };
    },
    shootout({ a, b, voice, evidence }) {
      return { tier: 'quick', json: true, schema: SCHEMA.shootout, prompt: `Two first lines for the same post. Using the author's own results below as the main evidence, predict which gets more engagement from their audience and say why in one sentence.

${voiceBlock(voice)}

Their posts most similar to each line, with engagement:
${evidence || '(no history)'}

<a>${a}</a>
<b>${b}</b>

Reply with only JSON: {"winner":"a"|"b","confidence":0.5-0.95,"why":"one sentence"}` };
    },
    digest({ week, best, worst, voice, niche }) {
      return { tier: 'default', json: true, schema: SCHEMA.digest, prompt: `${BRIEF}

Write a short Sunday note to a creator about their week on social media. Plain, warm, specific, no hype, no emoji.

This week: ${week}
Best post: ${best ? `"${best.text}" (${best.likes} likes, ${best.replies || 0} replies)` : 'none'}
Post that didn't land: ${worst ? `"${worst.text}" (${worst.likes} likes)` : 'none'}
Niche: ${niche || ''}
${voiceBlock(voice)}

Reply with only JSON: {"subject":"under 60 characters","headline":"one sentence on the week","why_best":"why the best one worked, one sentence","try_next":"one concrete thing to try next week","first_line":"a first line they could post Monday, in their voice"}` };
    },
    briefRead({ text, niche }) {
      return { tier: 'default', json: true, schema: SCHEMA.briefRead, prompt: `A creator dropped in a brief (notes, a doc, a transcript) and wants posts written from it. Read it like a careful editor before anyone writes a word.

<brief>
${text || '(see the attached document)'}
</brief>
${niche ? `Their niche: ${niche}` : ''}

Pull out:
- summary: two plain sentences on what this is.
- audience: who it's for, in a few words.
- facts: every concrete claim worth posting (numbers, results, dates, names), each with the exact words from the brief as "quote". Never paraphrase a number.
- gaps: what's missing that would make the post stronger or safer (a date, a result, a link, who it's for). Max 4, each one short sentence.
- careful: claims that need a source or would read as hype if posted as-is. Max 3.
- angles: 3 different ways in, each with a first line in plain words that uses only facts from the brief.

Reply with only JSON: {"title":"","summary":"","audience":"","facts":[{"fact":"","quote":""}],"gaps":[],"careful":[],"angles":[{"angle":"","line":""}]}` };
    },
    briefWrite({ text, read, angle, format, voice, limit = 280, platform = 'X' }) {
      const shape = { thread: `an X thread of 5-9 posts. Each post at most ${limit} characters (URLs count as 23). Post 1 is the hook and must work alone. One idea per post. No "1/" numbering unless it helps.`, long: `one long X post (X Premium allows up to 25,000 characters). Aim for 900-2,000 characters. The first 280 characters must stand alone, because X cuts there with "Show more". Short paragraphs, blank lines between.`, linkedin: 'one LinkedIn post up to 3,000 characters. The first two lines must earn the "…more" click. Short paragraphs, blank lines between, no hashtag pile.', single: `one post, at most ${limit} characters.` }[format] || '';
      return { tier: 'default', json: true, schema: SCHEMA.posts, prompt: `${BRIEF}

${voiceBlock(voice)}

Write ${shape}
Platform: ${platform}.

The brief:
<brief>
${text || '(see the attached document)'}
</brief>
${read ? `What an editor already pulled from it: ${JSON.stringify({ facts: read.facts, careful: read.careful })}` : ''}
Angle to take: ${angle || 'the strongest one'}

Rules: use only facts from the brief. Copy every number exactly. If a detail would help but isn't in the brief, write it as a [bracketed blank] instead of inventing it. Nothing from "careful" goes in without softening. Sound like the author, not like marketing.

Reply with only JSON: {"posts":["post 1","post 2"],"note":"one sentence on the choice you made"}` };
    },
    spoken({ text, voice, format = 'single', limit = 280 }) {
      return { tier: 'quick', json: true, schema: SCHEMA.posts, prompt: `${BRIEF}

${voiceBlock(voice)}

This was dictated out loud, so it rambles. Turn it into ${format === 'thread' ? `an X thread (each post at most ${limit} characters)` : `one post (at most ${limit} characters)`} in the author's voice. Keep their words and every fact; cut fillers, repeats and false starts. Don't add claims.

<spoken>
${text}
</spoken>

Reply with only JSON: {"posts":["..."]}` };
    },
    radarReplies({ posts, voice, niche }) {
      return { tier: 'default', json: true, schema: SCHEMA.radar, prompt: `${BRIEF}

${voiceBlock(voice)}
${niche ? `The author writes about: ${niche}.` : ''}

Write one early reply for each post below, from the author. The goal is replies that the post's readers find worth reading, so the author gets noticed for being useful, not loud.
Rules:
- Add something the post doesn't have: a specific number, a counterexample, a short first-hand story, or a sharp question that proves you read it.
- At most 220 characters. One idea.
- Never open with praise ("Great post", "This", "So true", "100%"). No emoji unless the author's voice uses them. Never pitch or link anything.
- If you have nothing real to add, give a short question instead of filler.
- Don't invent personal facts about the author; write [your number] or [your example] where only they can fill it in.

${posts.map((p, i) => `<post id="${i}" by="@${p.handle}">${p.text}</post>`).join('\n')}

Reply with only JSON: [{"id":0,"reply":"...","angle":"number|counterexample|story|question"}]` };
    },
    picture({ note, voice, niche }) {
      return { tier: 'default', json: true, schema: SCHEMA.picture, prompt: `${BRIEF}

${voiceBlock(voice)}
${niche ? `The author writes about: ${niche}.` : ''}

The author dropped in the attached picture (a screenshot, chart, dashboard, DM, receipt or photo) and wants a post about it.${note ? `\nWhat they want people to take from it: ${note}` : ''}

Read the picture carefully:
- what: one plain sentence on what it shows.
- kind: chart | dashboard | dm | tweet | receipt | photo | other.
- facts: every number or claim visible in it, with where it appears ("y-axis", "top-right total"). Copy numbers exactly; never estimate a number that isn't printed.
- private: names, @handles, emails, faces or order numbers of other people that should be blurred or cropped before posting. Empty if none.
- angles: 3 ways in, each with a first line that uses only what's visible (or the author's note).
- posts: one post (at most 280 characters) in the author's voice using the best angle.
- visual: if the picture shows a number that changed, {"template":"data","metric":"","before":"","after":""}; if one big number, {"template":"stat","value":"","label":""}; otherwise {"template":"quote"}.

Reply with only JSON: {"what":"","kind":"","facts":[{"fact":"","where":""}],"private":[],"angles":[{"angle":"","line":""}],"posts":[""],"visual":{}}` };
    },
    visual({ text, plan }) {
      return { tier: 'quick', json: true, schema: SCHEMA.visual, prompt: `You are the art director for one social media graphic that goes under this post. The graphic must make someone scrolling stop and get the point in one second.

<post>
${text}
</post>

A rules-based first pass suggested: ${JSON.stringify(plan)}

Pick the template that fits what the post is really about:
- "data": a number that changed (before → after). Needs two numbers from the post.
- "stat": one big number carries it.
- "list": 3+ parallel points.
- "compare": two sides (before/after in words, X vs Y).
- "quote": no strong numbers; the line itself is the picture.

Rules: copy numbers exactly as written in the post, never invent, round or convert one. Headline is at most 9 words, plain, in the author's words where possible, and doesn't repeat the big number. metric is 1-3 words naming what the number measures. emphasis is the 1-3 word phrase in the headline that carries the tension. why is one short sentence to the author on why this picture fits.

Reply with only JSON: {"template":"data|stat|list|compare|quote","headline":"","metric":"","before":"","after":"","value":"","label":"","items":[],"left":"","right":"","emphasis":"","why":""}` };
    },
    /* the hook tournament: every agent in the Room pitches one first line for the same post */
    room({ text, voice }) {
      return { tier: 'default', json: true, schema: SCHEMA.room, prompt: `${BRIEF}

${voiceBlock(voice)}

You're running a room of six agents competing over this post's first line. Each agent below pitches exactly one first line, in the author's voice, keeping every fact, number and name. Each pitch should sound like that agent's approach, so the six are clearly different from each other and from the draft. Whatever the approach, it should sound like a person talking to a friend, never like a marketer: no bait ("you won’t believe", "nobody is talking about"), no hype words, no emoji the author didn’t use, nothing added that isn’t in the draft.

${ROOM.map(r => `- ${r.k} (${r.n}, ${r.role}): ${r.how}`).join('\n')}

<draft>
${text}
</draft>

Reply with only JSON: {"lines":[{"agent":"mo","line":"..."}]} with one line for each of the six agents.` };
    },
    /* three stronger first lines are the product's core, so they get the writing model, not the quick one */
    critique({ text, voice }) {
      return { tier: 'default', json: true, schema: SCHEMA.critique, prompt: `${BRIEF}

${voiceBlock(voice)}

Grade only the first line of this post as a scroll-stopper for people who don't know the author yet, then write three stronger first lines.
${HOOK_CRAFT}
Each of the three uses a different move, strongest first, in the author's voice and casing, using only facts in the draft. At least two of the three must need nothing filled in; only where a move truly needs a number the draft doesn't have, write [your number].
<draft>
${text}
</draft>
Reply with only JSON: {"reason":"one plain sentence on the biggest issue or strength, quoting the words that cause it, e.g. “so i think” hedges a claim that's already yours","better":["three stronger first lines"]}` };
    }
  };

  /* "sounds like you": how far a draft drifts from the author's measured habits (0-100) and which words drift most */
  function voiceMatch(text, stats, { never = [], lean = [] } = {}) {
    const t = String(text || '').trim(); if (!t || !stats) return null;
    const miss = []; let score = 100;
    const sents = t.split(/(?<=[.!?])\s+|\n+/).filter(x => words(x).length >= 2);
    const wps = sents.length ? sents.reduce((a, x) => a + words(x).length, 0) / sents.length : 0;
    if (stats.wps && wps > stats.wps * 1.6 && wps - stats.wps > 6) { score -= 18; const long = sents.sort((x, y) => words(y).length - words(x).length)[0]; miss.push({ why: `Longer sentences than you write (${Math.round(wps)} words vs your ${stats.wps})`, frag: long }); }
    const em = (t.match(EMOJI) || []).length; if (stats.emojiPer < .2 && em >= 2) { score -= 14; miss.push({ why: 'More emoji than you use', frag: (t.match(EMOJI) || [])[0] }); }
    const tags = t.match(/#\w+/g) || []; if (stats.tagsPer < .1 && tags.length) { score -= 14; miss.push({ why: 'You never use hashtags', frag: tags[0] }); }
    const lowerOpen = /^[a-z]/.test(t); if (stats.lower >= 70 && !lowerOpen && /^[A-Z]/.test(t)) { score -= 8; miss.push({ why: 'You usually open in lowercase', frag: t.split(/\s/)[0] }); }
    if (stats.lower <= 15 && lowerOpen) { score -= 8; miss.push({ why: 'You usually capitalize your first word', frag: t.split(/\s/)[0] }); }
    const bad = never.find(w => t.toLowerCase().includes(String(w).toLowerCase())); if (bad) { score -= 22; miss.push({ why: `“${bad}” is on your never-say list`, frag: bad }); }
    const tell = (t.match(/\b(delve|game[- ]changer|unlock|leverage|elevate|supercharge|seamless|in today's|in today’s|it's not just|here's the thing|let that sink in)\b/gi) || []).find(x => x.toLowerCase() !== String(bad || '').toLowerCase()); if (tell) { score -= 16; miss.push({ why: 'Reads like AI wrote it', frag: tell }); }
    if ((t.match(/—/g) || []).length >= 3) { score -= 8; miss.push({ why: 'A lot of em dashes', frag: '—' }); }
    if ((t.match(/!/g) || []).length >= 2 && stats.emojiPer < .3) { score -= 6; miss.push({ why: 'More exclamation marks than you use', frag: '!' }); }
    const ws = new Set(words(t)); const hits = lean.filter(l => ws.has(String(l.w || l).toLowerCase())).length; if (hits) score = Math.min(100, score + 3 * hits);
    return { score: clamp(Math.round(score), 5, 100), miss };
  }
  /* predict engagement for a line from the author's most similar past posts (k nearest by shared words + kind) */
  function predictFromHistory(line, posts, k = 5) {
    const bag = x => new Set(words(x).filter(w => w.length > 2 && !STOP.has(w))); const a = bag(line), ka = kindOf(line);
    const scored = (posts || []).map(p => { const b = bag(p.text.split('\n')[0]); let n = 0; a.forEach(w => b.has(w) && n++); const sim = n / Math.max(1, Math.min(a.size, b.size)) + (kindOf(p.text) === ka ? .35 : 0); return { p, sim }; }).filter(x => x.sim > 0).sort((x, y) => y.sim - x.sim).slice(0, k);
    if (!scored.length) return null;
    const med = median(scored.map(x => eng(x.p)));
    return { estimate: Math.round(med * (0.75 + hookScore(line).score / 200)), near: scored.map(x => x.p) };
  }

  /* ---- the visual director: read a post, decide what picture it wants, pull the exact numbers out ----
     Never invents a figure: every number it returns is copied from the text. */
  const NUM = '(?<![\\d,])[$€£]?\\d[\\d,]*(?:\\.\\d+)?\\s?(?:%|[kKmMbB]\\b|x\\b|×)?';
  const numVal = x => { const m = String(x).replace(/[$€£,\s]/g, ''); const v = parseFloat(m); return isFinite(v) ? v * (/k$/i.test(m) ? 1e3 : /m$/i.test(m) ? 1e6 : /b$/i.test(m) ? 1e9 : 1) : NaN; };
  const LOWER_BETTER = /\b(churn|cost|costs|cac|spend|time|hours|days|minutes|weeks|steps|screens|clicks|bugs|errors|tickets|latency|bounce|refunds|meetings|emails|fields|pages)\b/i;
  const METRIC_SKIP = new Set(['went', 'from', 'grew', 'rose', 'jumped', 'fell', 'dropped', 'climbed', 'up', 'down', 'is', 'was', 'are', 'were', 'our', 'my', 'the', 'we', 'i', 'and', 'cut', 'took', 'moved', 'increased', 'decreased', 'by', 'to', 'a', 'an', 'its', 'it', 'their', 'went', 'got', 'have', 'has', 'had', 'just', 'redesigned', 'reduced', 'grown', 'doubled', 'tripled', 'in', 'of', 'on', 'with', 'at']);
  const sentences = t => t.split(/(?<=[.!?])\s+|\n+/).map(x => x.trim()).filter(Boolean);
  const clipW = (t, n) => t.length <= n ? t : t.slice(0, n).replace(/\s+\S*$/, '') + '…';
  function metricBefore(pre) {
    const ws = pre.replace(/[^\w\s'-]/g, ' ').split(/\s+/).filter(Boolean); const out = [];
    for (let i = ws.length - 1; i >= 0 && out.length < 2; i--) { const w = ws[i].toLowerCase(); if (METRIC_SKIP.has(w)) { if (out.length) break; continue; } if (/^\d/.test(w)) break; out.unshift(ws[i]); }
    return out.join(' ');
  }
  function visualPlan(text) {
    const t = String(text || '').trim(); const lines = t.split('\n').map(x => x.trim()).filter(Boolean); const sents = sentences(t);
    const first = lines[0] || '';
    /* 1. a number that moved: "21% → 38%", "from 7 screens to 2", "$0 to $10k MRR" */
    const pairRe = new RegExp(`(${NUM})(?:\\s+([A-Za-z]{3,}))?\\s*(?:→|->|➝|—>|\\bto\\b)\\s*(${NUM})(?:\\s+([A-Za-z][A-Za-z]+))?`, 'g');
    const pairs = []; let m;
    while ((m = pairRe.exec(t))) {
      const a = numVal(m[1]), b = numVal(m[3]); if (!isFinite(a) || !isFinite(b) || a === b) continue;
      if (/^(19|20)\d\d$/.test(m[1].trim()) && /^(19|20)\d\d$/.test(m[3].trim())) continue;
      const sent = sents.find(s => s.includes(m[0])) || first; const pre = sent.slice(0, Math.max(0, sent.indexOf(m[0])));
      const unit = m[2] && !/^(to|from|and|in|of)$/i.test(m[2]) ? m[2] : ''; const after = m[4] && /^[A-Z]{2,5}$/.test(m[4]) ? m[4] : '';
      let metric = metricBefore(pre); if (unit) metric = metric ? `${metric} ${unit}` : unit; if (!metric && after) metric = after;
      const la = m[1].trim(), lb = (m[3].trim() + (/[%$kKmM]/.test(m[3]) || !/%/.test(m[1]) ? '' : '%')).trim();
      const score = (/[%$€£]/.test(m[0]) ? 2 : 0) + (metric ? 1 : 0) + Math.min(2, Math.abs(Math.log((b || .1) / (a || .1))));
      pairs.push({ raw: m[0], a, b, la, lb, unit, metric, sent, score });
    }
    if (pairs.length) {
      const main = pairs.slice().sort((x, y) => y.score - x.score)[0], second = pairs.find(p => p !== main);
      const lower = LOWER_BETTER.test(`${main.metric} ${main.unit}`), good = (main.b > main.a) !== lower;
      const delta = main.a ? (main.b / main.a >= 3 ? `${+(main.b / main.a).toFixed(1)}×` : `${main.b > main.a ? '+' : '−'}${Math.abs(Math.round((main.b - main.a) / main.a * 100))}%`) : 'from zero';
      /* a headline from another sentence only if it doesn't bring its own unrelated number (that would caption the wrong chart) */
      const own = x => { const re = new RegExp(NUM, 'g'); let k, left = x; pairs.forEach(p => { left = left.split(p.raw).join(' '); }); while ((k = re.exec(left))) if (/\d/.test(k[0])) return true; return false; };
      const head = sents.find(s => !s.includes(main.raw) && !/:$/.test(s) && !own(s)) || main.sent;
      return { template: 'data', headline: clipW(head, 90), metric: main.metric ? main.metric[0].toUpperCase() + main.metric.slice(1) : 'The result', before: main.la, after: main.lb, a: main.a, b: main.b, unit: main.unit, delta, good, lowerBetter: lower,
        chip: second && !head.includes(second.raw) ? `${second.la} → ${second.lb}${second.unit ? ' ' + second.unit : ''}` : '', why: `You wrote ${main.la} → ${main.lb}. A number that moves is the fastest thing to read in a feed.` };
    }
    /* 2. before / after as words */
    const ba = t.match(/(?:^|\n)\s*(?:before|old way|then)\s*[:\-–]\s*(.+)\n+\s*(?:after|new way|now)\s*[:\-–]\s*(.+)/i) || t.match(/^(.{3,60}?)\s+vs\.?\s+(.{3,60}?)[.!?]?$/im);
    if (ba) {
      const na = ba[1].trim().match(new RegExp(`^(${NUM})\\s+(.+)$`)), nb = ba[2].trim().match(new RegExp(`^(${NUM})\\s+(.+)$`));
      if (na && nb && na[2].toLowerCase() === nb[2].toLowerCase()) { const A = numVal(na[1]), B = numVal(nb[1]), metric = na[2][0].toUpperCase() + na[2].slice(1), lower = LOWER_BETTER.test(metric);
        return { template: 'data', headline: clipW(lines.find(l => !l.includes(ba[1]) && !l.includes(ba[2])) || '', 90), metric, before: na[1].trim(), after: nb[1].trim(), a: A, b: B, unit: '', delta: A ? (B / A >= 3 ? `${+(B / A).toFixed(1)}×` : `${B > A ? '+' : '−'}${Math.abs(Math.round((B - A) / A * 100))}%`) : 'from zero', good: (B > A) !== lower, lowerBetter: lower, chip: '', why: `You wrote ${na[1].trim()} → ${nb[1].trim()}. A number that moves is the fastest thing to read in a feed.` }; }
    }
    if (ba) return { template: 'compare', headline: clipW(lines.find(l => !l.includes(ba[1]) && !l.includes(ba[2])) || '', 80), left: clipW(ba[1].trim(), 90), right: clipW(ba[2].trim(), 90), leftLabel: /vs/i.test(ba[0]) ? '' : 'Before', rightLabel: /vs/i.test(ba[0]) ? '' : 'After', why: 'Two sides, side by side. The eye does the comparing for you.' };
    /* 3. a list people save */
    const bullet = /^(?:\d{1,2}[.)]|[-•–→✓*▸])\s+/; const items = lines.filter(l => bullet.test(l)).map(l => l.replace(bullet, '').trim()).filter(Boolean);
    if (items.length >= 3) return { template: 'list', headline: clipW(lines.find(l => !bullet.test(l)) || '', 80), items: items.slice(0, 6).map(i => clipW(i, 80)), why: `${items.length} points. Lists get saved, and saves travel.` };
    /* 4. one big number */
    const numRe = new RegExp(`(${NUM})(?:\\s+([A-Za-z][A-Za-z-]+(?:\\s[a-z][a-z-]+)?))?`, 'g'); const cands = [];
    while ((m = numRe.exec(t))) { const raw = m[1].trim(), v = numVal(raw); if (!isFinite(v)) continue; if (/^(19|20)\d\d$/.test(raw) || /^\d{1,2}(:\d\d)?\s?(am|pm)/i.test(t.slice(m.index, m.index + 8))) continue;
      const weight = (/[$€£]/.test(raw) ? 3 : 0) + (/%/.test(raw) ? 3 : 0) + (/[kmb]$/i.test(raw) ? 2 : 0) + (v >= 100 ? 1 : 0) + (v >= 1000 ? 1 : 0); if (weight < 2) continue;
      const sent = sents.find(s => s.includes(m[0])) || first; const label = (m[2] && !STOP.has(m[2].split(' ')[0].toLowerCase()) ? m[2] : metricBefore(sent.slice(0, sent.indexOf(raw)))) || '';
      cands.push({ raw, label, sent, weight }); }
    if (cands.length) { const c = cands.sort((x, y) => y.weight - x.weight)[0]; return { template: 'stat', value: c.raw, label: c.label ? c.label[0].toUpperCase() + c.label.slice(1) : '', headline: clipW(c.sent, 110), why: `One figure does the work: ${c.raw}. Big numbers stop thumbs.` }; }
    /* 5. the line itself */
    const line = clipW(first.length > 12 ? first : (sents[0] || t), 180);
    const ws = line.split(/\s+/); let emph = '';
    const nx = ws.findIndex(w => /^(not|never|stop|nobody|everyone|only|wrong|best|worst|always|quit|fired|lost|failed)$/i.test(w.replace(/[^\w]/g, '')));
    if (nx >= 0) { const nxt = (ws[nx + 1] || '').replace(/[^\w']/g, ''); emph = (nxt && !STOP.has(nxt.toLowerCase()) && !/[.,;:!?]$/.test(ws[nx]) ? ws.slice(nx, nx + 2).join(' ') : ws[nx]).replace(/[.,;:!?]+$/, ''); }
    else { const content = ws.filter(w => w.replace(/[^\w]/g, '').length > 3 && !STOP.has(w.toLowerCase().replace(/[^\w']/g, ''))); emph = (content[content.length - 1] || '').replace(/[.,;:!?]+$/, ''); }
    return { template: 'quote', headline: line, emphasis: emph, why: 'No numbers here, so your line is the picture. Set big, one phrase marked.' };
  }

  /* ---- briefs: read what a creator drops in, keep the facts straight, draft from it ---- */
  const normNum = x => String(x).toLowerCase().replace(/[,\s]/g, '').replace(/\.0+(?=\D|$)/, '');
  /* numbers in the draft that the source never says: the things to double-check before posting */
  function factCheck(draft, source) {
    const src = normNum(source), out = [], seen = new Set(), re = new RegExp(NUM, 'g'); let m;
    const d = String(draft || '').replace(/\[[^\]]*\]/g, ' ');
    while ((m = re.exec(d))) { const raw = m[0].trim(), n = normNum(raw); if (!/\d/.test(n) || seen.has(n)) continue; seen.add(n); const bare = n.replace(/[$€£%kmbx×]/g, ''); if (/^\d$/.test(bare) && !/[$%]/.test(raw)) continue; if (!src.includes(n) && !src.includes(bare)) out.push(raw); }
    return out;
  }
  const FILLERS = /\b(?:um+|uh+|erm+|er|ah+|hmm+|you know|i mean|like,|sort of|kind of|basically|literally|actually|so yeah|yeah so|okay so)\b[,.]?\s*/gi;
  /* spoken → written: drop fillers and stutters, fix "i", capitalize sentences, keep the words */
  function tidySpoken(text) {
    let t = String(text || '').replace(FILLERS, '').replace(/\b(\w+)(\s+\1\b)+/gi, '$1').replace(/\bi\b/g, 'I').replace(/\bi'(m|ve|ll|d)\b/gi, "I'$1").replace(/\s+([,.!?])/g, '$1').replace(/[ \t]{2,}/g, ' ');
    t = t.replace(/(^|[.!?]\s+|\n\s*)([a-z])/g, (_, a, b) => a + b.toUpperCase()).trim();
    if (t && !/[.!?:…)"'”]$/.test(t)) t += '.';
    return t;
  }
  /* offline read of a brief: summary, the facts with their own words, gaps worth filling, and angles */
  const factWeight = x => { let w = 0; if (/(?:→|->|\bfrom\b.{0,40}?\bto\b)/i.test(x) && /\d/.test(x)) w += 4; if (/[$€£]\s?\d|\d\s?%/.test(x)) w += 3; if (/\d[\d,]*\s?(?:k|m|x|×|s|ms|hours?|days?|weeks?|months?|years?|users?|teams?|customers?|people|signups?|followers?)\b/i.test(x)) w += 2; if (/\d{1,3}(,\d{3})+/.test(x)) w += 1; if (!w && /\d/.test(x.replace(/\b\d+\.\d+\b/g, ''))) w += 1; return w; };
  const HYPE = /\b(best|first|only|#1|guaranteed|always|never|everyone|nobody|fastest|cheapest|revolutionary|game.?changer|ever made|world.?class)\b/i;
  const CTA = /\b(sign ?up|join|try it|try the|download|waitlist|link in|buy|get it|book a)\b/i;
  function briefRead(text) {
    const t = String(text || '').replace(/\r/g, '').trim(); const isHead = x => !/[.!?:;)"”]$/.test(x) && x.split(/\s+/).length <= 9;
    const all = sentences(t), heads = all.filter(isHead), sents = all.filter(x => x.length > 12 && x.length < 400 && !isHead(x));
    const careful = sents.filter(x => HYPE.test(x) && !factWeight(x)).slice(0, 3);
    const facts = sents.map(x => ({ x, w: factWeight(x) })).filter(f => f.w > 0).sort((a, b) => b.w - a.w).slice(0, 8).map(f => ({ fact: clipW(f.x, 140), quote: f.x, weight: f.w }));
    const story = sents.find(x => /\b(we|i)\b/i.test(x) && !factWeight(x) && !careful.includes(x) && !CTA.test(x));
    const cta = sents.find(x => CTA.test(x));
    const ctx = sents[0] && !careful.includes(sents[0]) && sents[0] !== cta ? sents[0] : null;
    const key = [...facts.map(f => f.quote), ctx, story, ...sents.filter(x => !careful.includes(x) && x !== cta)].filter((x, i, a) => x && a.indexOf(x) === i).slice(0, 6);
    const lesson = sents.find(x => /(because|learn(ed|t)?|lesson|turns out|realised|realized|mistake|instead)/i.test(x) && !careful.includes(x));
    const gaps = [];
    if (!facts.some(f => f.weight >= 2)) gaps.push('No hard numbers yet. One real result (a %, a $, a count) makes it believable.');
    if (/\b(launch|launching|release|shipping|going live)\b/i.test(t) && !/\b(today|tomorrow|tonight|next week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\b|\b\d{1,2}(st|nd|rd|th)\b/i.test(t)) gaps.push('It mentions a launch but not when. Add the date?');
    if (cta && !/https?:\/\//.test(t)) gaps.push('It asks people to act but there’s no link. Add one (on X it goes in a reply).');
    if (!/\b(for|founders?|creators?|developers?|designers?|marketers?|teams?|people who|anyone who)\b/i.test(t)) gaps.push('Who is it for? Naming the reader sharpens the first line.');
    const strip = x => x.replace(/[.!?]+$/, '');
    const angles = [
      facts[0] && { angle: 'Lead with the result', line: facts[0].quote },
      story && { angle: 'The story behind it', line: `${strip(story)}. Here’s what it took.` },
      lesson && { angle: 'The lesson', line: lesson },
      ctx && facts[0] && { angle: 'Straight news', line: `${strip(ctx)}. ${facts[0].quote}` }
    ].filter(Boolean);
    return { title: clipW(strip((heads[0] || sents[0] || t.split('\n')[0] || 'Your brief').trim()), 70), summary: clipW(sents.slice(0, 2).join(' ') || t, 260), words: (t.match(/\S+/g) || []).length, facts, key, gaps: gaps.slice(0, 4), careful: careful.map(x => clipW(x, 120)), cta: cta || '', angles };
  }
  /* offline draft from a brief: a hook from the chosen angle, one point per post, the ask last */
  function briefDraft(text, { format = 'thread', limit = 280, angle = 0 } = {}) {
    const r = briefRead(text), a = r.angles[angle] || r.angles[0]; const hook = a ? a.line : r.key[0] || '';
    const first = r.key.find(k => /^[A-Z]/.test(k) && !/\d/.test(k.replace(/\b\d+\.\d+\b/g, '')) && k !== hook);
    const pts = [first, ...r.key].filter((k, i, a) => k && a.indexOf(k) === i && !hook.includes(k.replace(/[.!?]+$/, '')) && !k.includes(hook.replace(/[.!?]+$/, ''))).slice(0, 5);
    const close = r.cta ? `${r.cta.replace(/[.!?]+$/, '')}: [link]` : 'Which part do you want me to go deeper on?';
    const fit = (x, n) => { x = x.trim(); if ([...x].length <= n) return x; return x.slice(0, n - 1).replace(/\s+\S*$/, '') + '…'; };
    if (format === 'thread') return [fit(hook, limit), ...pts.map(p => fit(p, limit)), fit(close, limit)];
    if (format === 'single') return [fit(hook, limit)];
    return [fit([hook, '', ...pts.flatMap(p => [p, '']), close].join('\n').replace(/\n{3,}/g, '\n\n').trim(), limit)];
  }

  /* ---------------- a hook score that learns from you ----------------
     The general score is a set of rules. This one checks which first-line traits actually earned more on
     YOUR posts (median with vs without, shrunk toward "no effect" when there are few examples), then scores
     a new line by where it would rank among your own posts. It is tested before it is trusted: fitted on
     your older posts, scored on your newest ones, and compared with the general score on the same posts. */
  const KIND_PL = Object.fromEntries(Object.keys(KIND_NAMES).map(k => [k, KIND_NAMES[k][1]]));
  const firstOf = t => { const ls = String(t || '').replace(/https?:\/\/\S+/g, '').split('\n').map(l => l.trim()).filter(Boolean); let f = ls[0] || ''; if (f.length < 40 && ls[1]) f += ' ' + ls[1]; return f; };
  const TRAITS = [
    { k: 'number', label: 'a number in line one', add: 'Put a real number in line one', f: f => /\d/.test(f) },
    { k: 'money', label: 'a $ or % in line one', add: 'Use the $ or % figure', f: f => /[$€£%]/.test(f) },
    { k: 'question', label: 'a question in line one', add: 'Open with the question', f: f => /\?\s*$/.test(f) },
    { k: 'lower', label: 'a lowercase opener', add: 'Start lowercase', f: f => /^[a-z]/.test(f) },
    { k: 'short', label: 'a first line under 60 characters', add: 'Cut line one under 60 characters', f: f => f.length < 60 },
    { k: 'long', label: 'a first line over 120 characters', f: f => f.length > 120 },
    { k: 'me', label: '“I” or “we” in line one', add: 'Make it yours: “I” or “we”', f: f => /\b(i|my|me|we|our)\b/i.test(f) },
    { k: 'you', label: '“you” in line one', add: 'Talk to the reader: “you”', f: f => /\b(you|your)\b/i.test(f) },
    { k: 'emoji', label: 'an emoji in line one', f: f => /\p{Extended_Pictographic}/u.test(f) },
    { k: 'loop', label: 'an open loop (a colon, ↓ or 🧵)', add: 'End line one on a colon or ↓', f: f => /[:…]\s*$|↓|👇|🧵/.test(f) },
    { k: 'push', label: 'pushing back on common advice', add: 'Push back on something people repeat', f: f => /\b(unpopular|overrated|underrated|wrong|myth|lie|stop|don[’']?t|nobody|hot take|never|quit)\b/i.test(f) },
    { k: 'command', label: 'opening with a command', add: 'Open with a command', f: f => /^(stop|start|quit|double|charge|raise|cut|ship|write|build|never|don[’']?t|forget|ignore|delete|kill|hire|ask|steal|try|drop)\b/i.test(f) },
    { k: 'link', label: 'a link in the post', f: (f, t) => /https?:\/\//.test(t) },
    { k: 'tags', label: 'hashtags', f: (f, t) => /(^|\s)#\w/.test(t) },
    { k: 'thread', label: 'a thread', add: 'Make it a thread', f: (f, t, p) => !!(p && ((p.thread && p.thread.length) || p.parts > 1)) }
  ];
  const traitsOf = (text, p) => { const f = firstOf(text), out = TRAITS.filter(x => x.f(f, String(text || ''), p)).map(x => x.k); out.push('kind:' + kindOf(text)); return out; };
  const ranks = a => { const idx = a.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]); const r = new Array(a.length); for (let i = 0; i < idx.length;) { let j = i; while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++; for (let k = i; k <= j; k++) r[idx[k][1]] = (i + j) / 2; i = j + 1; } return r; };
  const spearman = (a, b) => pearson(ranks(a), ranks(b));
  /* ridge regression on log engagement: each trait's effect with the others held equal, pulled toward zero */
  function solve(A, b) { const n = b.length, M = A.map((r, i) => [...r, b[i]]); for (let c = 0; c < n; c++) { let piv = c; for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r; [M[c], M[piv]] = [M[piv], M[c]]; const d = M[c][c] || 1e-9; for (let r = 0; r < n; r++) if (r !== c) { const f = M[r][c] / d; for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k]; } } return M.map((r, i) => r[n] / (r[i] || 1e-9)); }
  function fitHooks(posts, lambda = 6) {
    const rows = posts.map(p => ({ t: traitsOf(p.text, p), e: eng(p) }));
    const keys = [...new Set(rows.flatMap(r => r.t))].filter(k => { const a = rows.filter(r => r.t.includes(k)).length; return a >= 5 && rows.length - a >= 5; });
    const y = rows.map(r => Math.log1p(r.e)), my = y.reduce((a, b) => a + b, 0) / y.length;
    const X = rows.map(r => keys.map(k => r.t.includes(k) ? 1 : 0)), mx = keys.map((_, j) => X.reduce((a, r) => a + r[j], 0) / X.length);
    const A = keys.map((_, i) => keys.map((_, j) => X.reduce((a, r) => a + (r[i] - mx[i]) * (r[j] - mx[j]), 0) + (i === j ? lambda : 0)));
    const b = keys.map((_, i) => X.reduce((a, r, n) => a + (r[i] - mx[i]) * (y[n] - my), 0));
    const beta = keys.length ? solve(A, b) : [];
    const w = {}, info = [];
    keys.forEach((k, i) => {
      w[k] = beta[i]; const n = rows.filter(r => r.t.includes(k)).length;
      const tr = TRAITS.find(t => t.k === k), kind = k.startsWith('kind:') ? k.slice(5) : null;
      info.push({ k, label: kind ? KIND_PL[kind] || kind : tr.label, add: kind ? null : tr.add || null, kind, n, x: +Math.exp(beta[i]).toFixed(2), w: +beta[i].toFixed(3) });
    });
    const lp = r => r.t.reduce((s, k) => s + (w[k] || 0), 0);
    return { w, info, lps: rows.map(lp).sort((a, c) => a - c), lp };
  }
  function learnHooks(posts, { min = 30 } = {}) {
    const P = (posts || []).filter(p => p && p.text && p.text.trim());
    const withNums = P.filter(p => eng(p) > 0);
    if (withNums.length < min) return { ready: false, n: withNums.length, need: min };
    /* test before trusting: fit on the older 75%, score the newest 25% */
    const dated = withNums.filter(p => p.at).sort((a, b) => a.at - b.at), pool = dated.length >= min ? dated : withNums.slice().reverse();
    const cut = Math.floor(pool.length * .75), train = pool.slice(0, cut), test = pool.slice(cut);
    let val = null;
    if (test.length >= 8) { const m = fitHooks(train); const act = test.map(eng); const mine = test.map(p => m.lp({ t: traitsOf(p.text, p) })), gen = test.map(p => hookScore(p.text).score);
      val = { r: +spearman(mine, act).toFixed(2), rGeneral: +spearman(gen, act).toFixed(2), n: test.length }; }
    const m = fitHooks(withNums); const mid = median(m.lps);
    const trust = !val ? 'untested' : val.r >= .1 && val.r >= val.rGeneral + .03 ? 'better' : val.r >= .1 ? 'similar' : 'weak';
    const kinds = m.info.filter(i => i.kind && i.n >= 5).sort((a, b) => b.x - a.x);
    const vs = kinds.length >= 2 && kinds[0].x / kinds[kinds.length - 1].x >= 1.3 ? { best: kinds[0], worst: kinds[kinds.length - 1], x: +(kinds[0].x / kinds[kinds.length - 1].x).toFixed(1) } : null;
    return { ready: true, n: withNums.length, median: median(withNums.map(eng)), w: m.w, traits: m.info.sort((a, b) => Math.abs(b.w) - Math.abs(a.w)), lps: m.lps, mid, val, trust, vs };
  }
  function personalScore(text, model, { parts = 1 } = {}) {
    if (!model || !model.ready || !String(text || '').trim()) return null;
    const have = traitsOf(text, { parts }), lp = have.reduce((s, k) => s + (model.w[k] || 0), 0), L = model.lps;
    let below = 0, same = 0; for (const v of L) { if (v < lp - 1e-9) below++; else if (Math.abs(v - lp) <= 1e-9) same++; }
    const pct = (below + same / 2) / Math.max(1, L.length);
    const byK = Object.fromEntries(model.traits.map(t => [t.k, t]));
    const helps = have.map(k => byK[k]).filter(t => t && t.w > .05).sort((a, b) => b.w - a.w).slice(0, 2);
    const hurts = have.map(k => byK[k]).filter(t => t && t.w < -.05).sort((a, b) => a.w - b.w).slice(0, 2);
    const clash = { short: ['long'], long: ['short'] };
    const tryNext = model.traits.filter(t => t.add && t.w > .1 && t.x >= 1.2 && !have.includes(t.k) && !(clash[t.k] || []).some(c => have.includes(c))).sort((a, b) => b.w - a.w)[0] || null;
    return { score: clamp(Math.round(5 + pct * 94), 5, 99), x: +Math.exp(lp - model.mid).toFixed(1), helps, hurts, tryNext, trust: model.trust, n: model.n };
  }

  /* pre-post rules shared with the server's /api/v1/check and the MCP server */
  const CRINGE = [
    { re: /\b(?:I['’]?m|I am|we['’]re|we are) (?:so |super |beyond )?(?:humbled|thrilled|excited|delighted|honou?red) to (?:announce|share)(?: that)?/i, msg: 'Opens like a press release.' },
    { re: /\b(?:Let that sink in|Read that again)\b/i, msg: '“Let that sink in” tells people how to feel.' },
    { re: /\b(?:Agree|Thoughts|Am I wrong)\s*\?\s*$/i, msg: 'Ends on a bait question. End on your point instead.' },
    { re: /\bnobody(?: is|['’]s) talking about\b/i, msg: '“Nobody is talking about this” is a cliché. Say what you noticed.' },
    { re: /(?:(?:🚀|🔥|💯|🙌|👏)\s*){3,}/u, msg: 'An emoji pile-up.' }
  ];
  /* platform 'x' (the default) counts the way X does: links 23, emoji and CJK 2; elsewhere one per character */
  function checkPost(text, { never = [], limit = 280, platform = 'x' } = {}) {
    const out = []; const t = String(text || ''); const len = /^(x|twitter)$/i.test(String(platform || 'x')) ? xLength(t) : [...t].length;
    if (/\[[^\]\n]{1,40}\]|\bTK\b|\bTODO\b/i.test(t)) out.push('Still has a blank to fill.');
    if (len > limit) out.push(`${len - limit} characters over the ${limit} limit.`);
    if ((t.match(/#\w+/g) || []).length > 2) out.push('More than two hashtags reads like a bot.');
    if (/\bhttps?:\/\//.test(t.split('\n')[0])) out.push('A link in the first post shrinks reach on X and LinkedIn. Put it in a reply.');
    CRINGE.forEach(c => { if (c.re.test(t)) out.push(c.msg); });
    never.forEach(w => { if (t.toLowerCase().includes(String(w).toLowerCase())) out.push(`Uses “${w}”, which is on the never-say list.`); });
    return out;
  }

  /* ---------------- Sharpen engine ----------------
     One pipeline for Sharpen (selected words) and Basic-mode rewrites, and the checks Claude's versions go through.
     1. Snap the selection to whole words, so a sloppy drag never leaves half a word behind.
     2. Rewrite only the chosen words. Moves that reshape a sentence (a question, a split, a reorder) run only on
        sentences selected whole; part of a sentence only gets word-level edits.
     3. Fit the seams: spacing, casing at sentence starts, end punctuation, a/an, and no word repeated across the join.
     4. Keep only versions that changed something real, keep every number, ticker, name and "not", add no number,
        hype or AI tell, do what the option says, and differ from each other.
     Nothing passes? An honest note that says what was checked, never "already good". */
  const SH_OPTS = ['punchier', 'shorter', 'clearer', 'bolder', 'human'];
  const SH_LABEL = { punchier: 'Punchier', shorter: 'Shorter', clearer: 'Clearer', bolder: 'Bolder', human: 'More human' };
  const WCH = /[\p{L}\p{N}$%’'_]/u;
  const lcw = s => String(s).toLowerCase().replace(/’/g, "'");
  /* how the author writes: lowercase sentence starts (CT style), a lowercase "i", which apostrophe, contractions without one */
  function styleOf(post) {
    const t = String(post || '');
    const starts = [...t.matchAll(/(?:^|[.!?]["”’)]*\s+|\n\s*)([A-Za-z][\w’']*)/g)].map(m => m[1]).filter(w => !/^[A-Z]{2,}$/.test(w) && !/^I(['’]\w+)?$/.test(w));
    const low = starts.length ? starts.filter(w => w[0] === w[0].toLowerCase()).length / starts.length >= .5 : false;
    const cnt = (x, re) => (x.match(re) || []).length;
    const loI = cnt(t, /(?:^|[\s(])i(?=\s|['’]|$)/g) > cnt(t, /(?:^|[\s(])I(?=\s|['’]|$)/g);
    const noApos = /\b(dont|didnt|cant|wont|isnt|doesnt|im|ive|thats|youre|wasnt|arent)\b/.test(t) && !/\b\w+['’](t|s|m|re|ve|ll|d)\b/.test(t);
    const apos = /\b\w+'(t|s|m|re|ve|ll|d)\b/.test(t) && !/’/.test(t) ? "'" : '’';
    return { low, loI, noApos, apos };
  }
  const isStop = pre => !pre.trim() || /(?:[.!?…]["”’)]*|\n)\s*$/.test(pre);
  const capFirst = s => s.replace(/^(\s*["“(]?)([a-z])/, (m, a, c) => a + c.toUpperCase());
  const lowFirst = s => s.replace(/^(\s*["“(]?)([A-Z])(?![A-Z’'])/, (m, a, c) => a + c.toLowerCase()).replace(/^(\s*)I(?=\s|['’])/, '$1I');
  /* phrase lists: [regex, replacement]. Hedges and warm-ups go; the claim stays */
  const HEDGE_RX = [
    /\b(?:i['’]?m not gonna lie|not gonna lie|gonna be honest|to be honest|if i['’]?m (?:being )?honest|in my (?:humble )?opinion|for what it['’]?s worth),?\s*/gi,
    /(?<!\bas an? [^,.!?]{2,40},\s?)\bi (?:really |just |honestly |personally |actually |genuinely |truly |firmly |strongly |do |kind of |kinda |sort of )?(?:think|believe|feel like|feel that|reckon|guess)(?: that)?(?! about| of\b| through| back| so\b| twice| again| too| in\b)(?:,\s*|\s+|(?=[.!?]|$))/gi,
    /(?:^|(?<=[\s(]))(?:honestly|tbh|ngl|imo|imho|basically|literally|kinda|sorta)\b,?\s*/gi,
    /(?:^|(?<=[\s(]))(?<!\b(?:what|who|which|that|you['’]re|you are) )actually\b(?! (?:liked?|loved?|prefer(?:red|s)?|matters?|works?|worked|happened|need(?:ed|s)?|want(?:ed|s)?|read|use[ds]?|cares?|cared)\b),?\s*/gi,
    /\b(?:kind|sort) of\s+(?=[a-z])(?!a (?:big deal|thing|mess|legend|genius|joke|vibe)\b)/gi,
    /(?<!\b(?:really|very|so|super),?\s)\b(?:really|very|quite|somewhat|fairly|truly)\s+(?=[a-z$])(?!(?:really|very|so|super)\b)/gi,
    /\bpretty (?:much )?(?=(?:good|bad|big|sure|hard|easy|clear|wild|crazy|simple|obvious|quiet|weak|strong|boring)\b)/gi,
    /\bpretty much\s+/gi,
    /\b(?:probably|perhaps|maybe)\b(?! (?:i|i['’]m|i am|i['’]ll|we|we['’]re|you|you['’]re|it|it['’]s|not|they|he|she|this|that|the real)\b),?\s*/gi,
    new RegExp(String.raw`(?<!,\s?)(?<!\b(?:not|only|is it|it['’]s|it is|that['’]s|that is|i['’]m|you['’]re) )\bjust\s+(?!(?:a|an|the|one|two|three|four|five|six|\d|now|as|like|because|in case|about|enough|people|for|to|in|starting|getting|me|can['’]?t|cannot|couldn['’]?t|won['’]?t|don['’]?t|didn['’]?t)\b|${JUST_PAST})`, 'gi')
  ];
  const OPENER_RX = /^(?:ok(?:ay)?,?\s+so|so|well|look|anyway|okay|ok|alright)\b,?\s+(?=[a-z$])/i;
  const TAIL_RX = /(?:,?\s+|^)(?:tbh|imo|imho|ngl|lol|lmao|i guess|idk|fr|for real)\s*(?=[.!?]*\s*$)/i;
  const WORDY = [
    [/\bin order to\b/gi, 'to'], [/\bdue to the fact that\b/gi, 'because'], [/\b(?:the|a) majority of\b/gi, 'most'], [/\bat this point in time\b/gi, 'now'],
    [/\b(is|are) able to\b/gi, 'can'], [/\bhas the ability to\b/gi, 'can'], [/\ba number of\b/gi, 'some'], [/\bon a daily basis\b/gi, 'daily'], [/\beach and every\b/gi, 'every'], [/\bevery single\b/gi, 'every'],
    [/\bfirst and foremost\b/gi, 'first'], [/\b(people|someone|anyone|those|ones|folks|founders|teams?|leaders|engineers|designers|writers|traders|creators) who (?:are|is) (\w+er|more \w+|less \w+) than\b/gi, '$1 $2 than'], [/\bin the event that\b/gi, 'if'], [/\bfor the purpose of\b/gi, 'for'], [/\bmake a decision\b/gi, 'decide'],
[/(?<!\bno )\bway (?=(?:too|more|less|longer|shorter|better|worse|bigger|harder|faster|slower|earlier|later|over)\b)/gi, ''],
    [/\b(am|is|are|['’]re|['’]m) going to be (\w+ing)\b/gi, (m, v, g) => `${v === "'re" || v === '’re' ? v : v === "'m" || v === '’m' ? v : v} ${g}`],
    [/\b(\w+)(['’])(re|s|m) going to\b(?!\s+(?:[$€£]?\d|(?:the|a|an|my|your|our|their|bed|work|school|church|zero|new|war|jail|court|college|hell|sleep|plan)\b))/gi, (m, w, a, c) => `${w}${a}ll`],
    [/\b(is|are|am) going to\b(?!\s+(?:[$€£]?\d|(?:the|a|an|my|your|our|their|bed|work|school|church|zero|new|war|jail|court|college|hell|sleep|plan)\b))/gi, 'will'],
    /* r86: "must be able to adapt" → "must adapt"; "we have launched X today" → "we launched X today" */
    [/\b(must|should|need to|have to) be able to\b/gi, '$1'],
    [/\b(was|were) able to (pay|get|make|build|grow|save|quit|lose|hit|close|raise|finish|ship|land|cut|sell|buy|find|win|run|write|launch|double|triple|keep|reach|pass|beat|fix|clear|book|hire)\b/gi, (m, v, w) => ({ pay: 'paid', get: 'got', make: 'made', build: 'built', grow: 'grew', save: 'saved', quit: 'quit', lose: 'lost', hit: 'hit', close: 'closed', raise: 'raised', finish: 'finished', ship: 'shipped', land: 'landed', cut: 'cut', sell: 'sold', buy: 'bought', find: 'found', win: 'won', run: 'ran', write: 'wrote', launch: 'launched', double: 'doubled', triple: 'tripled', keep: 'kept', reach: 'reached', pass: 'passed', beat: 'beat', fix: 'fixed', clear: 'cleared', book: 'booked', hire: 'hired' })[w.toLowerCase()]],
    [/\b(i|we|they)(?: have|['’]ve) (?=(?:just |officially |finally )?(?:launched|shipped|released|opened|signed|hired|raised|closed|crossed|hit|joined|published|sent|started|finished)\b[^.!?]*\b(?:today|yesterday|this (?:morning|week|month)|last (?:night|week|month))\b)/gi, '$1 ']
  ];
  const PLAIN_W = [
    [/\butili[sz](e|es|ed|ing)\b/gi, (m, x) => ({ e: 'use', es: 'uses', ed: 'used', ing: 'using' })[x.toLowerCase()]], [/\bfacilitate\b/gi, 'help'], [/\bprior to\b/gi, 'before'],
    [/\bsubsequently\b/gi, 'then'], [/\bcommence\b/gi, 'start'], [/\bendeavou?r\b/gi, 'try'], [/\bin terms of\b/gi, 'for'], [/\bwith regards? to\b/gi, 'about'],
    [/\bregarding\b/gi, 'about'], [/\bpurchase\b/gi, 'buy'], [/\bnumerous\b/gi, 'many'], [/\bapproximately\b/gi, 'about'], [/\bdemonstrate\b/gi, 'show'],
    [/\bsufficient\b/gi, 'enough'], [/\badditional\b/gi, 'more'], [/\bindividuals\b/gi, 'people'], [/\bobtain\b/gi, 'get'], [/\bassist\b/gi, 'help'],
    [/\brequires\b/gi, 'needs'], [/\brequire\b/gi, 'need'], [/^therefore,?\s*/gi, 'So '], [/^however,\s*/gi, 'But '], [/^in addition,\s*/gi, 'Also, '],
    [/\bmore effectively\b/gi, 'better'], [/\boptimi[sz]e\b/gi, 'improve'], [/\bimplement\b/gi, 'build'], [/\bwe are excited to announce that\s*/gi, ''],
    [/\b(?:i am|i['’]m|we are|we['’]re) (?:so |very |really )?(?:excited|thrilled|happy|proud|humbled) to (?:announce|share)(?: that)?\s*/gi, '']
  ];
  const SHORTHAND = [[/\bidk\b/gi, 'I don’t know'], [/\brn\b/g, 'right now'], [/\bbc\b/g, 'because'], [/\bw\/(?=\s)/g, 'with'], [/\bu\b(?=\s)/g, 'you'], [/\bur\b(?=\s)/g, 'your'], [/\bpls\b/gi, 'please'], [/\b(?:lfg|wagmi)\b[.!]*\s*/gi, ''], [/\bvs\b(?!\.)/g, 'versus']];
  const JARGON_W = [[/\bDCA\b(?!['’])/i, '$& (buying a little at a time)'], [/\bP(?:n|&)L\b/i, 'profit and loss'], [/\bATH\b/i, 'all-time high'], [/\bperps\b/i, 'perpetual futures'],
    [/\bFOMO\b/i, '$& (fear of missing out)'], [/\bR[:\/]R\b/i, 'risk to reward'], [/\brekt\b/i, 'wiped out'], [/\bmcap\b/i, 'market cap'], [/\bFDV\b/i, 'fully diluted value'],
    [/\balts\b/i, 'smaller coins'], [/\baltcoins\b/i, 'smaller coins'], [/\bshilling their bags\b/i, 'pushing coins they hold'], [/\bbags\b/i, 'holdings'], [/\bMRR\b/, 'monthly revenue'],
    [/\bbp\b/, ' basis points'], [/\bstopped out\b/i, 'hit my stop'], [/\bCT\b/, 'crypto Twitter'], [/\bFOMC\b/, 'the Fed meeting (FOMC)'], [/\bv1\b/, 'first version']];
  const CONTRACT_W = [
    [/\b(do|does|did|is|are|was|were|have|has|had|would|should|could|must) not\b/gi, (m, v) => v + 'n’t'], [/\bwill not\b/gi, 'won’t'], [/\bcan ?not\b/gi, 'can’t'],
    [/\bI am\b/gi, 'I’m'], [/\b(it|that|there|here|what|who) is\b(?=\s+[\p{L}\p{N}$])/giu, '$1’s'], [/(?<=^|[.!?,;:—]\s*|\b(?:and|but|so|because|if|when|that|unless|since|while|think|guess|bet|know|hope|feel like)\s)(you|we|they) are\b(?=\s+[\p{L}\p{N}$])/giu, '$1’re'],
    [/\b(I|we|you|they) have (?=(?:been|had|seen|done|made|learned|lost|tried|never|always|ever|got|spent|written|built|shipped|just)\b)/gi, '$1’ve '],
    [/\b(I|we|you|they) will\b(?=\s+[a-z])/gi, '$1’ll'], [/\b(I|we|you|they) would\b(?=\s+(?:love|like|rather|be|have)\b)/gi, '$1’d'], [/\blet us\b/gi, 'let’s']
  ];
  /* "insanely big" → "big": intensifier + adjective becomes one stronger plain word, or just the adjective */
  const STRONG_ADJ = { important: { punchier: 'key', bolder: 'critical' }, big: { punchier: 'major', bolder: 'major' }, good: { punchier: 'strong', bolder: 'great' }, bad: { punchier: 'rough', bolder: 'costly' }, hard: { punchier: 'tough', bolder: 'brutal' }, scary: { punchier: 'terrifying', bolder: 'terrifying' }, small: { punchier: 'tiny', bolder: 'tiny' }, easy: { punchier: 'simple', bolder: 'simple' } };
  const INTENS_RX = /\b(?:really|very|so|super|extremely|incredibly|pretty) (important|big|good|bad|hard|scary|small|easy)\b/gi;
  const BOLD_W = [
    [/\b(?:could|might|may)(?: well| possibly)? be (?=(?:a|an|the|this|that|my|your|our)\b)/gi, 'looks like '], [/\b(?:might|may) want to\b/gi, 'should'],
    [/\b(could|might|may) (?!be\b|have\b|not\b|as\b|well\b)([a-z]+)/gi, 'will $2'], [/(?<!\btrying )\btry to (?=[a-z])/gi, ''], [/^(?:it )?seems (?:like|that) /i, ''],
    [/\bit(?:['’]s| is) time to\b/gi, 'it’s time to'], [/\bi hope\b/gi, 'I expect']
  ];
  const SUBJ_DROP = /^(I|We|i|we) (?=(?:spent|took|lost|made|bought|sold|cut|wrote|hired|shipped|turned|called|closed|started|stopped|tried|learned|did|got|went|quit|built|launched|used to|almost|posted|wasted)\b)/;
  const TAG_SENT = /^(?:simple|think about that|sorry|lol|idk|just saying|that['’]?s it|period|full stop|lfg|wild|crazy)[.!]*$/i;
  const VERB0 = /^(?:can['’]?t|cannot|can|need|needs|want|move|have|feel|think|do|don['’]?t|use|run|spend|post|buy|sell|hold|trade|see|get|know|lose|chase|keep|make|miss|skip|ignore|wait|check|write|ship|build|hire|plan|told|took|lost)\b/i;
  const HYPE_RX = /\b(insane|insanely|massive|massively|huge|crazy|unreal|epic|parabolic|moon(?:ing)?|guaranteed|game[- ]?changer|explod(?:e|ing)|skyrocket(?:ing)?|100x|1000x|wagmi|send it|lfg|full stop)\b|🚀|🔥|💎|!!/gi;
  const TELL_RX = /\b(here[’']?s the thing|let that sink in|game[- ]?changer|unlock|supercharge|elevate|seamless|delve|in today[’']?s fast[- ]paced)\b/gi;
  const SHORT_TICK = /^(?:\$[A-Za-z]{2,10}|[A-Z]{2,6}|\$?\d[\d,.]*\s?(?:%|[kKmMbB]|x|bp)?)$/;
  const NUM_RX = /\$?\d[\d,]*(?:\.\d+)?\s?(?:%|[kKmMbB]\b|x\b|bp\b)?/g;
  const numsOf = s => (String(s).match(NUM_RX) || []).map(n => n.replace(/\s/g, '').replace(/,$/, '').replace(/^\$/, '').toLowerCase()).filter(x => /\d/.test(x));
  const TICK_RX = /\$[A-Za-z]{2,10}\b|\b(?:BTC|ETH|SOL|LINK|PYTH|XRP|BNB|DOGE|AVAX|FTX|FOMC|CPI|ETF|ETFs|DCA|MRR|ARR|PnL)\b/g;
  const ticksOf = s => (String(s).match(TICK_RX) || []).map(t => t.toUpperCase());
  const negsOf = s => (String(s).replace(/n['’]t\b/gi, ' not').match(/\b(?:not|never|no|nobody|none|cannot|nothing|nor)\b/gi) || []).length;
  const cnt = (s, re) => (String(s).match(re) || []).length;
  const hedgeN = s => cnt(s, /\b(?:i think|i feel like|i believe|i guess|imo|honestly|tbh|ngl|really|very|quite|somewhat|basically|actually|literally|just|maybe|perhaps|probably|kind of|sort of|kinda|sorta|might|pretty much)\b/gi);
  const normT = s => lcw(s).replace(/[^\p{L}\p{N}$%' ]+/gu, ' ').replace(/\s+/g, ' ').trim();
  const wordsN = s => (String(s).match(/[\p{L}\p{N}$%][\p{L}\p{N}$%’'.,/-]*/gu) || []).length;
  function editW(a, b) { const A = normT(a).split(' '), B = normT(b).split(' '); let prev = B.map((_, j) => j + 1); prev.unshift(0); for (let i = 1; i <= A.length; i++) { const cur = [i]; for (let j = 1; j <= B.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (A[i - 1] === B[j - 1] ? 0 : 1)); prev = cur; } return prev[B.length]; }
  const nearSame = (a, b) => normT(a) === normT(b) || (wordsN(a) > 5 && editW(a, b) <= 1 && Math.abs(a.length - b.length) < 7);

  const sub = (t, list) => list.reduce((x, [re, w]) => x.replace(re, typeof w === 'function' ? w : (m, ...g) => { const r = w.replace(/\$(\d)/g, (_, i) => g[i - 1] || ''); return /^[A-Z]/.test(m) && /^[a-z]/.test(r) && !/^[A-Z]{2}/.test(m) ? r[0].toUpperCase() + r.slice(1) : r; }), t);
  /* the shared clean-up after any edit: spaces, stray commas, punctuation collisions */
  function tidyT(s) {
    return s.replace(/[ \t]{2,}/g, ' ').replace(/ +([,.!?;:])(?!\))/g, '$1').replace(/,\s*([.!?;:])/g, '$1').replace(/([.!?])\s*,/g, '$1').replace(/,\s*,/g, ',').replace(/(^|\n)\s*[,;:]\s*/g, '$1')
      .replace(/([.!?]\s+)[,;:]\s*/g, '$1').replace(/\(\s*\)/g, '').replace(/\b(and|but|or|so|because)\s*([.!?])(?=\s|$)/gi, '$2').replace(/(^|[.!?]\s+)(?:and|but|or|so)\s*([.!?,])\s*/gi, '$1').replace(/[ \t]+$/gm, '').replace(/^[ \t]+/gm, '');
  }
  /* casing: sentence starts follow the author (capital, or lowercase in CT style); "i" stays theirs */
  function caseFix(s, st, start) {
    let x = s.replace(/(^|[.!?]["”’)]*\s+|\n\s*)([a-z])/g, (m, a, c, off) => (off === 0 && !start) ? m : a + (st.low ? c : c.toUpperCase()));
    if (st.low) x = x.replace(/(^|[.!?]\s+|\n\s*)([A-Z])(?=[a-z])/g, (m, a, c, off) => (off === 0 && !start) ? m : a + c.toLowerCase());
    if (st.loI) x = x.replace(/\bI(?=\s|['’](?:m|ve|ll|d)\b)/g, 'i'); else x = x.replace(/\bi(?=\s|['’](?:m|ve|ll|d)\b)/g, 'I');
    return x;
  }
  const aposFix = (s, st) => st.noApos ? s.replace(/\b(\w+)’(t|s|m|re|ve|ll|d)\b/g, (m, w, c) => (/^(i|it|that|what|here|there|who|he|she|let)$/i.test(w) && c === 's' ? w + c : w + c)) : st.apos === "'" ? s.replace(/(\w)’(?=\w)/g, "$1'") : s;
  function fixArticles(s) {
    return s.replace(/\b(a|an|A|An)\s+([\p{L}\p{N}$][\p{L}\p{N}’'-]*)/gu, (m, art, w) => {
      let v; if (/^[A-Z]{2,}$/.test(w)) v = /^[AEFHILMNORSX]/.test(w); else if (/^\d/.test(w)) v = /^(8|11|18|80)/.test(w); else if (/^\$/.test(w)) v = false;
      else { const l = w.toLowerCase(); v = (/^[aeiou]/.test(l) && !/^(u[nst]i|use|usu|uti|eu|one|once|ur[aei])/.test(l)) || /^(hour|honest|heir)/.test(l); }
      const want = v ? 'an' : 'a'; if (art.toLowerCase() === want) return m; return (art[0] === 'A' ? want[0].toUpperCase() + want.slice(1) : want) + ' ' + w;
    });
  }
  /* sentence pieces of a fragment, with whether each starts and ends a real sentence */
  function pieces(frag, startS, endS) {
    const parts = (frag.match(/(?:[^.!?\n]|[.!?](?=[^\s.!?”"’)]))+[.!?…]*["”’)]*|\s+/g) || [frag]).flatMap(p => { const m = p.match(/^(\s+)(\S[\s\S]*)$/); return m ? [m[1], m[2]] : [p]; });
    const words = parts.filter(p => p.trim());
    let k = 0;
    return parts.map(p => { if (!p.trim()) return { ws: p }; const i = k++; return { t: p, start: i > 0 || startS, end: i < words.length - 1 || endS }; });
  }
  /* hedges, warm-ups and trailing tags out of one piece */
  function cutHedges(x, P) {
    let s = x;
    if (P.start) { for (let i = 0; i < 2; i++) s = s.replace(OPENER_RX, ''); s = s.replace(/^(?:just )?a (?:quick )?(?:reminder|heads up|thought)(?: that|:)\s*/i, ''); }
    HEDGE_RX.forEach(re => { s = s.replace(re, ''); });
    if (P.end) s = s.replace(TAIL_RX, '');
    return tidyT(s);
  }
  const intens = (s, k) => s.replace(INTENS_RX, (m, adj) => { const r = (STRONG_ADJ[adj.toLowerCase()] || {})[k]; return r ? (/^[A-Z]/.test(m) ? r[0].toUpperCase() + r.slice(1) : r) : adj; });
  /* sentence-level moves, whole sentences only. Each returns null when it doesn't fit */
  const endP = s => (s.match(/[.!?…]+["”’)]*$/) || [''])[0];
  const body = s => s.replace(/[.!?…]+["”’)]*$/, '');
  const COMMON0 = /^(funding|trials|revenue|churn|price|prices|volatility|stablecoin|market|markets|my|our|we|the|this|that|most|everyone|nobody|people|it|i|you|they|bitcoin|btc|eth|spreads|alts|altcoins|taking|sitting|posting|building|shipping|hiring|newsletter|volume|liquidity|dominance)$/i;
  const PRED_NOUN = '(?:fix|problem|lesson|trick|secret|truth|goal|plan|edge|key|answer|mistake|reason|point|catch|tell|rule|move|signal|cost|risk|part|trade|feedback|advice|habit|metric|chart|indicator|thing)';
  const ADV_END = /^(.{12,}?),?\s+((?:this|last|next|every) (?:year|week|month|cycle|morning|quarter|monday|tuesday|wednesday|thursday|friday|sunday|saturday)|today|yesterday|tonight|in (?:a|one|two|three|\d+) (?:days?|weeks?|months?|years?)|in \d{4}|since \d{4}|for (?:\d+|two|three|six) (?:years|months|weeks|days)|at month \d+|after (?:FTX|CPI|the halving))$/i;
  /* r86: a subject a move may lift out is a noun phrase: never a clause ("i genuinely believe $HYPE", "how we"), a modal ("ETH will") or a kept word */
  const clauseSubj = z => /\bqk[a-z]q\b/i.test(z) || /^\s*(?:i|we|you|they)\b/i.test(z) || /\b(?:believe|think|feel|know|guess|say|said|bet|hope|swear|reckon|how|why|what|when|where|which|who|if|will|would|should|could|might|may|gonna)\b/i.test(z);
  const MOVES = {
    /* "If you move it, you never had one." → "Move it? You never had one." */
    condQ(x) {
      const m = body(x).match(/^if (you|your|the|my|our|it|price|\$?[A-Z][\w$]*)\b(.+?),\s+(?:then\s+)?(.{6,})$/i) || body(x).match(/^if (you)\b(.+) ((?:you['’]re|you are|you|it['’]s|that['’]s)\b.{3,40})$/i); if (!m) return null;
      let cond; if (/^you$/i.test(m[1])) { const rest = m[2].trim(); if (!VERB0.test(rest)) return null; cond = rest; } else cond = m[1] + m[2];
      if (/\b(and|but|or)\b.*,/.test(cond) || cond.split(' ').length > 14) return null;
      return `${capFirst(cond.trim())}? ${capFirst(m[3].trim())}${endP(x) || '.'}`;
    },
    /* "The best trade I made this year was the one I didn't take" → "Best trade I made this year? The one I didn't take." */
    revealQ(x) {
      const m = body(x).match(new RegExp(`^(?:(the) |(my|our|your) )?((?:single )?(?:(?:best|worst|hardest|biggest|easiest|smartest|dumbest|only|real|first|last|one|most \\w+) [^,:]{2,60}?|${PRED_NOUN}(?: [^,:]{2,40}?)?)) (is|was|are|were) (?:that )?([^:]{3,})$`, 'i')); if (!m) return null;
      if ((!m[1] && !m[2] && /^(only|first|last|real|one)\b/i.test(m[3])) || /\bqk[a-z]q\b/i.test(m[3] + ' ' + m[5]) || /^(actually|really|just|basically|literally|any)\b/i.test(m[5]) || /\b(i|we|you|they|he|she|it|that)$/i.test(m[3]) || /,| and | but /.test(m[5]) || m[5].split(' ').length > 12 || /^(?:not )?(?:a|an)\s+\w+$/i.test(m[5]) || /^(simple|easy|hard|wrong|right|good|bad|huge|big|small)$/i.test(m[5])) return null;
      if (/^\w+ing\b/i.test(m[5]) && !/^(?:not|being)\b/i.test(m[5]) && /^(?:first|last|one|only|real)\b/i.test(m[3])) return null;
      const subj = (m[2] ? m[2] + ' ' : '') + m[3];
      return `${capFirst(subj)}? ${capFirst(m[5].replace(/^(?:there is|there['’]s)\b/i, 'There’s'))}${endP(x) || '.'}`;
    },
    /* "Risk management is the most important thing in trading" → "The most important thing in trading: risk management." */
    invert(x) {
      const m = body(x).match(/^([^,]{3,45}?) (is|are|was|were) (the (?:single )?(?:most|best|biggest|hardest|worst|only|real|first|last|cheapest|fastest|simplest|clearest) .{3,60})$/i); if (!m) return null;
      if (/^(it|this|that|there|here|what|which|who|i|we|you|they)\b/i.test(m[1]) || clauseSubj(m[1]) || /,| and | but | because /.test(m[3])) return null;
      return `${capFirst(m[3])}: ${COMMON0.test(m[1].split(' ')[0]) || /^[a-z]/.test(m[1]) ? lowFirst(m[1]) : m[1]}${endP(x) || '.'}`;
    },
    invertQ(x) { const y = MOVES.invert(x); if (!y) return null; const i = y.indexOf(': '); return `${y.slice(0, i).replace(/^the /i, '')}? ${capFirst(y.slice(i + 2))}`; },
    /* "X, but Y" → "X. But Y." and "X and then Y" → "X. Then Y." */
    split(x, keepAnd) {
      if (wordsN(x) < 8) return null;
      let m = x.match(/^(.{12,}?)(?:,\s*|\s+)(but|and then|then)\s+(.{8,})$/i);
      if (!m || /^and then$/i.test(m[2]) === false && /^then$/i.test(m[2]) && !/,\s*then/i.test(x)) m = x.match(/^(.{12,}?)(?:,\s*|\s+)(but|and then|so|and)\s+((?:i|we|you|they|it|price|most|the|my|our|nobody|that|this|people|everyone|he|she|here(?:['’]s| is| are))\b.{8,})$/i);
      if (!m) return null;
      const a = m[1].replace(/[,;]$/, ''), b = m[3]; if (wordsN(a) < 3 || wordsN(b) < 3 || /^(?:maybe i['’]m wrong|i (?:could|might) be wrong|i['’]m not (?:sure|saying)|not sure|idk|i don['’]t know|call me crazy|hear me out|i get it|i know)$/i.test(a.trim())) return null;
      return /^and$/i.test(m[2]) && !keepAnd ? `${a}. ${capFirst(b)}` : `${a}. ${capFirst(/then$/i.test(m[2]) ? 'then' : m[2])} ${b}`;
    },
    splitAnd(x) { return MOVES.split(x, true); },
    /* r86 "…talking to users, which is why I started doing calls" → "…talking to users. That's why I started doing calls." */
    whichWhy(x) { const m = x.match(/^(.{20,}?),\s+which is (why|how) ((?:i|we|you|they|it|this|that|my|our|the|most)\b.{8,})$/i); return m && !/^(?:if|when|because|since|while|although)\b/i.test(m[1]) ? `${m[1]}. That’s ${m[2].toLowerCase()} ${m[3]}` : null; },
    /* "Trials went up 22% in a week." → "Trials: up 22% in a week." The number leads */
    statColon(x) {
      const b = body(x); if (clauseSubj(b.split(/ (?:is|are|was|were|went|has gone|have gone|is now|are now|dropped|fell|rose|grew|jumped|moved|hit|crossed|reached|is at|are at|sits at) /i)[0])) return null; let m = b.match(/^([^,:]{3,40}?) (?:is|are|was|were|went|has gone|have gone|is now|are now) (up|down) (\$?\d.{0,60})$/i);
      if (m) return `${m[1]}: ${m[2].toLowerCase()} ${m[3]}${endP(x) || '.'}`;
      m = b.match(/^([^,:]{3,40}?) (?:dropped|fell|rose|grew|jumped|went|moved) (from \$?\d[^,]{0,20} to \$?\d.{0,60})$/i); if (m) return `${m[1]}: ${m[2].replace(/^from /, '')}${endP(x) || '.'}`;
      m = b.match(/^([^,:]{3,30}?) (?:hit|crossed|reached|is at|are at|sits at) (\$?\d.{0,60})$/i); if (m && !/^(i|we|you|they|it|he|she)$/i.test(m[1]) && !/\b(?:will|would|should|could|might|can|may|to|gonna|did|does|do|didn['’]t|won['’]t|just|finally|i|we|you|they)$/i.test(m[1])) return `${m[1]}: ${m[2]}${endP(x) || '.'}`;
      return null;
    },
    /* "Sitting in cash is a position." → "Sitting in cash? That's a position." (said out loud) and "Liquidity: a coward." (punchier) */
    isQ(x) {
      const m = body(x).match(/^([^,:?]{3,40}?) (is|are|was|were) ((?:a|an|the|what|how|why|not|never|my|your|our|their|just) [^:?]{2,50})$/i); if (!m || wordsN(x) <= 5 || clauseSubj(m[1]) || /\d|\$[a-z]/i.test(m[1]) || /^(it|this|that|there|here|what|which|who|i|we|you|they|he|she)$/i.test(m[1]) || /^(it|this|that|there|here)\b/i.test(m[1]) || wordsN(m[1]) > 6 || /\b(here|there|now|then)$/i.test(m[1]) || /^(after|before|when|if|since|because|while|in|on|at|for|with|by|from)\b/i.test(m[1])) return null;
      const v = m[2].toLowerCase(), ger = /^\w+ing\b/i.test(m[1]), pron = v === 'are' ? 'They’re' : v === 'were' ? 'They were' : v === 'was' ? (ger ? 'That was' : 'It was') : ger ? 'That’s' : 'It’s';
      return `${m[1]}? ${pron} ${m[3]}${endP(x) || '.'}`;
    },
    isColon(x) { const m = body(x).match(/^([^,:?]{3,30}?) (?:is|are) ((?:a|an|the|what|not) [^:?]{2,40})$/i); return m && !/^(it|this|that|there|here|what|i|we|you|they)\b/i.test(m[1]) && !clauseSubj(m[1]) && wordsN(m[1]) <= 4 ? `${m[1]}: ${m[2]}${endP(x) || '.'}` : null; },
    /* Bolder says the "not" out loud: "Don't chase green candles." → "Do not chase green candles." */
    unNot(x) { if (!/\b\w+n['’]t\b/i.test(x)) return null; return x.replace(/\b(do|does|did|is|are|was|were|have|has|had|would|should|could)n['’]t\b/gi, '$1 not').replace(/\bwon['’]t\b/gi, m => m[0] === 'W' ? 'Will not' : 'will not').replace(/\bcan['’]t\b/gi, m => m[0] === 'C' ? 'Cannot' : 'cannot'); },
    /* clause order: "Y because X" → "Because X, Y" and "If X, Y" → "Y if X" */
    swap(x) {
      const b = body(x), p = endP(x) || '.';
      let m = b.match(/^(if|when|once|until|before|after|because|since|while|unless) ([^,]{4,60}), (.{4,})$/i);
      if (m && !/[,;]/.test(m[3])) return `${capFirst(m[3])} ${m[1].toLowerCase()} ${m[2]}${p}`;
      m = b.match(/^([^,]{8,}?) (because|until|unless|since|once) ([^,]{6,60})$/i);
      if (m && !/\b(right|just|long|even|only|shortly|soon|ever|not)$/i.test(m[1]) && wordsN(m[1]) >= 3) { const w0 = m[1].split(' ')[0]; return `${capFirst(m[2])} ${m[3]}, ${properish(w0, x) ? m[1] : lowFirst(m[1])}${p}`; }
      return null;
    },
    /* two short sentences said in one breath: "Three plans became one. Trials rose 22%." → "Three plans became one, and trials rose 22%." (human) */
    merge(x) { return null; },
    /* advice said straight: "you should X" → "X.", "It is important to X" → "X.", "It is not a good idea to X" → "Don't X." */
    imperative(x) {
      const b = body(x), p = endP(x) || '.';
      let m = b.match(/^(?:you|we)(?: all)? (?:should|need to|have to|must|gotta|ought to) (?!not\b|be\b)(.{4,})$/i); if (m) return `${capFirst(m[1])}${p}`;
      m = b.match(/^(?:you|we)(?: all)? (?:should(?: not|n['’]t)|shouldn['’]t) (.{4,})$/i); if (m) return `Don’t ${m[1]}${p}`;
      m = b.match(/^it(?:['’]s| is) (?:very |really |so )?(?:important|essential|crucial|key) to (.{4,})$/i); if (m) return `${capFirst(m[1])}${p}`;
      m = b.match(/^it(?:['’]s| is)(?: not|n['’]t) a good idea to (.{4,})$/i); if (m) return `Don’t ${m[1]}${p}`;
      m = b.match(/^(?:i|we) (?:would |['’]d )?(?:recommend|suggest)(?: that)?(?: you)? (.{4,})$/i); if (m) return `${capFirst(m[1])}${p}`;
      m = b.match(/^(?:i|we)(?: am|['’]m| are|['’]re) not ([a-z]+)ing (.{3,})$/i); if (m && m[1].length > 2) { const v = { trad: 'trade', chas: 'chase', sell: 'sell', buy: 'buy', touch: 'touch', post: 'post', shar: 'share', hold: 'hold', check: 'check', shill: 'shill' }[m[1].toLowerCase()]; if (v) return `${/^we/i.test(b) ? 'We' : 'I'} don’t ${v} ${m[2]}${p}`; }
      return null;
    },
    /* "Pricing is a product decision, not a finance decision." → "Pricing isn't a finance decision. It's a product decision." */
    notFlip(x) {
      const m = body(x).match(/^([^,]{3,40}?) (is|are|was) ((?:an?|the|your|my|our) [^,]{3,40}?|\w+(?: \w+)?), not ((?:an?|the|your|my|our) [^,]{3,40}|\w+(?: \w+)?)$/i); if (!m || /^(it|this|that|there)\b/i.test(m[1])) return null;
      const pron = m[2].toLowerCase() === 'are' ? 'They’re' : m[2].toLowerCase() === 'was' ? 'It was' : 'It’s', neg = m[2].toLowerCase() === 'are' ? 'aren’t' : m[2].toLowerCase() === 'was' ? 'wasn’t' : 'isn’t';
      return `${m[1]} ${neg} ${m[4]}. ${pron} ${m[3]}${endP(x) || '.'}`;
    },
    /* "Funding flipped negative 4 times this year." → "This year, funding flipped negative 4 times." */
    front(x) {
      const m = body(x).match(ADV_END); if (!m || wordsN(m[1]) < 3 || /,/.test(m[1]) || /^(if|when|because|and|but|so|\w+ed|bought|sold|took|lost|made|spent|cut|turned|shipped|hired|wrote|went|got|hit|ran|did|built|quit|closed|stopped|started|tried|learned|wasted|almost|stop|start|do|don['’]t|never|just)\b/i.test(m[1])) return null;
      const w0 = m[1].split(' ')[0], main = properish(w0, x) ? m[1] : lowFirst(m[1]);
      return `${capFirst(m[2])}, ${main}${endP(x) || '.'}`;
    },
    /* "There is a lot of noise right now." → "Lots of noise right now." */
    thereIs(x) { const m = body(x).match(/^there(?: is|['’]s| are) (?:a lot of|lots of|so much|too much|so many|too many) (.{3,})$/i); return m ? `${capFirst(body(x).match(/(a lot of|lots of)/i) ? 'lots of' : body(x).match(/(so much|too much|so many|too many)/i)[1])} ${m[1]}${endP(x) || '.'}` : null; },
    subjDrop(x) { return SUBJ_DROP.test(x) ? capFirst(x.replace(SUBJ_DROP, '').replace(/^(?:have|['’]ve) been\b/i, 'Been')) : /^(?:I|i) (?:have|['’]ve) been\b/.test(x) ? x.replace(/^(?:I|i) (?:have|['’]ve) been\b/, 'Been') : null; }
  };
  /* a capitalised first word stays capitalised only when it's a name: I, a ticker, or a word written with a capital mid-sentence */
  const properish = (w, t) => /^(I|I['’]\w+)$/.test(w) || /^[A-Z0-9$]{2,}/.test(w) || /^\$/.test(w) || new RegExp(`[\\p{L},] ${w.replace(/[^\p{L}\p{N}]/gu, '')}\\b`, 'u').test(t);
  const firstMove = (b, names) => { for (const n of names) { const y = MOVES[n](b); if (y) return y; } return null; };
  /* each option: an ordered list of recipes; a recipe maps one piece to a version of it.
     Word-level steps run on every piece; moves only where the piece is a whole sentence. */
  const whole = P => P.start && P.end;
  const hedgeCount = x => (x.match(/\b(?:honestly|tbh|ngl|imo|basically|literally|actually|kinda|sorta|really|probably|i (?:really |just )?(?:think|feel like|believe))\b/gi) || []).length;
  const THAT_DROP = [/\b(think|thought|know|knew|said|says|realized|realised|learned|found|believe|feel|felt|means|meant|shows|showed|hope|noticed|bet|admit|swear|guarantee|promise) that\b(?! (?:is|was|are|were|'s|’s)\b)/gi, '$1'];
  const THE_DROP = [/^(the) ([a-z]+(?:[^s\s]s|ies))\b(?= (?:are|were|have|do|don['’]t|make|keep|get|lose|win|go|come)\b)/i, (m, t, n) => n];
  const SOFTEN = [[/\b(?:usually|often|generally|typically|mostly|relatively|a bit|somewhat|sometimes)\s+/gi, '']];
  const IDIOM = [[/\bsleeping on\b/i, 'overlooking'], [/\bbleed(?= (?:vs|against)\b)/i, 'lose value'], [/\bbleeding\b/i, 'losing value'], [/\bchopping\b/i, 'moving sideways'], [/\bshilling\b/i, 'promoting'],
    [/\bthe tell\b/i, 'the signal'], [/\bretrace\b/i, 'pullback'], [/\bretest\b/i, 'come back to'], [/\bbreaks out\b/i, 'breaks higher'], [/\bpaper hands\b/i, 'selling too early'], [/\balpha\b/i, 'an edge'],
    [/\bsize up\b/i, 'trade bigger'], [/\bmarket sold\b/i, 'sold at market price'], [/\bthe open\b/i, 'the market open'], [/\bthe daily\b(?! chart)/i, 'the daily chart'], [/\bsent it\b/i, 'went all in'],
    [/\bthe range high\b/i, 'the top of its range'], [/\bin one candle\b/i, 'in one price move'], [/\bpumping\b/i, 'rising fast'], [/\bdumping\b/i, 'falling fast'], [/\b(?:a )?proper\b/i, m => /^a /i.test(m) ? 'a real' : 'real']];
  const SHORT_W = [[/\bevery single\b/gi, 'every'], [/\bright (?=before|after)/gi, ''], [/\band then\b/gi, 'then'], [/\b(a|an|the) (\w+) (\w+), not (a|an|the) (\w+) \3\b/gi, '$1 $2 $3, not $4 $5 one'], [/^(?:we|i) (?:have|had|['’]ve got) no (\w)/i, (m, c) => 'No ' + c], [/\bthan (\w+) thought it would(?: be)?\b/gi, 'than $1 thought'], [/\ba lot of\b/gi, 'lots of'], [/\bat the end of the day,?\s*/gi, ''], [/\bevery one\b(?! of)/gi, 'each'], [/\bin one candle\b/gi, 'in a candle']];
  const ANNOUNCE = PLAIN_W.slice(-2);
  /* More human keeps one hedge (people do hedge) but not a stack of them: "so i think … honestly" keeps "i think" */
  const oneHedge = (x, P) => { let n = 0; const y = P.start ? x.replace(OPENER_RX, '') : x; return tidyT(y.replace(/\b(?:honestly|tbh|ngl|imo|basically|literally|actually|kinda|sorta|really|probably)\b,?\s*|\bi (?:really |just )?(?:think|feel like|believe)(?: that)?(?! about| of\b)\s+/gi, m => (n++ ? '' : m))); };
  const W = {
    punch: (x, P) => sub(sub(sub(sub(intens(cutHedges(x, P), 'punchier'), PLAIN_W), WORDY), CONTRACT_W), [THAT_DROP, [/^here(?: is|['’]s) the thing(?: about ([^:]{3,30}))?:\s*(?:it\b\s*)?/i, (m, t) => t ? capFirst(t) + ' ' : '']]),
    short: (x, P) => sub(W.punch(x, P), SHORT_W.slice(0, 5)),
    clear: (x, P) => sub(sub(sub(cutHedges(x, P), PLAIN_W), WORDY), SHORTHAND),
    bold: (x, P) => sub(sub(sub(intens(cutHedges(x, P), 'bolder'), BOLD_W), WORDY), [...SOFTEN, ...ANNOUNCE]),
    human: (x, P) => sub(sub(hedgeCount(x) >= 2 ? oneHedge(x, P) : x, PLAIN_W), CONTRACT_W).replace(/\b(basically|literally),?\s+/gi, '').replace(/\bwould (?:really )?appreciate\b/gi, 'would love').replace(/\bwe have raised\b/gi, 'we raised').replace(/\b(am|is|are|['’]re|['’]m) going to be (\w+ing)\b/gi, '$1 $2')
  };
  const RECIPES = {
    punchier: [
      (x, P) => W.punch(x, P),
      (x, P) => whole(P) ? firstMove(W.punch(x, P), ['condQ', 'imperative', 'thereIs', 'statColon', 'revealQ', 'invert', 'split']) : null,
      (x, P) => whole(P) ? firstMove(W.punch(x, P), ['split', 'invertQ', 'subjDrop', 'isColon']) : null
    ],
    shorter: [
      (x, P) => W.short(x, P),
      (x, P) => P.start ? firstMove(W.short(x, P), ['subjDrop', 'statColon']) || (P.start ? sub(W.short(x, P), [THE_DROP]) : null) : null,
      (x, P) => whole(P) ? firstMove(W.short(x, P), ['condQ', 'imperative', 'thereIs', 'revealQ', 'statColon']) : null
    ],
    clearer: [
      (x, P) => W.clear(x, P),
      (x, P) => sub(sub(W.clear(x, P), JARGON_W), IDIOM),
      (x, P) => whole(P) ? firstMove(W.clear(x, P), ['split', 'imperative', 'notFlip']) : null
    ],
    bolder: [
      (x, P) => sub(W.bold(x, P), [[/\bshould\b(?! not)/gi, 'must'], [/\bneed to\b/gi, 'must']]),
      (x, P) => whole(P) ? firstMove(sub(W.bold(x, P), CONTRACT_W), ['imperative', 'notFlip', 'condQ', 'statColon', 'invert', 'revealQ']) : null,
      (x, P) => whole(P) ? firstMove(W.bold(x, P), ['revealQ', 'invertQ', 'front', 'swap', 'split', 'isQ', 'unNot']) : null
    ],
    human: [
      (x, P) => W.human(x, P),
      (x, P) => whole(P) ? firstMove(W.human(x, P), ['condQ', 'splitAnd', 'front', 'swap', 'revealQ', 'isQ', 'thereIs']) : null,
      (x, P) => P.start ? MOVES.subjDrop(W.human(x, P)) : null
    ]
  };
  /* moves across two sentences, on the whole selection */
  const FRAG = {
    /* "Three plans became one. Trials rose 22% in a week." → "Three plans became one, and trials rose 22% in a week." */
    human(core, F) {
      const P = pieces(core, F.startS, F.endS).filter(p => p.t); if (P.length !== 2 || !P[0].start || !P[1].end) return null;
      const [a, b] = P.map(p => p.t.trim()); if (!/\.$/.test(a) || wordsN(a) > 9 || wordsN(b) > 10 || wordsN(a) < 2 || /^(and|but|so|or|because|then|now|no|not|never|nobody|just|only|also|still|i think)\b/i.test(b) || /[?!:]/.test(a) || /,/.test(b) || negsOf(a + ' ' + b)) return null;
      const w0 = b.split(' ')[0]; return `${a.slice(0, -1)}, and ${properish(w0, F.t) ? b : lowFirst(b)}`;
    },
    stack(core, F) {
      const P = pieces(core, F.startS, F.endS).filter(p => p.t); if (P.length < 2 || P.length > 5 || !P[0].start || !P[P.length - 1].end || /\n/.test(core) || /\n/.test(F.t)) return null;
      if (P.some(p => wordsN(p.t) > 16)) return null;
      return P.map(p => p.t.trim()).join('\n');
    },
    shorter(core, F) {
      /* a tag sentence at the end ("Simple." "Think about that.") goes when the rest carries the point */
      const P = pieces(core, F.startS, F.endS).filter(p => p.t); if (P.length < 2 || !P[P.length - 1].end) return null;
      const last = P[P.length - 1].t.trim(); if (!TAG_SENT.test(last)) return null; const i = core.lastIndexOf(last); return core.slice(0, i).trim();
    }
  };
  /* where a selection sits: snapped to whole words, with the text around it */
  function frame(post, s, e) {
    const t = String(post || ''); s = Math.max(0, Math.min(s, t.length)); e = Math.max(s, Math.min(e, t.length));
    const inWord = (i) => i > 0 && i < t.length && ((WCH.test(t[i - 1]) && WCH.test(t[i])) || (/[.,]/.test(t[i - 1]) && /\d/.test(t[i]) && /\d/.test(t[i - 2] || '')) || (/\d/.test(t[i - 1]) && /[.,]/.test(t[i]) && /\d/.test(t[i + 1] || '')));
    while (inWord(s)) s--;
    while (inWord(e)) e++;
    while (s < e && /\s/.test(t[s])) s++; while (e > s && /\s/.test(t[e - 1])) e--;
    const pre = t.slice(0, s), core = t.slice(s, e), suf = t.slice(e);
    const startS = isStop(pre), coreP = /[.!?…]["”’)]*$/.test(core), endS = coreP || /^\s*(?:\n|$)/.test(suf) || /^[.!?…]/.test(suf);
    return { t, s, e, pre, core, suf, startS, endS, coreP, st: styleOf(t) };
  }
  /* fit one candidate into its place: casing, end punctuation, apostrophes, articles, and the seams */
  function fit(rep, F, k) {
    let x = String(rep || '');
    x = tidyT(x.replace(/([.!?…]["”’)]*)?(\s*\n\s*)/g, (m, p, n) => /\n/.test(F.core) || p ? (p || '') + '\n' : ' ')).trim();
    if (x) {
      x = caseFix(x, F.st, F.startS);
      if (!F.startS) { const w0 = (x.match(/^[\p{L}][\p{L}’']*/u) || [''])[0]; if (w0 && /^[A-Z][a-z]/.test(w0) && !new RegExp(`(^|[^.!?]\\s)${w0}\\b`).test(F.t.slice(0, F.s) + ' ' + F.core.replace(/^\S+/, ''))) { const orig0 = (F.core.match(/^[\p{L}][\p{L}’']*/u) || [''])[0]; if (orig0 !== w0) x = lowFirst(x); } }
      if (!F.endS) { const tail = (F.core.match(/[,;:—–]$/) || [''])[0]; x = x.replace(/[.!?…]+$/, '').replace(/[,;:—–]$/, '') + tail; }
      else if (F.coreP) { const p = endP(F.core); if (!/[.!?…]["”’)]*$/.test(x)) x += p.replace(/["”’)]+$/, ''); else if (/[?]$/.test(x) && !/\?/.test(p) && !/\?/.test(x.slice(0, -1))) x = x.slice(0, -1) + p; }
      else if (/^[.!?…]/.test(F.suf)) x = x.replace(/[.!?…]+$/, '');
      else if (/[.]$/.test(x) && !/[.!?…]$/.test(F.core)) x = x.replace(/\.$/, '');
      x = aposFix(fixArticles(x), F.st);
    }
    /* the seams: the word before the selection, the first and last words of the version, the word after */
    let s = F.s, e = F.e, pre = F.pre, suf = F.suf;
    const lastW = str => (str.match(/([\p{L}\p{N}$%][\p{L}\p{N}$%’']*)\W*$/u) || [])[1] || '', firstW = str => (str.match(/^\W*([\p{L}\p{N}$%][\p{L}\p{N}$%’']*)/u) || [])[1] || '';
    for (let n = 6; n >= 1 && x; n--) {
      const pw = (pre.match(/[\p{L}\p{N}$%’']+/gu) || []).slice(-n).map(lcw).join(' '), xw = (x.match(/[\p{L}\p{N}$%’']+/gu) || []).slice(0, n).map(lcw).join(' '), cw = (F.core.match(/[\p{L}\p{N}$%’']+/gu) || []).slice(0, n).map(lcw).join(' ');
      if (pw && pw === xw && cw !== xw && /^[\p{L}\p{N}$%’'\s]+/u.test(x)) { const re = new RegExp(`^\\W*(?:[\\p{L}\\p{N}$%’']+\\W+){${n - 1}}[\\p{L}\\p{N}$%’']+\\W*`, 'u'); x = x.replace(re, ''); if (F.startS === false || true) x = F.startS ? caseFix(x, F.st, true) : x; break; }
    }
    for (let n = 6; n >= 1 && x; n--) {
      const sw = (suf.match(/[\p{L}\p{N}$%’']+/gu) || []).slice(0, n).map(lcw).join(' '), xw = (x.match(/[\p{L}\p{N}$%’']+/gu) || []).slice(-n).map(lcw).join(' '), cw = (F.core.match(/[\p{L}\p{N}$%’']+/gu) || []).slice(-n).map(lcw).join(' ');
      if (sw && sw === xw && cw !== xw) { const re = new RegExp(`\\W*(?:[\\p{L}\\p{N}$%’']+\\W+){${n - 1}}[\\p{L}\\p{N}$%’']+\\W*$`, 'u'); x = x.replace(re, ''); break; }
    }
    if (x && lcw(lastW(pre)) && lcw(lastW(pre)) === lcw(firstW(x)) && lcw(lastW(pre)) !== lcw(firstW(F.core))) x = x.replace(/^\W*[\p{L}\p{N}$%’']+\s*/u, '');
    if (!x) {
      /* a pure cut: take one space with it, and the comma a cut opener leaves behind */
      if (/^,\s*/.test(suf) && (isStop(pre) || /,\s*$/.test(pre))) { const m = suf.match(/^,\s*/)[0]; e += m.length; suf = suf.slice(m.length); }
      else if (isStop(pre) && /^[ \t]+/.test(suf)) { const m = suf.match(/^[ \t]+/)[0]; e += m.length; suf = suf.slice(m.length); }
      else if (/\s$/.test(pre) && /^\s/.test(suf)) { e += 1; suf = suf.slice(1); }
      else if (/\s$/.test(pre) && /^[,.!?;:]/.test(suf)) { const m = pre.match(/\s+$/)[0]; s -= m.length; pre = pre.slice(0, -m.length); }
      if (isStop(pre) && !F.st.low && /^[a-z]/.test(suf)) { const w = suf.match(/^[a-z][\p{L}’']*/u)[0]; x = w[0].toUpperCase() + w.slice(1); e += w.length; suf = suf.slice(w.length); }
    }
    /* "a" before the selection must agree with the version's first word */
    const art = pre.match(/\b(a|an|A|An)(\s+)$/);
    if (art && x) { const fixed = fixArticles(art[1] + ' ' + x); const na = fixed.split(' ')[0]; if (na !== art[1]) { s -= art[0].length; x = na + art[2] + x; } }
    return { text: x, s, e, full: F.t.slice(0, s) + x + F.t.slice(e) };
  }
  /* what every version must pass, Basic or Claude */
  function gram(s) {
    return [cnt(s, /[^\n ] {2,}\S/g), cnt(s, / [,.!?;:](?!\))/g), cnt(s, /([,;:!?])\1|(?<!\.)\.\.(?!\.)|[,;:][.!?]|[.!?][,;:]/g), cnt(s, /(^|[.!?]\s+|\n)(and|but|or|so|because)\s*[,.!?;:]/gi),
      cnt(s, /\b(and|but|or|because|the|a|an|my|our|your|their)\s*[.!?:](?=\s|$)/gi), cnt(s, /(^|\n)\s*[,.;:!?]/g), Math.abs(cnt(s, /\(/g) - cnt(s, /\)/g)) + Math.abs(cnt(s, /“/g) - cnt(s, /”/g)) + cnt(s, /"/g) % 2,
      /* r86: templates that came out broken: "::", a function word before a colon ("ETH will: 5k"), "will 5k", "Why do most content fails", "??" */
      cnt(s, /::/g) + cnt(s, /\b(?:will|would|should|could|can|to|we|i|you|how|why|what|did|does|do|gonna)\s*:\s/gi) + cnt(s, /\bwill\s+[$€£]?\d/gi) + cnt(s, /\?\s*\?/g),
      cnt(s, /\bwhy do (?:\S+ ){1,4}(?:fails|works|sells|gets|makes|goes|does|needs|wants|breaks|dies|loses|misses|stalls|churns|struggles|stops|sucks|looks|feels|sounds|reads|ends|burns|posts|writes|hires|ships|is|has|was)\b|\bwhy does (?:\S+ ){1,4}(?:fails|works|sells|gets|makes|goes|needs|wants|breaks|dies|loses|misses|stalls|churns|struggles|stops)\b/gi)];
  }
  function adjDup(s) { const w = (s.toLowerCase().match(/[\p{L}\p{N}$%’']+/gu) || []); let n = 0; for (let len = 1; len <= 4; len++) for (let i = 0; i + 2 * len <= w.length; i++) if (w.slice(i, i + len).join(' ') === w.slice(i + len, i + 2 * len).join(' ') && !/^(ha|no|very|so|really|gm|go|bye|more|again)$/.test(w[i])) n++; return n; }
  function judge(v, F, k, { strictNum = true } = {}) {
    const why = [];
    const before = F.core, after = v.text, full = v.full;
    /* changed means words or rhythm changed: a capital letter or a final full stop alone doesn't count */
    const sameT = (a, b) => { const n = z => lcw(z).replace(/[ \t]+/g, ' ').replace(/ ?\n ?/g, '\n').replace(/[.!?…\s]+$/, '').trim(); return n(a) === n(b); };
    if (sameT(after, before) || sameT(full, F.t)) why.push('same');
    const n0 = numsOf(F.t), n1 = numsOf(full);
    if (n1.some(x => !n0.includes(x))) why.push('newNumber');
    if (n0.some(x => !n1.includes(x))) why.push('lostNumber');
    const t0 = ticksOf(F.t), t1 = ticksOf(full);
    if (t0.some(x => !t1.includes(x)) || t1.some(x => !t0.includes(x))) why.push('ticker');
    if (negsOf(full) < negsOf(F.t)) why.push('negation');
    if (cnt(full, HYPE_RX) > cnt(F.t, HYPE_RX)) why.push('hype');
    if (cnt(full, TELL_RX) > cnt(F.t, TELL_RX)) why.push('aiTell');
    if (cnt(full, /\p{Extended_Pictographic}/gu) > cnt(F.t, /\p{Extended_Pictographic}/gu)) why.push('emoji');
    if (adjDup(full) > adjDup(F.t)) why.push('repeat');
    const g0 = gram(F.t), g1 = gram(full); if (g1.some((x, i) => x > g0[i])) why.push('grammar');
    if (!F.st.low && cnt(full, /(?<![.\d][a-z]?)[.!?]\s+[a-z]/g) > cnt(F.t, /(?<![.\d][a-z]?)[.!?]\s+[a-z]/g)) why.push('case');
    const names0 = (F.t.match(/(?<=[\p{L}\p{N},%)]\s)[A-Z][a-z]+(?:[A-Z][a-z]+)?\b/gu) || []).filter(w => !/^(I|The|A|An|It|My|We|Our|But|And|So|Here|This|That|Then|Just|Most|Your|You|Stop|Do)$/.test(w));
    if (names0.some(w => !full.includes(w))) why.push('name');
    if (k === 'shorter' && !(after.length < before.length)) why.push('notShorter');
    if (k === 'punchier' && (after.length > before.length * 1.04 + 1 || wordsN(after) > wordsN(before))) why.push('longer');
    if ((k === 'bolder' || k === 'clearer' || k === 'punchier' || k === 'shorter') && hedgeN(after) > hedgeN(before)) why.push('hedges');
    if (after.length > before.length * 2.2 + 40) why.push('tooLong');
    /* a version that keeps every hedge and moves one word isn't punchier, clearer or bolder: it's the same line */
    if (['punchier', 'clearer', 'bolder'].includes(k) && hedgeN(before) >= 1 && hedgeN(after) >= hedgeN(before) && wordsN(after) >= wordsN(before) - 1) why.push('weak');
    /* it has to be about the same words: a refusal, an apology or an unrelated line never passes */
    if (/^(?:sorry|i can(?:no|['’])t|i['’]?m (?:not able|unable)|as an ai|i won['’]?t|unfortunately)\b/i.test(after.trim())) why.push('offTopic');
    const FILL = /^(actually|basically|literally|honestly|imo|imho|tbh|ngl|kinda|sorta|probably|maybe|perhaps|really|very|lol|lmao|idk|gonna|guess|feel|believe|reckon|quite|somewhat|pretty|totally|definitely|simply|lowkey|sorry|okay)$/;
    const cw = z => (lcw(z).match(/[a-z0-9$%]{3,}/g) || []).filter(w => !STOP.has(w) && !FILL.test(w)).map(w => w.slice(0, 4));
    const c0 = [...new Set(cw(before))], c1 = new Set(cw(after));
    if (c0.length >= 2 && c0.filter(w => c1.has(w)).length / c0.length < .4) why.push('offTopic');
    /* the hook: a rewrite of the opening sentence may not lower its score, unless the option is about length or tone */
    if (F.s === 0 && F.endS && k) { const allow = { shorter: 6, human: 6, clearer: 4 }[k] || 0; if (hookScore(full).score < hookScore(F.t).score - allow) why.push('hook'); }
    return why;
  }
  /* honest, specific note when nothing passes: what's already working, and what to try. Never "already good" */
  function strengths(c) {
    const out = [], num = (c.match(NUM_RX) || []).find(x => /\d/.test(x));
    if (num) out.push(`a real number (${num.trim()})`);
    if (!hedgeN(c)) out.push('no hedges');
    if (/^(stop|start|don['’]t|never|ship|write|cut|wait|reply|find|make|fix|buy|sell|hold|take|keep)\b/i.test(c.trim())) out.push('it opens on a verb');
    else if (negsOf(c)) out.push('a clear contrast');
    const n = wordsN(c); if (n <= 16) out.push(`${n} words`);
    return out.slice(0, 3);
  }
  function whyNot(k, F) {
    const c = F.core.trim(), q = c.length > 34 ? c.slice(0, 32).trim() + '…' : c, n = wordsN(c);
    const verb = { punchier: 'tighten', shorter: 'cut', clearer: 'simplify', bolder: 'firm up', human: 'loosen' }[k] || 'change';
    if (SHORT_TICK.test(c)) return `“${q}” is ${/\d/.test(c) ? 'a number' : 'a ticker'}. Sharpen keeps those exactly as you wrote them. Select the words around it.`;
    if (n <= 2) return `“${q}” is ${n === 1 ? 'one word' : 'two words'} with nothing soft to ${verb}. Select the sentence around ${n === 1 ? 'it' : 'them'}.`;
    const what = { punchier: 'Nothing to tighten without changing your claim', shorter: 'Nothing to cut without losing part of your claim', clearer: 'No hedges, jargon or long words to swap', bolder: 'Nothing hedged to firm up', human: 'Nothing stiff to loosen' }[k];
    const good = strengths(c);
    return `${what} in “${q}”.${good.length ? ` What’s working: ${good.join(', ')}.` : ''} Try another option, or Custom… with a note.`;
  }
  /* the Basic versions for one option on one selection */
  function versionsFor(k, F) {
    const P = pieces(F.core, F.startS, F.endS), out = [];
    /* a piece that stops mid-sentence is read with the next two words, so "really" before "think" or "might" before "be a" reads right; they're cut off again after */
    const nx = F.endS ? '' : ((F.suf.match(/^\s+([^\s.!?,;:]+(?:\s+[^\s.!?,;:]+)?)/) || [])[1] || '');
    const lastI = P.reduce((a, p, i) => p.t != null ? i : a, -1);
    const run = (r, p, i) => {
      if (i !== lastI || !nx) return r(p.t, p);
      const y = r(p.t + ' ' + nx, p); if (y == null) return null;
      if (y.endsWith(' ' + nx)) return y.slice(0, -nx.length - 1); if (y === nx) return ''; return r(p.t, p);
    };
    const r0 = RECIPES[k][0];
    for (const r of RECIPES[k]) {
      let any = false; const txt = P.map((p, i) => { if (p.ws != null) return p.ws; const y = run(r, p, i); if (y == null) { const b = run(r0, p, i); return b == null ? p.t : b; } any = true; return y; }).join('');
      if (!any) continue; out.push(txt);
    }
    /* two-sentence moves work on the option's first version, so its word edits carry over */
    if (FRAG[k]) { const y = FRAG[k](out[0] != null ? out[0] : F.core, F); if (y != null) out.push(y); }
    if (k === 'punchier' || k === 'bolder') { const y = FRAG.stack(out[0] != null ? out[0] : F.core, F); if (y != null) out.push(y); }
    /* one whole sentence on its own line: the hook moves too (ask then answer, number first, the contrast in two beats); the strongest goes first */
    if ((k === 'punchier' || k === 'bolder') && F.startS && F.endS && !/\n/.test(F.core) && wordsN(F.core) >= 4) {
      const H = hookUp(F.core, { more: false }); if (H && H.best) { const eng = [H.best, ...H.alts].filter(o => o.moves.some(m => m !== 'end')).map(o => o.line);
        if (eng.length && (!out.length || hookScore(eng[0]).score > hookScore(out[0]).score)) out.unshift(eng.shift()); out.push(...eng); }
    }
    return out;
  }
  function pickVersions(cands, F, k, opts = {}) {
    const kept = [], rejected = {};
    for (const c of cands) {
      const v = fit(c, F, k); const why = judge(v, F, k, opts);
      if (why.length) { why.forEach(w => { rejected[w] = (rejected[w] || 0) + 1; }); continue; }
      if (kept.some(x => nearSame(x.full, v.full))) { rejected.nearDup = (rejected.nearDup || 0) + 1; continue; }
      kept.push(v); if (kept.length >= 3) break;
    }
    return { kept, rejected };
  }
  /* Sharpen one selection with Basic mode. Returns { vars:[{text,s,e,full}], msg, widened } */
  function sharpen(k, post, s, e) {
    let F = frame(post, s, e);
    if (!F.core.trim()) return { vars: [], msg: 'Select a few words first.' };
    let { kept } = pickVersions(versionsFor(k, F), F, k);
    let widened = false;
    /* three or more words with nothing to change on their own: try the whole sentence they sit in, and say so */
    if (!kept.length && wordsN(F.core) >= 3 && !(F.startS && F.endS)) {
      const a = Math.max(F.t.slice(0, F.s).search(/(?:[.!?…]["”’)]*\s+|\n)[^.!?…\n]*$/) + 1, 0), b0 = F.coreP ? 0 : F.t.slice(F.e).search(/[.!?…]|\n/), b = F.coreP ? F.e : b0 < 0 ? F.t.length : F.e + b0 + (/[.!?…]/.test(F.t[F.e + b0]) ? 1 : 0);
      const G = frame(post, a ? a + (F.t.slice(a).match(/^[.!?…"”’)\s]*/) || [''])[0].length - 0 : 0, b);
      if (G.core.length > F.core.length) { const r = pickVersions(versionsFor(k, G), G, k); if (r.kept.length) { kept = r.kept; widened = true; F = G; } }
    }
    return { vars: kept, msg: kept.length ? '' : whyNot(k, F), widened, s: F.s, e: F.e };
  }
  /* ---------- Claude's versions: parse, strip, de-echo, then the same checks as Basic ---------- */
  function modelTexts(raw) {
    if (raw == null) return [];
    if (typeof raw === 'string') {
      const t = raw.trim(); if (!t) return [];
      const j = t.replace(/^```(?:json)?\s*|\s*```$/g, ''); if (/^[[{]/.test(j)) { try { return modelTexts(JSON.parse(j)); } catch (e) { /* not JSON */ } }
      const lines = t.split(/\n+/).map(l => l.trim()).filter(Boolean), items = lines.filter(l => /^(?:\d+[.)]|[-*•]|(?:version|option)\s*\d+\s*[:.)\-–—])\s*/i.test(l));
      return items.length >= 2 ? items : [t];
    }
    if (Array.isArray(raw)) return raw.flatMap(o => typeof o === 'string' ? [o] : o && typeof o === 'object' ? [String(o.text || o.version || o.rewrite || '')] : []);
    if (typeof raw === 'object') return modelTexts(raw.options || raw.versions || raw.rewrites || raw.texts || (raw.text ? [raw.text] : []));
    return [];
  }
  function stripModel(t, core, whole = false) {
    let x = String(t || '').trim();
    x = x.replace(/^```\w*\s*|\s*```$/g, '').trim();
    x = x.replace(/^\*{1,2}(?:version|option|v)\s*\d*\s*[:.)\-–—]?\s*\*{0,2}\s*[:\-–—]?\s*/i, '');
    x = x.replace(/^\s*(?:\d+[.)]|[-*•]|(?:version|option|v)\s*\d+\s*[:.)\-–—]?)\s*/i, '');
    x = x.replace(/^(?:\*\*)?(?:here(?:['’]s| is| are)\s+(?:a|an|the|my|your|some|three|3|two|2)?\s*(?:[\w-]+\s+){0,3}(?:version|rewrite|option|take|alternative|edit|replacement)s?\b[^:\n]{0,30}:|sure[,!.]?[^:\n]{0,40}:|(?:punchier|shorter|clearer|bolder|more human|human|rewrite|rewritten|replacement|revised|new version|version|selected|answer|output)\s*(?:\*\*)?\s*[:\-–—]\s*)\s*/i, '');
    x = x.replace(/^<(\w+)>\s*([\s\S]*?)\s*<\/\1>$/, '$2').replace(/^<\/?\w+>\s*|\s*<\/?\w+>$/g, '');
    if (!/\n/.test(core) && !whole) x = x.split(/\n/)[0].trim(); else x = x.replace(/\n+\s*(?:why|note|changes?|explanation|reason)\s*:[\s\S]*$/i, '').trim();
    x = x.replace(/\s+[(\[](?:i |this )?(?:cut|removed|dropped|added|changed|swapped|made|tightened|shortened|kept|replaced|moved|trimmed|turned)\b[^)\]]*[)\]]\s*$/i, '');
    x = x.replace(/\s+(?:[—–]|-{1,2})\s+(?:i |this )?(?:cut|removed|dropped|added|changed|swapped|made|tightened|kept|replaced|moved|trimmed)\b.*$/i, '');
    const Q = [['“', '”'], ['"', '"'], ["'", "'"], ['‘', '’'], ['`', '`'], ['«', '»'], ['**', '**'], ['*', '*']];
    for (let i = 0; i < 2; i++) for (const [a, b] of Q) if (x.length > a.length + b.length && x.startsWith(a) && x.endsWith(b) && !(core.startsWith(a) && core.endsWith(b)) && x.slice(a.length, -b.length).indexOf(a === b ? a : b) < 0) x = x.slice(a.length, -b.length).trim();
    /* a quote mark left on one side only (the model quoted a version that has an apostrophe inside) */
    let led = false;
    if (/^["“‘'`«]/.test(x) && !/^["“‘'`«]/.test(core)) { x = x.slice(1).trim(); led = true; }
    if (/["”’'`»]$/.test(x) && !/["”’'`»]$/.test(core) && (led || /["”»`]$/.test(x))) x = x.slice(0, -1).trim();
    return x;
  }
  /* the model sent back the whole post, or words from either side of the selection: keep only the replacement */
  function deEcho(x, F) {
    const pre = F.pre.trim(), suf = F.suf.trim();
    if (pre && x.startsWith(pre) && !F.core.startsWith(pre)) x = x.slice(pre.length).trim();
    if (suf && x.endsWith(suf) && !F.core.endsWith(suf)) x = x.slice(0, -suf.length).trim();
    if (suf && suf.length > 3 && /^[.!?…]$/.test(x.slice(-1)) && x.slice(0, -1).endsWith(suf.replace(/[.!?…]$/, '')) && !F.core.endsWith(suf.replace(/[.!?…]$/, ''))) x = x.slice(0, x.length - suf.length).trim();
    return x;
  }
  /* Claude's reply → checked versions. Returns { vars, rejected, total } */
  function fromModel(raw, k, post, s, e) {
    const F = frame(post, s, e), texts = modelTexts(raw).map(t => deEcho(stripModel(t, F.core), F)).filter(Boolean);
    const { kept, rejected } = pickVersions(texts, F, k);
    return { vars: kept, rejected, total: texts.length, s: F.s, e: F.e };
  }
  /* whole-post versions (Improve › Rewrites): the same checks on a full draft; new numbers stay allowed there because the
     diff turns them off until you check them */
  function checkPost2(texts, k, post, { allowNewNumbers = true } = {}) {
    const F = frame(post, 0, String(post).length), kept = [], rejected = {};
    for (const t0 of texts) {
      const t = stripModel(t0, F.core, true); if (!t) continue;
      const v = { text: t, s: 0, e: F.t.length, full: t };
      const why = judge(v, F, SH_OPTS.includes(k) ? k : null).filter(w => !(allowNewNumbers && w === 'newNumber') && !(k === 'shorter' && w === 'lostNumber' && false));
      if (why.length) { why.forEach(w => { rejected[w] = (rejected[w] || 0) + 1; }); continue; }
      if (kept.some(x => nearSame(x, t))) { rejected.nearDup = (rejected.nearDup || 0) + 1; continue; }
      kept.push(t);
    }
    return { kept, rejected };
  }
  /* ---------------- Sharpen the hook: one press, a better first line ----------------
     The moves a good editor makes on an opener, all tried at once: cut the warm-up and the hedges, ask then answer,
     lead with the number, put the result first, say the contrast in two beats, say advice as an instruction, drop the
     bait, and open a loop only when there's more to read. Every version keeps the writer's facts (numbers, tickers,
     names, the "not") and their casing, adds no number and no claim, then gets scored; the best one wins and says
     what it did. Returns null for an empty line. */
  const HK_ING = { lose: 'losing', lost: 'losing', make: 'making', made: 'making', trade: 'trading', traded: 'trading', post: 'posting', posted: 'posting', write: 'writing', wrote: 'writing', chase: 'chasing', chased: 'chasing', try: 'trying', tried: 'trying', build: 'building', built: 'building', run: 'running', ran: 'running', hold: 'holding', held: 'holding', buy: 'buying', bought: 'buying', sell: 'selling', sold: 'selling', get: 'getting', got: 'getting', cut: 'cutting', put: 'putting', sit: 'sitting', set: 'setting', quit: 'quitting', hit: 'hitting', stop: 'stopping', plan: 'planning', ship: 'shipping', shipped: 'shipping', spend: 'spending', spent: 'spending', work: 'working', worked: 'working', fail: 'failing', failed: 'failing', struggle: 'struggling', struggled: 'struggling', grind: 'grinding', grinded: 'grinding', tweet: 'tweeting', tweeted: 'tweeting', reply: 'replying', replied: 'replying', ignore: 'ignoring', ignored: 'ignoring', move: 'moving', revenge: 'revenge', overtrade: 'overtrading', overtraded: 'overtrading', check: 'checking', watch: 'watching', add: 'adding', average: 'averaging', fomo: 'FOMOing', ape: 'aping', marry: 'marrying', die: 'dying' };
  const ingOf = v => { const l = v.toLowerCase(); if (HK_ING[l]) return HK_ING[l]; if (/ie$/.test(l)) return l.slice(0, -2) + 'ying'; if (/[^aeiouy]e$/.test(l) && !/(ee|ye|oe)$/.test(l)) return l.slice(0, -1) + 'ing'; if (/^[^aeiou]*[aeiou][bdgmnprt]$/.test(l) && l.length <= 4) return l + l.slice(-1) + 'ing'; return l + 'ing'; };
  const HK_NUMW = '(?:\\d[\\d,.]*|one|two|three|four|five|six|seven|eight|nine|ten|twelve)';
  const HK_SUBJ = s => /^we$/i.test(s) ? 'We' : 'I';
  /* bait and announcements a hook never needs */
  const HK_BAIT = /\s*(?:[,.!]?\s*(?:like|rt|retweet|repost|follow|bookmark)(?:\s*(?:\+|&|and|\/)\s*(?:rt|retweet|repost|follow|bookmark|like))*\s+(?:if|for)\b[^.!?]*|[,.!]?\s*comment\s+["“']?\w+["”']?\s+(?:for|and i['’]ll|to get)\b[^.!?]*|[,.!]?\s*(?:agree|thoughts|am i wrong|change my mind)\s*\?|[,.!]?\s*\((?:a )?thread\)(?=(?:\s*(?:🧵|👇))*\s*$)(?:\s*(?:🧵|👇))*)\s*$/i;
  const HK_OPEN = /^(?:(?:hey|hi|hello|yo)(?: (?:guys|everyone|all|fam|frens|friends|team|y['’]?all))?|(?:ok(?:ay)?,?\s+)?so(?! (?:what|far|much|many|long|good|bad|true|close|yeah|cool)\b)|well(?! (?:done|said|known|made|paid|played|over|worth|before|after)\b)|(?:look|listen)(?=[,.!:—]| (?:i|we|you|guys|people|man|y['’]all)\b)|anyway|alright|guys|quick (?:thought|one|reminder|take|question)|(?:just )?a (?:quick )?(?:reminder|heads[- ]up|thought)(?: that)?|unpopular opinion,?(?: but)?|hot take,?(?: but)?|real talk|psa|(?:this is )?not financial advice,?(?: but)?|nfa,?(?: but)?|(?:so |really |super )?(?:excited|thrilled|happy|proud|humbled) to (?:announce|share)(?: that)?|(?:idk|i don['’]t know) who needs to hear this,?(?: but)?|i['’]?m (?:not an|no) expert,?(?: but)?|this (?:might|may|could) be (?:controversial|unpopular),?(?: but)?|not sure if (?:this makes sense|anyone cares),?(?: but)?)\b[,.:!—-]*\s+(?=\S)/i;
  /* r74: soft-word kinds that are a warm-up (said as "cut the warm-up"), not a hedge */
  const HK_WARMK = /^(announce|label|disclaim|stock|throat|open|feel)$/;
  /* words the app never writes (the never-say list every rewrite is checked against), said plainly instead */
  const HK_SWAP = [
    [/\b(?:has|have) been (?:kind of |sort of |a bit of |such |an absolute |a total |a real )?(?:a |an )?(?:game[- ]?changer|life[- ]?changer) (?:for|to) (my|our|the|your|their)\b/gi, 'changed $1'],
    [/\b(?:is|are|was) (?:kind of |sort of |such |an absolute |a total |a real )?(?:a |an )?(?:game[- ]?changer|life[- ]?changer) (?:for|to) (my|our|the|your|their)\b/gi, 'changes $1'],
    [/\b(?:a |an |such a |a real |a total |an absolute )?game[- ]?changer\b/gi, 'a big deal'],
    [/^leverage (?=(?:our|your|their|the|this|that|these|those|ai|data|it|them|my)\b)/i, 'Use '], [/\b(to|can|will|we|you|i|they|should|must) leverage (?=(?:our|your|their|the|this|that|these|those|ai|data|it|them|my)\b)/gi, '$1 use '], [/\bleveraging (?=(?:our|your|their|the|this|that|ai|data|it|my)\b)/gi, 'using '],
    [/\bunlock(?:s|ed|ing)?\b/gi, m => ({ unlock: 'open up', unlocks: 'opens up', unlocked: 'opened up', unlocking: 'opening up' })[m.toLowerCase()]],
    [/\bsupercharg(?:e|es|ed|ing)\b/gi, m => ({ supercharge: 'speed up', supercharges: 'speeds up', supercharged: 'sped up', supercharging: 'speeding up' })[m.toLowerCase()]],
    [/\belevat(?:e|es|ed|ing)\b/gi, m => ({ elevate: 'improve', elevates: 'improves', elevated: 'improved', elevating: 'improving' })[m.toLowerCase()]],
    [/\bseamless(ly)?\b/gi, (m, l) => l ? 'smoothly' : 'smooth'], [/\bdelv(?:e|es|ed|ing) (?:into|in)\b/gi, m => m.toLowerCase().replace(/^delv(e|es|ed|ing)/, (z, e) => ({ e: 'dig', es: 'digs', ed: 'dug', ing: 'digging' })[e])]
  ];
  /* "after hiring 300 people" → "I've hired 300 people" */
  const HK_PP = { hiring: 'hired', talking: 'talked', interviewing: 'interviewed', building: 'built', writing: 'written', posting: 'posted', shipping: 'shipped', launching: 'launched', reading: 'read', trading: 'traded', testing: 'tested', coaching: 'coached', working: 'worked', reviewing: 'reviewed', sending: 'sent', making: 'made', doing: 'done', spending: 'spent', losing: 'lost', growing: 'grown', selling: 'sold', running: 'run', managing: 'managed', leading: 'led', teaching: 'taught', training: 'trained', publishing: 'published', studying: 'studied', analyzing: 'analyzed', analysing: 'analysed', mentoring: 'mentored', onboarding: 'onboarded', investing: 'invested', pitching: 'pitched', closing: 'closed', raising: 'raised', firing: 'fired', journaling: 'journaled', tracking: 'tracked', recording: 'recorded', emailing: 'emailed', calling: 'called', meeting: 'met', watching: 'watched', using: 'used', trying: 'tried', editing: 'edited', ghostwriting: 'ghostwritten', designing: 'designed', surveying: 'surveyed', hosting: 'hosted', answering: 'answered', screening: 'screened', auditing: 'audited', helping: 'helped', scaling: 'scaled', grading: 'graded', placing: 'placed', booking: 'booked', speaking: 'spoken' };
  /* "be tracking" → "track": the base form back from an -ing word */
  const HK_BASE = { tracking: 'track', eating: 'eat', lifting: 'lift', sleeping: 'sleep', writing: 'write', posting: 'post', making: 'make', taking: 'take', using: 'use', running: 'run', shipping: 'ship', getting: 'get', doing: 'do', reading: 'read', building: 'build', trading: 'trade', saving: 'save', logging: 'log', journaling: 'journal', measuring: 'measure', stretching: 'stretch', walking: 'walk', drinking: 'drink', counting: 'count', testing: 'test', cutting: 'cut', planning: 'plan', hiring: 'hire', charging: 'charge', asking: 'ask', replying: 'reply', sizing: 'size', selling: 'sell', buying: 'buy', holding: 'hold', waiting: 'wait', checking: 'check', opening: 'open', sharing: 'share', talking: 'talk', listening: 'listen', studying: 'study', pricing: 'price', raising: 'raise', lowering: 'lower', firing: 'fire', automating: 'automate', documenting: 'document', reviewing: 'review', prioritizing: 'prioritize', focusing: 'focus', investing: 'invest' };
  const baseOf = w => { const l = String(w).toLowerCase(); if (HK_BASE[l]) return HK_BASE[l]; let s = l.replace(/ing$/, ''); if (/([^aeioulsz])\1$/.test(s)) s = s.slice(0, -1); return s; };
  const HK_DUR = '(?:about |almost |nearly |over |more than |around )?(?:\\d[\\d,.]*|a|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty) (?:years?|months?|weeks?|days?)';
  /* a line that ends on what the next line names ("is four words", "here are the patterns") leaves a colon when the post goes on */
  const teases = s => /\b(?:is|are|was|were)\s+(?:just |only )?(?:one|two|three|four|five|six|seven|\d+)\s+(?:words?|questions?|things?|lines?|steps?|rules?|letters?)$|\bhere(?:['’]s| is| are)\b|\b(?:this|these|the following)$/i.test(String(s).trim().replace(/[.!:]+$/, ''));
  const HM = {
    /* "I spent $1,200 on courses and the best lesson was free: write every day" → "$1,200 on courses. The best lesson was free: write every day." */
    money(x) {
      const m = body(x).match(/^(?:i|we) (?:spent|paid|burned|wasted|made|raised|invested|put|dropped|lost) (\$\d[\d,.]*\s?[kKmMbB]?|\d[\d,.]*\s?[kKmMbB]?\s?(?:usd|dollars|bucks))\s+(on|in|into|to|for|from|with|trading|chasing) ([^,:]{3,50}?)(?:,? and |, |\. )(.{6,})$/i); if (!m) return null;
      return { t: `${m[1]} ${m[2]} ${m[3]}. ${capFirst(m[4])}${endP(x) || '.'}`, mv: 'number' };
    },
    /* "I lost money for 3 years before I started journaling every trade" → "3 years of losing money. Then I started journaling every trade." */
    years(x) {
      const m = body(x).match(new RegExp(`^(i|we) (\\w+)( [^,]{0,40}?)? for (${HK_NUMW}) (years?|months?|weeks?|days?) (?:before|until) (?:i|we) (.{4,})$`, 'i')); if (!m || !HK_ING[m[2].toLowerCase()] && !/ed$/i.test(m[2])) return null;
      const v = HK_ING[m[2].toLowerCase()] || ingOf(m[2].replace(/ed$/i, ''));
      return { t: `${m[4]} ${m[5]} of ${v}${m[3] || ''}. Then ${HK_SUBJ(m[1])} ${m[6]}${endP(x) || '.'}`, mv: 'number' };
    },
    /* "I went from 200 to 4,000 followers in 90 days by replying to bigger accounts" → "200 → 4,000 followers in 90 days. The move: replying to bigger accounts." */
    fromTo(x) {
      const m = body(x).match(/^(?:i|we|my account|our account|it|we['’]ve|i['’]ve) (?:went|grew|jumped|got|have gone|['’]ve gone|climbed|moved) from (\$?\d[\d,.]*\s?[kKmM]?) to (\$?\d[\d,.]*\s?[kKmM]?)(?: ([a-z][a-z ]{2,24}?))?(?: in (\d+ \w+|a (?:week|month|year)|one (?:week|month|year)))?(?:,? (?:just )?(?:by|from|with) (.{4,}))?$/i); if (!m || !(m[3] || m[5])) return null;
      const head = `${m[1]} → ${m[2]}${m[3] ? ' ' + m[3] : ''}${m[4] ? ' in ' + m[4] : ''}`;
      return { t: m[5] ? `${head}. The move: ${m[5]}${endP(x) || '.'}` : `${head}${endP(x) || '.'}`, mv: 'number' };
    },
    /* "we shipped our onboarding redesign and trials went up 22% in a week" → "Trials up 22% in a week. What changed: we shipped our onboarding redesign." */
    result(x) {
      const m = body(x).match(/^(i|we) ((?:\w+ed|built|made|wrote|cut|ran|sent|put|took|did|began|quit|split|set|rebuilt|rewrote|killed|dropped|added|moved) .{3,50}?),? and (?:our |my |the )?([a-z][a-z ]{2,30}?) (went up|rose|grew|jumped|climbed|went down|fell|dropped|doubled|tripled|halved) (?:by )?(.{0,40})$/i); if (!m) return null;
      if (!/\d|doubled|tripled|halved/i.test(m[4] + ' ' + m[5]) || /\b(?:after|because|thanks to|due to|when|once|since|until)\b/i.test(m[5])) return null;
      const dir = /up|rose|grew|jumped|climbed/i.test(m[4]) ? 'up' : /down|fell|dropped/i.test(m[4]) ? 'down' : m[4].toLowerCase();
      return { t: `${capFirst(m[3])} ${dir}${m[5] ? ' ' + m[5] : ''}. What changed: ${m[1].toLowerCase() === 'we' ? 'we' : 'I'} ${m[2]}${endP(x) || '.'}`, mv: 'result' };
    },
    /* "thread on how I plan a week of posts in 20 minutes" → "I plan a week of posts in 20 minutes. Here's how:" */
    thread(x) {
      const b = body(x).replace(/:$/, '').replace(/^here(?: is|['’]s) (?=a )/i, ''); let m = b.match(/^(?:a |quick |short |mini |new |small )?(?:thread|🧵)\s*(?:on|about|:|-)?\s*(how|why) (i|we) (.{4,})$/i);
      if (m) return { t: `${HK_SUBJ(m[2])} ${m[3]}. Here’s ${m[1].toLowerCase()}:`, mv: 'loop', loop: true };
      m = b.match(/^(?:a |quick |short |mini |new |small )?(?:thread|🧵)\s*(?:on|about|:|-)\s*(.{6,})$/i); if (m) return { t: `${capFirst(m[1].replace(/\b(lessons?|things?|mistakes?|tips?) i learned from\b/i, '$1 from'))}:`, mv: 'warm' };
      return null;
    },
    /* "wanted to share some thoughts on why I stopped day trading" → "I stopped day trading. Here's why:" */
    share(x) {
      const m = body(x).replace(/:$/, '').match(/^(?:i |we )?(?:wanted|want|going|gonna|thought i['’]?d|i['’]d like|would like|i['’]m going) to (?:share|talk about|write about|explain|break down|go over|post about|say something about)(?: (?:some|a few|my|a couple of)(?: quick)? (?:thoughts|notes|lessons|takes|things))?(?: (?:on|about))? (.{4,})$/i); if (!m) return null;
      const w = m[1].match(/^(why|how) (i|we) (.{3,})$/i); if (w) return { t: `${HK_SUBJ(w[2])} ${w[3]}. Here’s ${w[1].toLowerCase()}:`, mv: 'loop', loop: true };
      const mind = m[1].match(/^something (?:that )?(?:has been|['’]s been|is|i['’]ve had) on my mind(?: lately| a lot)?,?\s*(?:and that['’]?s |which is )?(.{3,40})$/i); if (mind) return { t: `${capFirst(mind[1].replace(/[.!]+$/, ''))} has been on my mind lately.`, mv: 'warm' };
      return { t: `${capFirst(m[1])}:`, mv: 'warm' };
    },
    /* "Here is what I learned after 1 year of posting on X every day" → "1 year of posting on X every day. Here's what I learned:" */
    learnedAfter(x) {
      const m = body(x).replace(/:$/, '').match(/^(?:here(?:['’]s| is) )?what (i|we) (learned|found|noticed|got wrong|figured out|changed) (?:after|from|in) (.{4,})$/i); if (!m || !/\d|year|month|week|day/i.test(m[3])) return null;
      return { t: `${capFirst(m[3])}. Here’s what ${m[1].toLowerCase() === 'we' ? 'we' : 'I'} ${m[2]}:`, mv: 'number', loop: true };
    },
    /* "I learned that cutting losers fast matters more than finding winners" → "Cutting losers fast beats finding winners." and "Lesson: …" */
    lesson(x) {
      const m = body(x).match(/^(?:i|we)(?: have|['’]ve| finally)? (?:learned|realized|realised|found out|figured out|discovered|noticed)(?: that)? (.{8,})$/i); if (!m || /^(how|why|what|a lot|so much|the hard way)\b/i.test(m[1])) return null;
      return [{ t: `${capFirst(m[1])}${endP(x) || '.'}`, mv: 'straight' }, { t: `Lesson: ${m[1]}${endP(x) || '.'}`, mv: 'straight' }];
    },
    /* "matters more than" said in one word */
    beats(x) {
      if (!/\b(?:matters? more than|(?:is|are) (?:more important|better) than|wins over|outperforms)\b/i.test(x)) return null;
      return { t: x.replace(/\b(?:matters more than|is more important than|is better than|wins over|outperforms)\b/i, 'beats').replace(/\b(?:matter more than|are more important than|are better than)\b/i, 'beat'), mv: 'straight' };
    },
    /* "you don't need a bigger account, you need a better first line" → "You don't need a bigger account. You need a better first line." */
    contrast(x) {
      const m = body(x).match(/^([^,;]{2,70}?\b(?:\w+n['’]t|not|never|no)\b[^,;]{3,50}),\s*(?:but |just )?((?:you|i|we|it|they|the|most|your|my)\b[^,;]{4,70})$/i); if (!m || negsOf(m[2])) return null;
      return { t: `${m[1]}. ${capFirst(m[2])}${endP(x) || '.'}`, mv: 'contrast' };
    },
    /* "Don't chase green candles." → "Stop chasing green candles." */
    stop(x) {
      const m = body(x).match(/^(?:don['’]t|do not) ([a-z]+)\b(.*)$/i); if (!m || /^(be|have|get|let|forget|worry|know|think)$/i.test(m[1])) return null;
      return { t: `Stop ${ingOf(m[1])}${m[2]}${endP(x) || '.'}`, mv: 'straight', stop: true };
    },
    /* "I used to think more posts meant more growth" → "I used to think more posts meant more growth. I was wrong." */
    usedTo(x) {
      const m = body(x).match(/^(i|we) used to (?:think|believe) (?:that )?(.{6,})$/i); if (!m || /\bbut\b|\bthen\b|\bnow\b/i.test(m[2])) return null;
      const S = HK_SUBJ(m[1]); return { t: `${body(x)}. ${S} was${S === 'We' ? 'n’t' : ''} wrong.`.replace(/We wasn’t wrong/, 'We were wrong'), mv: 'contrast' };
    },
    /* "newsletters are underrated for crypto creators" → "Most underrated tool for crypto creators? Newsletters." and "Underrated for crypto creators: newsletters." */
    rated(x) {
      const m = body(x).match(/^([^,]{3,40}?) (?:is|are) (?:so |still )?(underrated|overrated|slept on) (for|in|on|by|among) (.{3,40})$/i); if (!m || /^(it|this|that|i|we|you|they)$/i.test(m[1])) return null;
      return [{ t: `${capFirst(m[2])} ${m[3]} ${m[4]}: ${/^[A-Z]{2,}|^\$/.test(m[1]) ? m[1] : m[1].replace(/^\w/, c => c.toLowerCase())}.`, mv: 'order' }];
    },
    /* "here's the thing about altcoin season, it's not coming the way you think" → "Altcoin season isn't coming the way you think." */
    thing(x) {
      const m = body(x).match(/^here(?:['’]s| is) the (?:thing|truth|deal) (?:about|with) ([^,:]{3,40})[,:]\s*(it|they)(?:['’]s| is|['’]re| are) (.{4,})$/i); if (!m) return null;
      const v = /^they/i.test(m[2]) ? 'are' : 'is', r = m[3].replace(/^not\s+/i, ''), pr = v === 'are' ? 'They’re' : 'It’s';
      return [{ t: r !== m[3] ? `${capFirst(m[1])} ${v}n’t ${r}${endP(x) || '.'}` : `${capFirst(m[1])} ${v} ${m[3]}${endP(x) || '.'}`, mv: 'warm' }, { t: `${capFirst(m[1])}? ${pr} ${m[3]}${endP(x) || '.'}`, mv: 'ask' }];
    },
    /* "BTC dominance hit 58% and alts are still bleeding" → "BTC dominance hit 58%. Alts are still bleeding." */
    andSplit(x) {
      const m = body(x).match(/^(.{8,70}?\d[^,]{0,30}?),? and ((?:\w+ ){0,3}(?:is|are|was|were|still|keep|keeps|have|has|haven['’]t|hasn['’]t|won['’]t|can['’]t|nobody|no one)\b.{3,60})$/i); if (!m || /^(?:i|we|you)\b/i.test(m[2])) return null;
      return { t: `${m[1]}. ${capFirst(m[2])}${endP(x) || '.'}`, mv: 'contrast' };
    },
    /* "Posting every day is overrated if nobody reads past your first line" → "Nobody reads past your first line? Then posting every day is overrated." */
    ifQ(x) {
      const m = body(x).match(/^([^,]{8,60}?) if ((?:nobody|no one|most people|people|your\b|you (?:can['’]t|don['’]t|aren['’]t|won['’]t|never|only)\b)[^,]{4,60})$/i); if (!m || /^(i|we)\b/i.test(m[1])) return null;
      const w0 = m[1].split(' ')[0]; return { t: `${capFirst(m[2])}? Then ${properish(w0, x.slice(1)) ? m[1] : lowFirst(m[1])}${endP(x) || '.'}`, mv: 'ask' };
    },
    /* "Here are 5 tips for writing better tweets" → "5 tips for writing better tweets:" */
    hereAre(x) { const m = body(x).replace(/:$/, '').match(/^here (?:are|is) (\d+|three|four|five|six|seven|eight|nine|ten) (.{4,})$/i); return m ? { t: `${capFirst(m[1])} ${m[2]}:`, mv: 'number' } : null; },
    /* "After 100 customer calls, here are the patterns I noticed" → "100 customer calls. Here are the patterns I noticed:" */
    afterN(x) { const m = body(x).replace(/:$/, '').match(/^after (\$?\d[\d,.]*k?|one|two|three|four|five|six|ten) ([a-z][^,]{2,40}),\s*(here(?:['’]s| is| are) )?(.{6,})$/i); if (!m) return null;
      return { t: `${capFirst(m[1])} ${m[2]}. ${m[3] ? capFirst(m[3].trim().replace(/^here is/i, 'Here’s')) + ' ' : ''}${m[3] ? m[4] : capFirst(m[4])}:`, mv: 'number', loop: true }; },
    /* "Does anyone else feel like posting every day is exhausting?" → "Posting every day is exhausting. Anyone else?" */
    anyoneElse(x) { const m = x.trim().match(/^(?:does|do) (?:anyone|anybody) else (?:ever )?(?:feel like|think|find|feel that|feel) (.{4,}?)\??$/i); return m ? { t: `${capFirst(m[1].replace(/[.!?]+$/, ''))}. Anyone else?`, mv: 'contrast' } : null; },
    /* "I used to spend 2 hours on every thread" → "… Not anymore." (what "used to" already says) */
    usedToDo(x) { const m = body(x).match(/^(i|we) used to (?!think|believe)(.{6,})$/i); return m && !/\b(but|now|until)\b/i.test(m[2]) ? { t: `${body(x)}. Not anymore.`, mv: 'contrast' } : null; },
    /* a moment in time: "I blew up my first account in 2021 by using 50x leverage" → "2021: I blew up my first account by using 50x leverage." */
    year(x) { const b = body(x), m = b.match(/^(.{6,}?)\s+in ((?:19|20)\d\d)\b(.*)$/); if (!m || /^(in|since|by)\b/i.test(m[1]) || /\b(?:that|which|who|whom|whose|when|where|because|if|since|while|i bought|we bought|i sold|we sold)\b/i.test(m[1]) || !/^(?:i|we|my|our|the|this|a|an|[A-Z$])\b/i.test(m[1])) return null; return { t: `${m[2]}: ${capFirst(m[1])}${m[3]}${endP(x) || '.'}`, mv: 'number' }; },
    /* "I don't think hustle culture is that bad" → "Hustle culture isn't that bad." */
    notThink(x) { const m = body(x).match(/^i (?:don['’]t|do not) (?:think|believe) (.{3,40}?) (is|are|was|were) (.{3,})$/i); if (!m) return null; const v = m[2].toLowerCase(); return { t: `${capFirst(m[1])} ${v}n’t ${m[3]}${endP(x) || '.'}`, mv: 'straight' }; },
    /* "Our biggest customer churned last week and it taught me a lot" → "… Here's what it taught me:" (only with more to read) */
    taught(x) { const m = body(x).match(/^(.{8,}?)(?:,| and)\s+it taught me (?:a lot|so much|everything|more than [^.]+)$/i); return m ? { t: `${m[1]}. Here’s what it taught me:`, mv: 'loop', loop: true, needMore: true } : null; },
    /* "I journaled every trade for a year and found one pattern that changed everything" → "… for a year. One pattern changed everything." */
    foundOne(x) { const m = body(x).match(/^(i|we) (.{6,60}?) and (?:found|noticed|realized|realised) (one|a|the) ([a-z ]{3,30}?) that (.{4,})$/i); if (!m) return null; const d = /^a$/i.test(m[3]) ? 'One' : capFirst(m[3].toLowerCase()); return { t: `${HK_SUBJ(m[1])} ${m[2]}. ${d} ${m[4]} ${m[5]}${endP(x) || '.'}`, mv: 'contrast' }; },
    /* "We launched our product today and got 400 signups in the first 24 hours" → "400 signups in the first 24 hours. We launched our product today." */
    gotN(x) { const m = body(x).match(/^(i|we) (launched|shipped|posted|published|sent|released|opened|started) (.{3,40}?) and (?:got|had|hit|made) (\$?\d[\d,.]*k?\s?[a-z]+(?: [^,]{0,30})?)$/i); return m ? { t: `${capFirst(m[4])}. ${HK_SUBJ(m[1])} ${m[2]} ${m[3]}.`, mv: 'result' } : null; },
    /* "some thoughts on why most threads flop" → "Why most threads flop:" */
    thoughts(x) { const m = body(x).replace(/:$/, '').match(/^(?:some|a few|my|quick)? ?thoughts on (.{4,})$/i); return m ? { t: `${capFirst(m[1])}:`, mv: 'warm' } : null; },
    /* milestones lead with the number: "i finally hit 10k followers after 2 years of posting" → "10k followers after 2 years of posting." / "2 years of posting. 10k followers." */
    milestone(x) { const m = body(x).match(/^(?:(?:i|we|my \w+|our \w+) )?(?:finally |just |officially )?(?:hit|crossed|reached|passed|got to) (\$?\d[\d,.]*k?\+? [a-z]+)(.*)$/i); if (!m) return null;
      const out = [{ t: `${m[1]}${m[2]}.`, mv: 'number' }]; const a = m[2].match(/^ (?:after|in) (\d[\d,.]*|one|two|three|four|five|six) (days?|weeks?|months?|years?)(?: of (.{3,30}))?$/i);
      if (a) out.push({ t: `${a[1]} ${a[2]}${a[3] ? ' of ' + a[3] : ''}. ${m[1]}.`, mv: 'number' }); return out; },
    /* r86 "The biggest mistake founders make is that they build too much" → "The biggest mistake founders make: they build too much." */
    isThat(x) { const m = body(x).match(/^((?:the|my|our|your) (?:single )?(?:biggest|most common|#1|number one|real|worst|hardest|only|first) (?:mistake|problem|lesson|issue|reason|thing|truth|secret|difference)[^,:]{0,60}?) (?:is|was) that (.{12,})$/i); return m ? { t: `${m[1]}: ${m[2]}${endP(x) || '.'}`, mv: 'straight' } : null; },
    /* r86 "I'd like to take a moment to thank my team for an incredible quarter." → "To my team: thank you for an incredible quarter." */
    thankYou(x) { const m = body(x).match(/^(?:i['’]?d|i would|we['’]?d|we would|i (?:just )?want(?:ed)?|we (?:just )?want(?:ed)?) (?:like )?to (?:take a (?:moment|second|minute) to )?(?:say (?:a (?:big |huge )?)?)?thank(?: you)?(?: to)? ((?:my|our|the|every|all)\b.{2,40}?) for (.{3,70})$/i); return m ? { t: `To ${m[1]}: thank you for ${m[2]}${endP(x) || '.'}`, mv: 'warm' } : null; },
    /* r86 "This week's issue is about why I stopped writing listicles, link below 👇" → "I stopped writing listicles. This week's issue is why. Link below 👇" */
    issueAbout(x) {
      const m = x.trim().match(/^((?:this week['’]s|today['’]s|this|the latest|our latest|my latest|new) (?:issue|edition|newsletter|episode|video|essay|post|podcast)) (?:is (?:all )?about|covers|is on|breaks down|dives into) (why|how) (i|we) ([^,👇]{4,}?)(?:[,.]?\s*((?:link (?:below|in (?:bio|(?:the )?replies))|read it (?:here|below))[^\p{L}]*?))?\s*((?:\p{Extended_Pictographic}️?\s*)*)[.!]?$/iu);
      if (!m) return null;
      const tail = m[5] ? ` ${capFirst(m[5].replace(/[.!\s]+$/, ''))}${m[6] ? ' ' + m[6].trim() : ''}` : m[6] ? ' ' + m[6].trim() : '';
      return { t: `${HK_SUBJ(m[3])} ${m[4].trim()}. ${capFirst(m[1])} is ${m[2].toLowerCase()}${m[5] ? '.' : ''}${tail}${m[5] || m[6] ? '' : '.'}`, mv: 'lead' };
    },
    /* r86 what an announcement leaves: "what we've been building for the last 8 months 👀" → "8 months of building. Here it is 👀" */
    madeFor(x) {
      const m = x.trim().match(new RegExp(`^what (?:i|we)(?:['’]ve| have) been (\\w+ing)(?: on)?(?: for)? (?:the (?:last|past) )?(${HK_DUR})([^\\p{L}\\p{N}]*)$`, 'iu'));
      if (m) return { t: `${capFirst(m[2])} of ${m[1].toLowerCase()}. Here it is${m[3].trim() ? ' ' + m[3].trim().replace(/^[.!]+\s*/, '') : '.'}`, mv: 'warm' };
      const w = x.trim().match(/^(what|how) (i|we)(?:['’]ve| have) been (\w+ing)\b(.{0,60})$/i);
      return w ? { t: `Here’s ${w[1].toLowerCase()} ${w[2].toLowerCase() === 'we' ? 'we' : 'I'}’ve been ${w[3].toLowerCase()}${w[4]}`, mv: 'warm' } : null;
    },
    /* r86 the caveat after the claim: "Maybe I'm wrong, but it's still early for ETH." → "It's still early for ETH. Maybe I'm wrong." */
    concede(x) {
      const m = body(x).match(/^(maybe i['’]m wrong|i (?:could|might) be wrong|call me crazy)(?:,|\s[—-])?\s+but,?\s+(.{8,})$/i); if (!m) return null;
      /* the caveat carries the stance now, so a kept "i think" in front of the claim can go */
      const claim = m[2].replace(/^qk[a-z]q,?\s+/i, '').replace(/^(?:i (?:really |honestly |genuinely )?(?:think|believe|feel like)(?: that)?|imo|imho),?\s+/i, '');
      return { t: `${capFirst(claim)}${endP(x) || '.'} ${capFirst(m[1])}.`, mv: 'lead' };
    },
    /* r86 the ticker leads: "the best risk/reward setup i've seen on $LINK all year" → "$LINK: best risk/reward setup i've seen all year." */
    tickerFirst(x) {
      const m = body(x).match(/^(?:the )?((?:best|worst|cleanest|ugliest|strongest|weakest|biggest|safest|riskiest|most \w+) [^,:$]{4,50}?) ((?:i['’]ve|i have) (?:seen|found|traded)|i see|i['’]ve got)? ?(?:on|in|for) (\$[A-Za-z]{2,10})\b(.{0,40})$/i); if (!m) return null;
      return { t: `${m[3]}: ${m[1]}${m[2] ? ' ' + m[2] : ''}${m[4]}${endP(x) || '.'}`, mv: 'ticker' };
    },
    /* r86 "A lot of people have been asking about my morning routine so here it is" → "My morning routine, since you asked:" */
    askedAbout(x) {
      const m = body(x).match(/^(?:a lot of|so many|lots of) (?:you|people|folks)(?: have been| keep| have)? ask(?:ing|ed)?(?: me)? (?:about|for) (.{4,50}?),? so here (?:it is|you go|it goes)$/i); if (!m) return null;
      return { t: `${capFirst(m[1])}, since you asked${endP(x) === '!' ? '.' : ':'}`, mv: 'warm' };
    },
    /* "Taking a break this weekend, will be back Monday" → "Taking a break this weekend. Back Monday." */
    back(x) { return /,\s*(?:i['’]?ll|will|i will) be back\b/i.test(x) ? { t: x.replace(/,\s*(?:i['’]?ll|will|i will) be back\b/i, '. Back'), mv: 'tight' } : null; },
    /* ---- round 74: the moves top posts make that drafts bury ---- */
    /* "after hiring over 300 people, the best interview question is four words" → "I've hired over 300 people. The best interview question is four words:" */
    afterIng(x) {
      const m = body(x).match(/^after (\w+ing)\b((?: (?:to|with|for|on|through|across))?) ((?:over |more than |almost |nearly |about |around )?(?:\$?\d[\d,.]*\+?k?|hundreds of|thousands of|dozens of) [^,]{2,40}?),?\s+(?:(?:i|we)(?:['’]ve| have)? (?:learned|found|realized|realised|noticed|seen)(?: that)? )?((?:here|the|my|our|most|every|i|we|you|it|this|one|nobody|no one|what)\b.{4,})$/i);
      if (!m) return null; const pp = HK_PP[m[1].toLowerCase()]; if (!pp) return null;
      const rest = m[4].replace(/^here is\b/i, 'here’s'), S = /\b(?:we|our|us)\b/i.test(rest) && !/\b(?:i|my|me)\b/i.test(rest) ? 'We’ve' : 'I’ve';
      return { t: `${S} ${pp}${m[2]} ${m[3]}. ${capFirst(rest)}${teases(rest) ? ':' : endP(x) || '.'}`, mv: 'number', loop: teases(rest) };
    },
    /* "I've been journaling every trade for a year and noticed most losses come on Fridays" → "A year of journaling every trade. Most losses come on Fridays." */
    forDur(x) {
      const m = body(x).match(new RegExp(`^(i|we|our team|my team|the team|our company)(?:['’]ve| have| has)? been (\\w+ing)\\b ([^,]{2,60}?) for (?:the (?:past|last) )?(${HK_DUR})(?: now| straight| in a row)?,?\\s+(?:and\\s+)?(.{6,})$`, 'i'));
      if (!m) return null;
      const subj = m[1].toLowerCase(), we = !/^i$/.test(subj), dur = m[4];
      const rest = m[5].replace(/^(?:i|we)(?:['’]ve| have)? (?:noticed|realized|realised|found|learned|figured out|discovered|seen)(?: that)? /i, '')
        .replace(/^the (?:one |biggest |main |only )?(?:thing|lesson) (?:i|we) wish (?:i|we)(?:['’]d| had)? (?:known|knew|learned|learnt)(?: earlier| sooner| at the start| from day one)? (?:is|was) (?:that )?/i, `What ${we ? 'we' : 'I'} wish ${we ? 'we' : 'I'} knew earlier: `);
      const lead = /^(i|we)$/.test(subj) ? `${capFirst(dur)} of ${m[2]} ${m[3]}` : `${capFirst(m[1])} spent ${dur} ${m[2]} ${m[3]}`;
      const out = [{ t: `${lead}. ${capFirst(rest)}${endP(x) || '.'}`, mv: 'number' }];
      if (/^the results (?:have been|were|are|so far have been) (?:interesting|surprising|wild|eye[- ]opening|mixed|humbling|fascinating)$/i.test(rest)) out.push({ t: `${lead}. Here’s what ${we ? 'we' : 'I'} found:`, mv: 'number', loop: true, needMore: true });
      return out;
    },
    /* "i finally hit my first $10k month trading, took me 3 years" → "my first $10k month trading took me 3 years." */
    tookMe(x) {
      const m = body(x).match(new RegExp(`^(?:i|we)(?: finally| just)? (?:hit|reached|crossed|made|got to|passed|landed|closed|signed) ((?:my|our) .{3,40}?),? (?:and )?(?:it )?took (me|us) (${HK_DUR})$`, 'i'));
      return m ? { t: `${capFirst(m[1])} took ${m[2]} ${m[3]}${endP(x) || '.'}`, mv: 'number' } : null;
    },
    /* "building in public has been weird, we got our first 1,000 users from one reddit comment" → the number leads, the feeling follows */
    numFirst(x) {
      /* the number side has to stand on its own: "it did 10x the replies" can't lead, its "it" points back */
      const m = body(x).match(/^(.{8,90}?)(?:,\s*(?:and\s+|but\s+|so\s+)?|\s+and\s+(?=(?:we|i|our|my|the)\b))((?:we|i|our|my|the|now)\b.{6,90})$/i); if (!m) return null;
      const A = m[1].trim(), B = m[2].trim(), fig = s => /\d/.test(s);
      if (fig(A) || !fig(B) || wordsN(A) < 3 || wordsN(B) < 4 || /^(?:if|when|because|since|after|before|while|once|until|as|although|though|today)\b/i.test(A)) return null;
      return { t: `${capFirst(B)}. ${capFirst(A)}${endP(x) || '.'}`, mv: 'number' };
    },
    /* "i stopped trading the open and my win rate went from 38% to 61%" → "my win rate went from 38% to 61%. what changed: i stopped trading the open." */
    result2(x) {
      const m = body(x).match(/^(?:(i|we|the team|our team|my team|they) )?((?:finally |just )?(?:\w+ed|built|made|wrote|cut|ran|sent|put|took|did|began|quit|split|set|rebuilt|rewrote|shipped|spent|got rid of|rolled out|threw out|tore out)\b.{3,70}?),? and (?:then )?((?:our|my|the|its|their) [^,]{2,30}?|(?!i\b|we\b)[a-z][a-z0-9 -]{2,30}?) (went up|went down|went|dropped|fell|rose|grew|jumped|climbed|increased|decreased|improved|is now|are now|doubled|tripled|halved|hit|crossed|reached|got)\b ?(.{0,50})$/i);
      if (!m || !/\d|doubled|tripled|halved/i.test(m[4] + ' ' + m[5]) || (m[4].toLowerCase() === 'got' && !/\d/.test(m[5])) || /\b(?:after|because|thanks to|due to|when|once|since|until|from (?:a|one|the|my|our) (?!\d))\b/i.test(m[5])) return null;
      const who = m[1] ? (/^i$/i.test(m[1]) ? 'I' : m[1].toLowerCase()) : /\bour\b/i.test(m[2]) ? 'we' : /\bmy\b/i.test(m[2]) ? 'I' : null; if (!who) return null;
      return { t: `${capFirst(m[3])} ${m[4]}${m[5] ? ' ' + m[5] : ''}. What changed: ${who} ${m[1] ? m[2] : lowFirst(m[2])}${endP(x) || '.'}`, mv: 'result' };
    },
    /* "Churn was reduced by 34% after the onboarding was redesigned by our team" → "Churn: down 34%. What changed: our team redesigned the onboarding." */
    passive(x) {
      const m = body(x).match(/^((?:our |my |the )?[a-z][\w -]{2,30}?) (?:was|were|has been|have been|got) (reduced|cut|lowered|decreased|dropped|increased|raised|improved|boosted|grown|doubled|halved|tripled) (?:by )?(\$?\d[\d,.]*\s?(?:%|x|k|ms|points?|pts)?)\s*(?:after|when|once) ((?:our |my |the |a )?[\w -]{2,40}?) (?:was|were|got) (\w+ed|built|rebuilt|rewritten|made|shipped|redone) by (our team|the team|us|me|our engineers|our designers|our product team)$/i);
      if (!m) return null;
      const up = /increased|raised|improved|boosted|grown|doubled|tripled/i.test(m[2]), who = /^us$/i.test(m[6]) ? 'we' : /^me$/i.test(m[6]) ? 'I' : m[6].toLowerCase();
      return [{ t: `${capFirst(m[1])}: ${up ? 'up' : 'down'} ${m[3]}. What changed: ${who} ${m[5]} ${m[4]}${endP(x) || '.'}`, mv: 'active' }, { t: `${capFirst(m[1])} ${up ? 'rose' : 'fell'} ${m[3]} after ${who} ${m[5]} ${m[4]}${endP(x) || '.'}`, mv: 'active' }];
    },
    /* "Today marks one year since I quit my job, and we're at $4.2k MRR" → "One year since I quit my job. We're at $4.2k MRR." */
    since(x) {
      const m = body(x).match(new RegExp(`^(?:today (?:marks|is)|it['’]s been|it has been|this (?:week|month) marks|(?:i|we) can['’]t believe it['’]s been) (?:exactly )?(${HK_DUR}) since (.{6,90}?)(?:(?:,? and |\\. |, )(.{4,}))?$`, 'i'));
      if (!m) return null; const out = [{ t: `${capFirst(m[1])} since ${m[2]}.${m[3] ? ' ' + capFirst(m[3]) + (endP(x) || '.') : ''}`, mv: 'moment' }];
      if (m[3] && /\d/.test(m[3]) && !/\d/.test(m[2])) out.push({ t: `${capFirst(m[3])}. ${capFirst(m[1])} since ${m[2]}${endP(x) || '.'}`, mv: 'number' });
      return out;
    },
    /* "we have decided to remove the free plan, which was a hard call" → "We're removing the free plan. It was a hard call." */
    decided(x) {
      const m = body(x).match(/^(we|i)(?: have|['’]ve)? (?:finally |officially )?decided to (\w+) (.{3,60}?)(?:,? which (?:was|has been|is) (.{4,60}))?$/i); if (!m) return null;
      return { t: `${HK_SUBJ(m[1]) === 'We' ? 'We’re' : 'I’m'} ${ingOf(m[2])} ${m[3]}.${m[4] ? ` It was ${m[4]}${endP(x) || '.'}` : ''}`, mv: 'straight' };
    },
    /* "you should be tracking your protein if you want to build muscle" → "Want to build muscle? Track your protein." */
    ifWant(x) {
      const m = body(x).match(/^(?:you |we )?(?:should|need to|have to|must|gotta|ought to)(?: always)? (?:be (\w+ing)|(\w+)) (.{3,50}?) if you (?:really )?(?:want|wanna|are trying|['’]re trying|plan|hope) to (.{3,50})$/i);
      if (!m) return null; const v = m[1] ? baseOf(m[1]) : m[2];
      return { t: `Want to ${m[4]}? ${capFirst(v)} ${m[3]}${endP(x) || '.'}`, mv: 'ask' };
    },
    /* "most design systems fail because nobody owns them" → "Why do most design systems fail? Nobody owns them." */
    whyBecause(x) {
      const m = body(x).match(/^((?:most|many|so many|a lot of|lots of) [a-z][^,]{4,50}?) because (.{4,70})$/i); if (!m) return null;
      const c = m[1]; if (/\b(?:is|was|has|had|does|did|can|will|would|should|could|might|must|seem|seems|\w+ed)\b/i.test(c)) return null;
      const are = c.match(/^(.+?) (are|were) (.+)$/i);
      const lc0 = properish(c.split(' ')[0], x.slice(1)) ? c : lowFirst(c), w = lc0.split(' ');
      /* the verb, so the question agrees: "most B2B content fails" → "why does most B2B content fail" */
      const V = /^(fail|flop|die|stall|quit|lose|miss|break|churn|struggle|stop|underperform|suck|get|make|look|feel|sound|read|sell|work|end|go|ignore|skip|chase|hate|need|want|burn|plateau|post|write|hire|ship|win|grow|convert|launch|blow|crash|leave|give|burn|lag|fade|rug|dump|pump|bleed)(s|es)?$/i;
      const vi = w.findIndex((t, i) => i >= 1 && V.test(t)), neg = / (?:don['’]t|do not) /i.test(c);
      if (!are && !neg && vi < 1) return null;
      const sg = vi >= 1 && /(?:[^s]s|es)$/i.test(w[vi]) && !/(?:ss)$/i.test(w[vi]), base = vi >= 1 ? w[vi].replace(V, '$1') : '';
      const q = are ? `Why ${are[2].toLowerCase()} ${lowFirst(are[1])} ${are[3]}?` : neg ? `Why don’t ${lc0.replace(/ (?:don['’]t|do not) /i, ' ')}?` : `Why ${sg ? 'does' : 'do'} ${w.slice(0, vi).join(' ')} ${base}${w.length > vi + 1 ? ' ' + w.slice(vi + 1).join(' ') : ''}?`;
      return { t: `${q} ${capFirst(m[2])}${endP(x) || '.'}`, mv: 'ask' };
    },
    /* "it is essential for sales leaders to prioritize retention" → "Sales leaders: prioritize retention." */
    essential(x) {
      const m = body(x).match(/^it(?:['’]s| is) (?:so |really |very |absolutely )?(?:essential|important|crucial|critical|vital|key|necessary) for ((?:every |all |most |new |early[- ]stage |first[- ]time )?[a-z][\w -]{2,30}?) to (.{4,90})$/i); if (!m) return null;
      return [{ t: `${capFirst(m[1])}: ${m[2]}${endP(x) || '.'}`, mv: 'straight' }, { t: `${capFirst(m[1])} should ${m[2]}${endP(x) || '.'}`, mv: 'straight' }];
    },
    /* "our team has been recognized as one of the top 50 startups in fintech" → "Top 50 startups in fintech. Our team made the list." */
    named(x) {
      const m = body(x).match(/^((?:our|my) (?:team|company|startup|agency|firm|product|app|newsletter|podcast)|we|i) (?:has been|have been|was|were|got|just got) (?:recognized|named|listed|ranked|selected|chosen|picked|featured) (?:as |in |on )?(?:one of )?(?:the )?((?:top|best) \d+ [^,]{3,70}?)$/i); if (!m) return null;
      return { t: `${capFirst(m[2])}. ${capFirst(m[1])} made the list${endP(x) || '.'}`, mv: 'number' };
    },
    /* "we're hosting a webinar next Tuesday on how to cut churn by 20%" → "How to cut churn by 20%. We're hosting a webinar on it next Tuesday." */
    event(x) {
      const m = body(x).match(/^(we|i)(?:['’]re| are|['’]m| am|['’]ll be| will be) (hosting|running|doing|teaching|giving) (an? (?:free |live |short |quick )?(?:webinar|workshop|live session|live stream|livestream|stream|class|masterclass|talk|ama|q&a|session|meetup|office hours)) ((?:next|this) \w+|tomorrow|today|tonight|on \w+day)((?: at [\w:]+(?: ?[ap]m)?)?) on ((?:how|why|what) .{6,70})$/i); if (!m) return null;
      return { t: `${capFirst(m[6])}. ${HK_SUBJ(m[1]) === 'We' ? 'We’re' : 'I’m'} ${m[2]} ${m[3]} on it ${m[4]}${m[5]}${endP(x) || '.'}`, mv: 'payoff' };
    },
    /* "i finally figured out why i couldn't lose weight for 5 years" → "5 years of not losing weight. i finally figured out why." */
    figuredWhy(x) {
      const m = body(x).match(new RegExp(`^(i|we) (finally |just )?(figured out|found out|worked out|learned|realized|realised) why (?:i|we) (?:couldn['’]t|could not|didn['’]t|did not|kept failing to|never|wasn['’]t able to|weren['’]t able to) (\\w+) (.{2,40}?) for (${HK_DUR})$`, 'i'));
      return m ? { t: `${capFirst(m[6])} of not ${ingOf(m[4])} ${m[5]}. ${HK_SUBJ(m[1])} ${m[2] || ''}${m[3]} why${endP(x) || '.'}`, mv: 'number' } : null;
    },
    /* "Over the past 10 years of leading teams, I've learned that feedback is a gift" → "What 10 years of leading teams taught me: feedback is a gift." */
    taughtMe(x) {
      const m = body(x).match(new RegExp(`^(?:over|in|after|during) (?:the (?:past|last) |my |our )?(${HK_DUR}) ((?:of|as|in|at)\\b[^,]{3,40}),\\s*(i|we)(?:['’]ve| have)? (?:learned|realized|realised|found|seen|noticed|figured out)(?: that)? (.{6,})$`, 'i'));
      if (!m) return null; const me = /^we$/i.test(m[3]) ? 'us' : 'me';
      return [{ t: `What ${m[1]} ${m[2]} taught ${me}: ${m[4]}${endP(x) || '.'}`, mv: 'number' }, { t: `${capFirst(m[4])}. ${capFirst(m[1])} ${m[2]} taught ${me} that${endP(x) || '.'}`, mv: 'straight' }];
    },
    /* "I've been thinking a lot about pricing lately and we were undercharging" → "Pricing: we were undercharging." */
    thinking(x) {
      const m = body(x).match(/^(?:i|we)(?:['’]ve| have)? been (?:thinking|reflecting|obsessing)(?: (?:a lot|so much|way too much|nonstop))? (?:about|on|over) ([^,]{3,40}?)(?: (?:lately|recently|this week|this month|a lot))?,? (?:and|but|so) (?:i (?:think|realized|realised|learned|figured out)(?: that)? )?(.{6,})$/i); if (!m) return null;
      return { t: `${capFirst(m[1])}: ${lowFirst(m[2])}${endP(x) || '.'}`, mv: 'warm' };
    },
    /* a comma splice made two beats: "Stop using story points, they don't mean anything" → "Stop using story points. They don't mean anything." */
    splice(x) {
      const m = body(x).match(/^(.{10,}?), (they|it|that|this|we|i|you|he|she|nobody|everyone|none) ((?:don['’]t|doesn['’]t|didn['’]t|aren['’]t|isn['’]t|wasn['’]t|won['’]t|can['’]t|never|always|are|is|was|were|have|has|had|can|will|still|all|only|\w+ed)\b.{3,})$/i) || body(x).match(/^(.{10,}?), (they['’]re|it['’]s|that['’]s|we['’]re|i['’]m|you['’]re|he['’]s|she['’]s|they['’]ve|we['’]ve|i['’]ve) (.{3,})$/i); if (!m) return null;
      if (/^(?:if|when|because|since|after|before|while|once|until|as|although|though|unless|whether)\b/i.test(m[1]) || wordsN(m[1]) < 3) return null;
      if (/^(?:\w+['’]\w+|\w+) (?:you|me|them|him|her|us)\b/i.test(m[2] + ' ' + m[3]) && false) return null;
      return { t: `${m[1]}. ${capFirst(m[2])} ${m[3]}${endP(x) || '.'}`, mv: 'contrast' };
    },
    /* "I lost 40% of my account in 2022 because I didn't use stop losses" → "I lost 40% of my account in 2022. I didn't use stop losses." */
    becauseSplit(x) {
      const m = body(x).match(/^((?:i|we|my|our)\b.{8,70}?) because ((?:i|we|my|our|it|they|the|nobody|no one)\b.{4,60})$/i); if (!m || !/\d|\b(?:lost|quit|failed|left|stopped|almost|never|blew)\b/i.test(m[1])) return null;
      return { t: `${m[1]}. ${capFirst(m[2])}${endP(x) || '.'}`, mv: 'contrast' };
    },
    /* once the warm-up is gone, "why our sales team stopped cold calls" says what happened and holds the reason back: "Our sales team stopped cold calls. Here's why:" */
    whyClause(x) {
      const m = body(x).replace(/:$/, '').match(/^(why|how) ((?:i|we|my|our|the|most|many|this|these|people|everyone|nobody|[A-Z$][\w$]*)\b.{6,90})$/i); if (!m || /^(?:do|does|did|is|are|can|should|would|will|to)\b/i.test(m[2])) return null;
      const said = capFirst(m[2].replace(/^i\b/, 'I'));
      return [{ t: `${said}. Here’s ${m[1].toLowerCase()}:`, mv: 'loop', loop: true, needMore: true }, { t: `${said}${endP(x) || '.'}`, mv: 'straight' }];
    }
  };
  const HM_FIRST = [HM.isThat, HM.milestone, HM.tookMe, HM.gotN, HM.result, HM.result2, HM.thankYou, HM.madeFor, HM.concede, HM.tickerFirst, HM.fromTo, HM.passive, HM.money];
  /* moves that read two sentences at once */
  const HM2 = {
    /* a topic left behind by a cut warm-up, then the fact: "our launch. only 11 people came." → "our launch: only 11 people came." */
    topicColon(x) {
      const m = x.trim().match(/^((?:our|my|the|this|last|yesterday['’]s|today['’]s|this week['’]s) [a-z][\w -]{2,30})[.:]\s+([a-z].{6,80}?[.!?]?)$/i); if (!m || wordsN(m[1]) > 4 || /\b(?:is|are|was|were|has|have|had|did|went|got)\b/i.test(m[1])) return null;
      return { t: `${capFirst(m[1])}: ${lowFirst(m[2])}`, mv: 'tight' };
    },
    /* "new issue is out. been doing this every sunday for 3 years" → "3 years, every sunday. new issue is out." */
    beenDoing(x) {
      const m = x.trim().match(new RegExp(`^([^.!?]{4,40})[.!?]+\\s+(?:i['’]ve |we['’]ve |i have |we have )?been (?:doing|writing|sending|posting|shipping|running|publishing|making) (?:this|it|these|them|one) ((?:every|each) \\w+) for (${HK_DUR})[.!?]*$`, 'i')); if (!m) return null;
      return { t: `${capFirst(m[3])}, ${m[2]}. ${capFirst(m[1].trim())}.`, mv: 'number' };
    }
  };
  /* the core moves the Sharpen menu already trusts, for the first line */
  /* r74: "Because X, Y" (swap) left the menu of first-line moves: on an opener it buries the claim behind its reason */
  const HK_CORE = [['revealQ', 'ask'], ['invertQ', 'ask'], ['isQ', 'ask'], ['invert', 'ask'], ['condQ', 'ask'], ['imperative', 'straight'], ['notFlip', 'contrast'], ['statColon', 'number'], ['thereIs', 'tight'], ['split', 'contrast'], ['whichWhy', 'contrast']];
  const HK_SAY = { warm: 'cut the warm-up', soft: n => `cut ${n} soft word${n === 1 ? '' : 's'}`, bait: 'dropped the bait', ask: 'asked, then answered', number: 'led with the number', result: 'led with the result', active: 'named who did it', payoff: 'led with the payoff', moment: 'opened on the moment', contrast: 'split it into two beats', straight: 'said it straight', loop: 'left a reason to read on', order: 'put the payoff last', tight: 'tightened it', end: 'gave it an end', lead: 'led with the claim', ticker: 'led with the ticker' };
  /* why each move works, one sentence a creator could screenshot: what the reader does, not what the algorithm does. No numbers we didn't measure */
  const HK_WHY = {
    ask: 'A question opens a gap and your answer closes it in the same line, so the payoff lands before the thumb moves.',
    number: 'A real number up front reads as proof, before anyone has decided whether to keep reading.',
    result: 'Outcome first, method second. People stop for the result and stay to find out how.',
    active: 'Active voice names who did it, so it reads like you were in the room, not like a press release.',
    payoff: 'What they get comes first and the logistics second. Nobody stops for a calendar invite.',
    moment: 'It opens on a moment in time, so it reads like a story starting, not an update.',
    contrast: 'Two short beats with a full stop between them. The pause makes the second one land.',
    straight: 'The claim with nothing cushioning it. Said plainly, it reads like you’ve earned it.',
    loop: 'It promises something the next line pays off, so reading on feels like the obvious move.',
    order: 'The payoff sits at the end of the line, where the reader’s attention lands.',
    tight: 'Same claim in fewer words, so it reads in one glance.',
    warm: 'The line now starts where your point does. The first words are the ones people judge.',
    soft: 'Hedges ask the reader to doubt you. Without them the claim stands on its own.',
    bait: 'Bait phrases teach readers to scroll. The real claim is more interesting than the tease.',
    lead: 'Your point comes first, so the first words people read are the ones that matter.',
    ticker: 'The ticker up front tells traders what it’s about before they decide whether to read on.'
  };
  /* which move a version is "about", when it made several */
  const HK_PRI = ['result', 'active', 'payoff', 'ask', 'number', 'ticker', 'lead', 'moment', 'contrast', 'straight', 'loop', 'order', 'tight', 'bait', 'warm', 'soft'];
  const HK_CLAIM = /\b(is|are|was|isn['’]t|aren['’]t|should|shouldn['’]t|must|matters?|beats?|wins?|never|always|most|best|worst|only|don['’]t|stop|nobody|everyone|overrated|underrated|wrong|mistake|edge|secret|rule|key)\b|^(take|sell|buy|size|cut|journal|reply|wait|protect|skip|trust|scale|keep|ship|write|post|stop|start|quit|raise|charge)\b/i;
  const HK_STORY = /\b(i|we|my|our)\b.*\b(\w+ed|lost|made|spent|took|quit|sold|bought|went|got|ran|built|wrote|hit|cut|left|found|did|began|became|grew|fell)\b/i;
  /* words this voice put back after a cut are masked first, so no clean step or move can take them out again */
  /* r86: "gm" / "gn" / "wagmi" up front is the writer's voice, not a warm-up: Sharpen works on what follows and puts it back */
  const HK_VOICE = /^(?:gm|gn|gmi|wagmi|ngmi|lfg)\b[.!,]*[ \t]+(?=\S)/i;
  function hookUp(post, opts = {}) {
    const p0 = String(post || ''), vm = opts.noVoice ? null : p0.match(HK_VOICE);
    if (vm) {
      const pre = vm[0], r = hookUp(p0.slice(pre.length), { ...opts, noVoice: true }); if (!r) return r;
      const from = hookScore(p0).score, fix = o => { if (!o) return o; const line = pre + o.line, text = pre + (o.text != null ? o.text : o.line); return { ...o, line, text, score: hookScore(text).score }; };
      const best = fix(r.best);
      return { ...r, from, base: { line: pre + r.base.line, score: hookScore(pre + r.base.line).score }, best: best && best.score > from ? best : null, alts: (r.alts || []).map(fix).filter(a => a.score > from), voice: pre.trim() };
    }
    /* the words this voice keeps, and on a price call the writer's stance ("i think", "imo", "probably") */
    const keep = [...new Set([...(opts.keep || []), ...stanceKeep(p0.split('\n')[0])])].filter(w => w && w.length > 1); if (!keep.length) return hookUp0(post, opts);
    const KM = [], re = new RegExp(`(?<![\\p{L}\\p{N}])(${keep.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\p{L}\\p{N}])`, 'giu');
    const masked = p0.replace(re, m => { if (KM.length >= 26) return m; KM.push(m); return `Qk${String.fromCharCode(96 + KM.length)}q`; }); if (!KM.length) return hookUp0(post, opts);
    const un = s => typeof s === 'string' ? s.replace(/Qk([a-z])q/gi, (m, i) => KM[i.toLowerCase().charCodeAt(0) - 97]) : s, unO = o => { if (!o) return o; const x = { ...o, line: un(o.line) }; if ('text' in o) { x.text = un(o.text); x.score = hookScore(x.text).score; } else x.score = hookScore(x.line).score; return x; };
    const r = hookUp0(masked, { ...opts, keep: null, unmask: un }); if (!r) return r;
    /* scores come from the real words, not the mask */
    const from = hookScore(p0).score, best = unO(r.best);
    return { ...r, from, base: unO(r.base), best: best && best.score > from ? best : null, alts: (r.alts || []).map(unO).filter(a => a.score > from), kept: KM.length };
  }
  function hookUp0(post, opts = {}) {
    const t = String(post || ''), nl = t.indexOf('\n'), line0 = nl < 0 ? t : t.slice(0, nl), rest = nl < 0 ? '' : t.slice(nl);
    const L = line0.trim(); if (!L) return null;
    const more = opts.more != null ? !!opts.more : !!rest.trim();
    const st = styleOf(t), lowStart = /^\P{L}*\p{Ll}/u.test(L) && !/^\P{L}*(?:i\b|iPhone|eBay|x\b)/.test(L);
    /* their casing stays theirs: a line that starts lowercase stays lowercase, a lowercase "i" stays lowercase */
    /* with a body, the body says how they write (a lowercase slip on line one isn't a style); a lone line keeps its own */
    const sty = { low: rest.trim() ? st.low : lowStart, loI: st.loI, noApos: st.noApos, apos: st.apos };
    /* scores read the real words: a kept word is scored as itself, never as its mask */
    const scoreOf = s => hookScore(opts.unmask ? opts.unmask(s + rest) : s + rest).score, s0 = scoreOf(L);
    const said = new Set(); let soft = 0;
    /* 1. clean: warm-ups, hedges and bait out, the end finished */
    let x = L;
    const cutW = []; /* the words cut, as written: the receipt shows them struck */
    for (let i = 0; i < 3; i++) { const y = x.replace(HK_OPEN, m => { cutW.push(m.replace(/[\s,.:!—-]+$/, '')); return ''; }); if (y === x) break; x = y; said.add('warm'); }
    /* r74: the shared soft-word table: whole warm-ups (an announcement, a label, a disclaimer, backstory) go as one piece */
    const sc0 = softCut(x); if (sc0.cut.length) { x = sc0.s; cutW.push(...sc0.cut); sc0.kinds.forEach(k => { if (HK_WARMK.test(k)) said.add('warm'); else soft++; }); }
    /* r86: a trader's "nfa" is a habit or a compliance reflex: on a call it goes to the end, where a disclaimer belongs */
    const nfa0 = cutW.map(w => (w.match(/^(?:this is )?(nfa|not financial advice)\b/i) || [])[1]).find(Boolean) || '', nfa = nfa0 && (isCall(L) || /\$[a-z]{2,10}\b/i.test(L)) ? nfa0 : '';
    x = x.replace(/^(?:that|and|but|so)\s+(?=(?:i|we|my|our|the|this|it|you|your|they)\b)/i, '');
    const kept = x; /* what's left once the warm-up is gone: the words a version has to keep */
    /* bait in words goes; a 🧵 or 👇 after "(a thread)" stays, it's the format */
    const xb = x.replace(HK_BAIT, m => { const e = (m.match(/(?:🧵|👇)/gu) || []).join(''); return e ? ' ' + e : ''; }); if (xb !== x && xb.trim().length > 8) { x = xb.trim(); said.add('bait'); }
    const h0 = hedgeN(x); x = cutHedges(x, { start: true, end: true }); x = cutHedges(x, { start: true, end: true }); soft += Math.max(0, h0 - hedgeN(x));
    /* words the app never writes, said plainly instead ("a game changer for my energy" → "changed my energy") */
    { const w1 = x; x = sub(x, HK_SWAP); if (x !== w1) said.add('tight'); }
    { const w0 = x; x = sub(x, WORDY); if (x !== w0) said.add('tight'); } /* "are going to be hosting" → "are hosting" is a real edit, said as one */
    /* "the mistake was not taking profits" must never become "wasn't taking profits": a "not" before an -ing word stays apart */
    const CW = CONTRACT_W.map(([re, w]) => [rx(re.source.replace(/ not\\b$/, ' not\\b(?!\\s+\\w+ing\\b)'), re.flags), w]);
    x = /\b(edge|key|answer|trick|secret|move|problem|fix|lesson|goal|rule|play|mistake|point|thing|cure|solution|habit|tell)\s+(?:is|was|are)\s+not\b/i.test(x) ? sub(x, CW.slice(1)) : sub(x, CW);
    x = x.replace(/!{2,}(?=\s)/g, '.').replace(/!+(?=\s*$)/, '.').replace(/\bhere is\b/gi, m => m[0] === 'H' ? 'Here’s' : 'here’s').replace(/\bim\b/g, st.noApos ? 'im' : 'I’m');
    x = tidyT(x).trim();
    let tailE = ''; { const te = x.match(/\s*((?:\p{Extended_Pictographic}️?|\p{Regional_Indicator}{2})(?:\s*(?:\p{Extended_Pictographic}️?|\p{Regional_Indicator}{2}))*)\s*$/u); if (te && wordsN(x.slice(0, te.index)) >= 3) { tailE = te[1]; x = x.slice(0, te.index).trimEnd(); } }
    const tailP = !!tailE && /[.!?…:]$/.test(x);
    if (/[\p{L}\p{N}%)$]$/u.test(x) && !/(?:https?:\/\/\S+|\b[\w-]+\.(?:com|io|xyz|co|ai|app|dev|so|gg|me|org|net|ly|to)(?:\/\S*)?|[@#][\w]+)$/i.test(x)) { x += /^(?:anyone|anybody|who else|am i the only|is it just me|wdyt|thoughts)\b|^(?:(?:why|how|what|who|when|where|which) (?:is|are|was|were|do|does|did|can|could|should|would|will|has|have|am)|(?:is|are|do|does|did|can|could|should|would|will|has|have|am|isn['’]t|aren['’]t|don['’]t|doesn['’]t))\b/i.test(x) ? '?' : '.'; said.add('end'); }
    const base = x, baseSaid = [...said];
    /* 2. moves, then a second move on what the first one made */
    const cands = [{ t: base, mv: [] }];
    const push = (r, from) => { (Array.isArray(r) ? r : [r]).forEach(o => { if (o && o.t && !(o.needMore && !more)) cands.push({ t: o.t, mv: [...from.mv, o.mv], loop: o.loop || from.loop, stop: o.stop || from.stop }); }); };
    const step = from => {
      /* sentences, without splitting "$4.2k" or "v2.1" at the point */
      const ss = (from.t.match(/(?:[^.!?]|[.!?](?=[^\s.!?"”’)]))+(?:[.!?]+["”’)]*)?/g) || [from.t]).map(z => z.trim()).filter(Boolean), one = ss.length === 1;
      Object.values(HM).forEach(f => {
        if (one) { try { push(f(from.t), from); } catch (e) { /* a move that doesn't fit this line */ } return; }
        /* r86: on a line of several sentences, a move may reshape the first one; the rest follows as written */
        if (!HM_FIRST.includes(f)) return;
        try { const r = f(ss[0]); (Array.isArray(r) ? r : [r]).forEach(o => { if (o && o.t && !o.loop && !o.needMore && !/:$/.test(o.t)) push({ ...o, t: [o.t, ...ss.slice(1)].join(' ') }, from); }); } catch (e) { /* a move that doesn't fit */ }
      });
      Object.values(HM2).forEach(f => { try { push(f(from.t), from); } catch (e) { /* a move that doesn't fit this line */ } });
      HK_CORE.forEach(([k, mv]) => { if (!one && !['split', 'statColon', 'thereIs', 'imperative', 'whichWhy'].includes(k)) return; ss.forEach((s, i) => { if ((k === 'swap' || k === 'front') && /\b(and|but)\b/i.test(s)) return; if (k === 'front' && !/^(i|we|my|our|the|a|an|this|that|most|people|\$|[A-Z0-9])/.test(s.trim())) return; if (k === 'statColon' && /^(i|we|my|our|you|your)\b/i.test(s.trim())) return; let y = null; try { y = MOVES[k](s.trim()); } catch (e) { y = null; } if (y && y !== s.trim()) push({ t: ss.map((z, j) => j === i ? y : z.trim()).join(' '), mv }, from); }); });
    };
    step(cands[0]); cands.slice(1).forEach(c => step(c));
    /* 3. a reason to read on, only when there is more to read and the line makes a claim or starts a story */
    const restOpens = /^\s*(?:here['’]s|here is|why|because|the reason|that['’]s why)\b/i.test(rest);
    if (more && !restOpens) cands.slice().forEach(c => { if (c.loop || /[:?…]$/.test(c.t) || /\bhere['’]s (why|how|what)\b/i.test(c.t) || c.t.length > 110) return; const story = HK_STORY.test(c.t), claim = HK_CLAIM.test(c.t); if (!story && !claim) return;
      cands.push({ t: c.t.replace(/[.!]$/, '') + (story && !claim && !/\b(stopped|quit|started|switched|left|sold|dropped)\b/i.test(c.t) ? '. Here’s what happened:' : '. Here’s why:'), mv: [...c.mv, 'loop'], loop: true, gen: true }); });
    /* 4. finish each one in the writer's style, then keep only the ones that keep their facts */
    const n0 = numsOf(L).sort().join('|'), k0 = ticksOf(L).sort().join('|'), neg0 = negsOf(kept.replace(/\bnot financial advice\b/gi, '')), e0 = cnt(L, /\p{Extended_Pictographic}/gu), hy0 = cnt(L, HYPE_RX);
    const names0 = (L.match(/(?<=[\p{L}\p{N},%)]\s)[A-Z][a-z]+(?:[A-Z][a-z]+)?\b/gu) || []).filter(w => !/^(I|The|A|An|It|My|We|Our|But|And|So|Here|This|That|Then|Just|Most|Your|You|Stop|Do|Hey|Guys)$/.test(w) && !/^Qk[a-z]q$/.test(w));
    const FILL = /^(actually|basically|literally|honestly|imo|tbh|ngl|kinda|sorta|probably|maybe|perhaps|really|very|just|think|feel|guess|quite|pretty|hey|guys|wanted|share|thoughts|thread|here|thing|reminder|quick|okay|important|essential|crucial|should|need|learned|realized|talk|something|anyone|everyone|hear|announce|excited|expert|controversial|believe|thinking|lately|recently|lot|lots|marks|decided|past|last|noticed|found|figured|recognized|named|selected|wish|earlier|sooner|reminder|landscape|today|competitive)$/;
    /* three-letter stems, so "lose" and "losing" are the same word to this check */
    const cw = z => [...new Set((lcw(z).replace(/\bcannot\b/g, 'can not').match(/[a-z0-9$%]{3,}/g) || []).filter(w => !STOP.has(w) && !FILL.test(w) && !/^(?:couldn|wouldn|shouldn|didn|doesn|wasn|weren|isn|aren|haven|hasn|could|would)$/.test(w)).map(w => w.slice(0, 3)))];
    const c0 = cw(kept);
    /* r86: the guards sharpenLine holds every version to, here too, so a broken or meaning-changing version never competes */
    const facts0 = slFacts(L, softMarks(L)), oneQ = /^[^\s?]+\?/.test(L);
    const seen = new Set(), out = [], T = (y, r) => { if (opts.trace) opts.trace.push(`${r}: ${y}`); };
    for (const c of cands) {
      let y = tidyT(c.t).replace(/\s+([.!?:])/g, '$1').trim(); if (!y) continue;
      if (tailE) y = (tailP || /[?:]$/.test(y) ? y : y.replace(/\.$/, '')) + ' ' + tailE;
      if (nfa && !/:$/.test(y)) y = `${y}${/[.!?…]$|\p{Extended_Pictographic}️?$/u.test(y) ? '' : '.'} ${nfa}`;
      /* an answer starts on its verb: "Most important thing a CEO can do? To hire…" → "…? Hire…" */
      y = y.replace(/(\?\s+)to (?=[a-z]+\b)/i, '$1').replace(/(\?\s+)([a-z])/, (m, a, c) => a + c.toUpperCase());
      if (!more && /:$/.test(y)) y = y.replace(/:$/, '.');
      y = caseFix(y, sty, true); if (sty.low) y = y.replace(/^(\P{L}*)(\p{Lu})(?=\p{Ll})/u, (m, a, b) => /^(I|I['’]\w+)$/.test((y.match(/^\P{L}*([\p{L}’']+)/u) || [])[1] || '') || names0.some(n => y.slice(a.length).startsWith(n)) || /^(X|BTC|ETH|SOL)\b/.test(y.slice(a.length)) ? m : a + b.toLowerCase());
      y = y.replace(/(:\s+)([A-Z])([a-z]+)\b(?! [A-Z][a-z])/g, (m, a, b, r) => properish(b + r, L.replace(/^\S+\s*/, '')) ? m : a + b.toLowerCase() + r);
      y = aposFix(fixArticles(y), sty).replace(/(https?:\/\/\S+?|\b[\w-]+\.(?:com|io|xyz|co|ai|app|dev|so|gg|me|org|net|ly|to)(?:\/\S*?)?|[@#]\w+|\p{Extended_Pictographic}\uFE0F?)\.$/u, '$1');
      const key = lcw(y).replace(/[^a-z0-9$%.?:→]+/g, ' ').trim(); if (seen.has(key)) continue; seen.add(key);
      if (numsOf(y).sort().join('|') !== n0 || ticksOf(y).sort().join('|') !== k0) { T(y, 'facts'); continue; }
      if (negsOf(y) < neg0 && !c.stop) { T(y, 'negation'); continue; }
      if (cnt(y, /\p{Extended_Pictographic}/gu) > e0 || cnt(y, HYPE_RX) > hy0 || cnt(y, TELL_RX) > 0 || /\[[^\]]+\]/.test(y)) { T(y, 'emoji/hype'); continue; }
      if (names0.some(w => !y.includes(w))) { T(y, 'name'); continue; }
      if (/:\s(?=(?:\S+\s){0,9}\S+[.?!]?$)[^.?!:]*\s(?:and|but)\s/.test(y) && !/:\s[^.?!:]*\s(?:and|but)\s/.test(L)) { T(y, 'colon-and'); continue; }
      const c1 = new Set(cw(y)); if (c0.length >= 2 && c0.filter(w => c1.has(w)).length / c0.length < .7) { T(y, 'offTopic'); continue; }
      if (y.length > L.length * 1.5 + 26 || y.length > Math.max(150, L.length)) { T(y, 'length'); continue; }
      const g0 = gram(L), g1 = gram(y); if (g1.some((v, i) => v > g0[i] && i !== 1)) { T(y, 'gram' + g1.findIndex((v, i) => v > g0[i] && i !== 1)); continue; }
      if (!slOK(y, L, facts0)) { T(y, 'guard'); continue; }
      if ((said.has('warm') || c.mv.includes('warm')) && wordsN(y) <= 4 && !/\d|\$[a-z]/i.test(y) && !/\b(?:is|are|was|were|be|been|am|has|have|had|do|does|did|can|will|would|should|could|might|must|\w{2,}(?:ed|ing|es|s)|\w+n['’]t|\w+['’](?:s|re|ve|ll|m|d))\b/i.test(y.replace(/\b(?:today|tonight|tomorrow|thing|nothing|something|morning|evening)\b/gi, ''))) { T(y, 'fragment'); continue; }
      /* a one-word question made from a fragment ("Hiring? That's the job.") isn't a sharper line */
      if (!oneQ && /^[^\s?]+\?/.test(y) && !/^(?:why|how|what|who|when|where|really|seriously|wild)\?/i.test(y)) { T(y, 'oneQ'); continue; }
      const moves = [...new Set([...(c.mv.length || y !== base ? baseSaid : baseSaid), ...c.mv])];
      out.push({ text: y, score: scoreOf(y), moves, own: c.mv, edits: editW(L, y), gen: !!c.gen });
    }
    /* 5. the best one: highest score; a close call goes to the smaller edit, so it still sounds like them */
    /* a full stop alone isn't a sharpen: a version that only adds one ranks a little lower than a real move */
    /* a version that still opens on an announcement ("I wanted to talk about…", "some thoughts on…") hasn't cut its warm-up */
    /* r74: a version that starts on a stray "that", a vocative or a reason ("Because…") reads broken, whatever it scores; "2022: …" is a fair move but a template, so a natural one wins a tie.
       A number that moved from deep in the line to its first few words is the move top posts make most, so it gets the nod in a close call */
    const figAt = z => { const m = String(z).match(/(?<![\w.,])\$?\d/); return m ? (z.slice(0, m.index).match(/\S+/g) || []).length : -1; }, fig0 = figAt(kept);
    const rank = o => o.score + (fig0 >= 6 && figAt(o.text) >= 0 && figAt(o.text) <= 3 ? 3 : 0) - (o.moves.every(k => k === 'end') ? 3 : 0) - (/^(?:(?:i|we) )?(?:wanted|want|would like|['’]d like|am going|['’]m going) to (?:talk|share|write|post)|^(?:some|a few) thoughts on/i.test(o.text) ? 4 : 0) + ((o.own || []).some(k => ['ask', 'number', 'result', 'active', 'payoff', 'moment', 'contrast', 'loop', 'straight', 'warm', 'lead', 'ticker'].includes(k)) ? 2 : 0) - (/^(?:that|everyone|because|since|and|but)\b/i.test(o.text) ? 8 : 0) - (!more && /^(?:why|how)\b[^?.!:]*[.:]$/i.test(o.text) ? 6 : 0) /* a "Why X." title with nothing after it promises a reason the post never gives */ - (/^(?:19|20)\d\d:/.test(o.text) ? 2 : 0) + (opts.pref ? o.moves.reduce((a, k) => a + (opts.pref[k] || 0), 0) : 0); /* the moves this voice keeps, a nudge */
    out.sort((a, b) => (rank(b) - rank(a)) || (a.edits - b.edits));
    /* the line itself first; a reason to read on is the finishing touch, added only to a line that still needs a push */
    const own = out.filter(o => !o.gen), top0 = own.filter(o => rank(o) >= rank(own[0]) - 1).sort((a, b) => a.edits - b.edits)[0] || null;
    const looped = top0 && top0.score < 70 && out.find(o => o.gen && o.text.replace(/\s*Here’s (?:why|what happened):$/i, '').replace(/[.!]$/, '') === top0.text.replace(/[.!]$/, ''));
    const top = looped && looped.score > top0.score ? looped : top0;
    const best = top && top.score > s0 ? top : null;
    const alts = best ? out.filter(o => o !== best && !o.gen && o.score > s0 && !nearSame(o.text, best.text)).slice(0, 4) : [];
    const say = o => { const m = o.moves.filter(k => k !== 'end' || o.moves.length === 1); const words = m.map(k => k === 'soft' ? HK_SAY.soft(soft) : HK_SAY[k]).filter(Boolean); if (soft && !m.includes('soft')) words.unshift(HK_SAY.soft(soft)); return [...new Set(words)].slice(0, 3).map(capFirst).join(' · '); };
    /* the move it's about, and why that move works: the line the app teaches with */
    const mainOf = o => HK_PRI.find(k => o.moves.includes(k)) || (soft ? 'soft' : '');
    const pack = o => o && { text: o.text + rest, line: o.text, score: o.score, moves: o.moves, say: say(o), main: mainOf(o), why: HK_WHY[mainOf(o)] || '', cut: cutW.slice() };
    return { from: s0, base: { line: base, score: scoreOf(base) }, soft, cut: cutW, best: pack(best), alts: alts.map(pack), all: out.length };
  }
  /* ---------------- sharpenLine (r86): the one call the site and the app both make ----------------
     The first line in; the sharpened first line out, with what a UI needs to show it honestly: the words that are really
     gone (never a moved word, never a fact) with their kind and reason, the facts carried over, and a receipt and a reason
     that are both true for this edit. Offline and deterministic.
     state: empty · thin (gibberish, or under 3 real words; tickers, numbers, $ and % are words) · sharp (line ≠ draft) ·
     clean (nothing flagged, no safe move helps) · unsure (soft words flagged, but cutting them would change the meaning or
     not help: the line stays, the flags are suggestions) */
  const SL_ROWS = /qwer|wert|erty|rtyu|tyui|yuio|uiop|asdf|sdfg|dfgh|fghj|ghjk|hjkl|zxcv|xcvb|cvbn|vbnm/;
  const SL_CT = /^(?:btc|eth|sol|eoy|eow|eod|ath|atl|gm|gn|nfa|dca|pnl|mrr|arr|cpi|fomc|etf|tvl|ui|ux|ceo|cto|vc|ai|seo|b2b|saas|nfts?|l1|l2|rn|irl|dms?|pfp|ama|rsi|ema|sma|tl;?dr)$/;
  /* one word reads as a word: a number, a $ticker, an acronym, CT shorthand, or letters with a vowel that aren't a keyboard row */
  const slReal = w => {
    if (/[^\x00-\x7F]/.test(w) && /\p{L}/u.test(w) && !/^[\x00-\x7F]*$/.test(w.replace(/[^\p{L}]/gu, ''))) return true;
    const raw = String(w).replace(/[^A-Za-z0-9$%]/g, ''), x = raw.toLowerCase(); if (!x) return false;
    if (/\d/.test(x) || /^\$[a-z][a-z0-9]{1,9}$/.test(x) || (/^[A-Z]{2,6}$/.test(raw) && !SL_ROWS.test(x)) || SL_CT.test(x)) return true;
    return /[aeiouy]/.test(x) && !/[bcdfghjklmnpqrstvwxz]{5,}/.test(x) && !/(.)\1\1/.test(x) && !SL_ROWS.test(x);
  };
  function slThin(t) {
    const s = String(t || '').replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]{2}/gu, m => ` ${m} `);
    const ws = s.match(/[\p{L}\p{N}$%][\p{L}\p{N}$%'’.-]*/gu) || [], rw = ws.filter(slReal);
    return new Set(rw.map(w => w.toLowerCase().replace(/[.’'-]+$/, ''))).size < 3 || rw.length < ws.length * .5;
  }
  /* the facts in a line, as written: @handles, #tags, $tickers, anything with a digit, CT tickers, acronyms and names.
     Words inside a soft-word mark ("PSA", "NFA") are the fluff, not a fact */
  const SL_TICKW = /^(?:btc|eth|sol|xrp|bnb|doge|avax|matic|pepe|shib|wif|arb|sui|tia|ltc|spx|qqq|nvda|tsla|aapl|usdc|usdt)$/i;
  const SL_NOTNAME = /^(?:I|The|A|An|It|My|We|Our|But|And|So|Here|This|That|Then|Just|Most|Your|You|Stop|Do|Hey|Guys|Why|How|What|When|If|In|On|At|For|To|Of|Or|No|Not|Yes|OK|Ok|Also|Even|Every|All|Some|One|Two|Three|Day|Today|Now|New|Next|Last|Same|Thanks?|Thank|Huge|Big|Love|Still|Only|Is|Are|Was|Were|Be|Will|Can|Don['’]t|I['’]m|I['’]ve|I['’]d|I['’]ll|Up|Down|Please|Never|Always|More|Less|Let|Let['’]s)$/;
  function slFacts(t, marks) {
    const s = String(t || ''), out = [], inMark = (a, b) => (marks || []).some(m => a >= m[0] && b <= m[1]);
    const add = (v, a) => { v = v.replace(/[.,:;/!?'’-]+$/, ''); if (v && !/^qk[a-z]q$/i.test(v) && !inMark(a, a + v.length) && !out.some(o => o.v === v)) out.push({ v, a }); };
    for (const m of s.matchAll(/(?<![\p{L}\p{N}_])[@#][\p{L}\p{N}_]+/gu)) add(m[0], m.index);
    for (const m of s.matchAll(/(?<![\p{L}\p{N}_$])\$[A-Za-z][A-Za-z0-9]{0,9}\b/g)) add(m[0], m.index);
    for (const m of s.matchAll(/(?<![\p{L}\p{N}_$€£@#.,])[\p{L}$€£]*\d[\p{L}\p{N}$€£%,.:/+×x-]*/gu)) add(m[0], m.index);
    for (const m of s.matchAll(/(?<![\p{L}\p{N}_$@#'’])[\p{L}][\p{L}\p{N}'’&-]*/gu)) {
      const w = m[0].replace(/['’]s$/, ''), mid = /[\p{L}\p{N},%)'’]\s$/u.test(s.slice(Math.max(0, m.index - 2), m.index));
      if (SL_TICKW.test(w) || (/^[A-Z][A-Z0-9&]{1,5}$/.test(w) && !/^(?:I|OK|LOL|LMAO|PSA|TIL|NFA|IMO|IMHO|TBH|NGL|GM|GN|LFG|FYI|BTW)$/.test(w)) || /^\p{Ll}*\p{Lu}\p{Ll}+\p{Lu}/u.test(w) || /^\p{Ll}+\p{Lu}/u.test(w) || (mid && (/^\p{Lu}\p{Ll}+$/u.test(w) && !SL_NOTNAME.test(w) || w === 'X'))) add(w, m.index);
    }
    return out.sort((a, b) => a.a - b.a);
  }
  const slHas = (line, v) => new RegExp(`(?<![\\p{L}\\p{N}_])${v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}_])`, 'u').test(line);
  /* what a cut may never take: the words that carry the meaning. In the draft → still in the line */
  const SL_MEAN = [/\bnot just\b/i, /\bonly just\b/i, /\bjust (?:can['’]?t|cannot|won['’]?t|don['’]?t|didn['’]?t|couldn['’]?t)\b/i, /\bis it just me\b/i, /\b(?:maybe|perhaps|probably) (?:i|i['’]m|i am|we|we['’]re|you|you['’]re|it|it['’]s|not|they|he|she)\b/i,
    /\b(?:kind|sort) of a (?:big deal|thing|mess|legend|genius|joke|vibe)\b/i, /\b(really|very|so),? \1\b/i, /\b(?:what|who|which|that) actually\b/i, /\bactually (?:liked?|loved?|prefer(?:red)?|matters?|works?|worked|happened)\b/i, /\byou(?:['’]re| are) actually\b/i, /\bpretty much it\b/i, /^just \w+ it\b/i];
  const slNegs = t => { const s = String(t), m = softMarks(s); let o = '', at = 0; m.forEach(r => { o += s.slice(at, r[0]) + ' '; at = r[1]; }); return negsOf(o + s.slice(at)); };
  const slMeanOK = (line, draft) => SL_MEAN.every(re => !re.test(draft) || re.test(line)) && negsOf(line) >= slNegs(draft);
  /* a template that came out broken: counted in the line against the draft, so the writer's own style never trips it */
  const SL_BROKEN = [/([,;:!?])\1|(?<!\.)\.\.(?!\.)|[,;:][.!?]|[.!?][,;:]/g, /::/g, /\bwhy do (?:\S+ ){1,4}(?:fails|works|sells|gets|makes|goes|does|needs|wants|breaks|dies|loses|misses|stalls|churns|struggles|stops|sucks|looks|feels|sounds|reads|ends|burns|posts|writes|hires|ships|is|has|was)\b/gi,
    /\b(?:will|would|should|could|can|to|we|i|you|how|why|what|did|does|do|gonna)\s*:\s/gi, /\bwill\s+\$?\d/gi, /\b(?:and|but|or|because|the|a|an|my|our|your|their)\s*[.!?:](?=\s|$)/gi, /\?\s*\?/g];
  const slCapsNew = (line, draft) => (line.match(/(?<=[\p{L}\p{N},;%)'’]\s)\p{Lu}[\p{L}’']*/gu) || []).filter(w => !/^I(?:['’]\w+)?$/.test(w) && !new RegExp(`(?<![\\p{L}])${w.replace(/[’']/g, '[’\']')}(?![\\p{L}])`, 'u').test(draft)).length;
  const slBroken = (line, draft) => SL_BROKEN.some(re => cnt(line, re) > cnt(draft, re)) || slCapsNew(line, draft) > 0;
  /* the whole check a sharpened line passes: every fact verbatim, the meaning words kept, no broken template */
  const slOK = (line, draft, facts) => facts.every(f => slHas(line, f.v)) && slMeanOK(line, draft) && !slBroken(line, draft);
  /* words, for the diff: contractions opened ("can't" = "can not") so a contraction is never a cut */
  const SL_EXP = [[/\bcan['’]t\b|\bcannot\b/gi, 'can not'], [/\bwon['’]t\b/gi, 'will not'], [/\b(\w+)n['’]t\b/gi, '$1 not'], [/\bi['’]m\b/gi, 'i am'], [/\b(\w+)['’]re\b/gi, '$1 are'], [/\b(\w+)['’]ve\b/gi, '$1 have'], [/\b(\w+)['’]ll\b/gi, '$1 will'], [/\b(i|you|we|they|he|she)['’]d\b/gi, '$1 would'], [/\blet['’]s\b/gi, 'let us'], [/\b(it|that|here|there|what|who|he|she|this|where|how|everyone|nobody|everything|nothing)['’]s\b/gi, '$1 is'], [/\bim\b/g, 'i am']];
  function slToks(s) {
    const out = [];
    for (const m of String(s).matchAll(/\S+/g)) {
      const w0 = m[0].replace(/^[^\p{L}\p{N}$%@#]+|[^\p{L}\p{N}%]+$/gu, ''); if (!w0) continue; const a = m.index + m[0].indexOf(w0);
      SL_EXP.reduce((x, [re, r]) => x.replace(re, r), lcw(w0)).split(/\s+/).filter(Boolean).forEach(w => out.push({ w: w.replace(/,(?=\d)/g, ''), a, b: a + w0.length }));
    }
    return out;
  }
  /* the soft words the visible marks don't cover but the engine still cuts (a "yo" opener, "fairly", a bait tail), as marks */
  function slExtra(t) {
    const s = String(t), out = [], add = (a, b, k) => { while (b > a && /[\s,.:;!?—-]/.test(s[b - 1])) b--; while (a < b && /[\s,.:;—-]/.test(s[a])) a++; if (b > a) out.push([a, b, '', k]); };
    const o = s.match(HK_OPEN); if (o) add(0, o[0].length, (softWhy(o[0].replace(/[\s,.:!—-]+$/, '')) || { k: 'open' }).k);
    HEDGE_RX.forEach(re => { for (const m of s.matchAll(rx(re.source, gFlags(re.flags)))) if (m[0].trim()) { const p = m[0].trim().replace(/[,\s]+$/, ''), w = softWhy(p); add(m.index, m.index + m[0].length, w ? w.k : /^(?:really|very|quite|somewhat|fairly|truly|pretty)/i.test(p) ? 'intens' : /^i\b/i.test(p) ? 'opinion' : /honest|lie/i.test(p) ? 'honest' : 'hedge'); } });
    const tl = s.match(TAIL_RX); if (tl) add(tl.index, tl.index + tl[0].length, /lol|lmao/i.test(tl[0]) ? 'tail' : /imo|imho/i.test(tl[0]) ? 'opinion' : /tbh|ngl/i.test(tl[0]) ? 'honest' : 'filler');
    const bt = s.match(HK_BAIT); if (bt && bt[0].trim()) add(bt.index, bt.index + bt[0].length, 'bait');
    SL_WARMX.forEach(([re, k]) => { const m = s.match(re); if (m) add(m.index, m.index + m[0].length, k); });
    return out;
  }
  const SL_WARMX = [[/^(?:i['’]?d|i would|we['’]?d|we would|i (?:just )?want(?:ed)?|we (?:just )?want(?:ed)?) (?:like )?to (?:take a (?:moment|second|minute) to )?(?:say (?:a (?:big |huge )?)?)?/i, 'throat'], [/^(?:a lot of|so many|lots of) (?:you|people|folks)(?: have been| keep| have)? ask(?:ing|ed)?(?: me)? (?:about|for)\b/i, 'throat'], [/,? so here (?:it is|you go|it goes)(?=[.!]?$)/i, 'throat'],
    [/^(?:this week['’]s|today['’]s|this|the latest|our latest|my latest|new) (?:issue|edition|newsletter|episode|video|essay|post|podcast) (?:is (?:all )?about|covers|is on|breaks down|dives into)\b/i, 'label'], [/^(?:here(?: is|['’]s) )?a (?:quick |short |mini )?thread (?:on|about)\b/i, 'label']];
  /* the never-say and wordy phrases swapped for plain ones, with what each became */
  function slSwaps(t) {
    const s = String(t), out = [];
    /* read each replacement in place, so a rule with a lookahead ("leverage (?=your)") still knows what it became */
    [...HK_SWAP, ...WORDY].forEach(([re, w]) => { s.replace(rx(re.source, gFlags(re.flags)), (...g) => { const gr = typeof g[g.length - 1] === 'object', off = g[g.length - (gr ? 3 : 2)], to = typeof w === 'function' ? w(...g) : w.replace(/\$(\d)/g, (_, i) => g[+i] || ''); out.push([off, off + g[0].length, String(to).trim(), 'swap']); return g[0]; }); });
    return out;
  }
  const SL_KWHY = { announce: 'Announces the news instead of saying it.', label: 'A label, not the point.', disclaim: 'Tells people to trust what follows less.', stock: 'A stock phrase readers skip.', throat: 'Backstory before the point.', open: 'A warm-up word.', feel: 'Tells them how to feel about it.',
    opinion: 'Hedges a claim that’s already yours.', honest: 'Hints the rest might not be honest.', intens: 'Props up the word next to it.', filler: 'Filler from talking out loud.', hedge: 'Hedges the claim.', likeNum: 'Blurs your own number.', tail: 'Takes the weight off the line.', bait: 'Bait readers have learned to scroll past.', move: 'Not needed once the line was reordered.', tight: 'Not needed for the point.' };
  const SL_WARM = /^(?:announce|label|disclaim|stock|throat|open|feel)$/, SL_HEDGE = /^(?:opinion|hedge)$/, SL_FILL = /^(?:filler|intens|honest|tail|likeNum)$/;
  const SL_STRUCT = ['result', 'active', 'payoff', 'ask', 'number', 'ticker', 'lead', 'moment', 'contrast', 'straight', 'loop', 'order'];
  /* the words really gone from the draft, in draft order, grouped and named by kind.
     1. a never-say or wordy phrase that became its plain word is one swap; 2. words that kept their order line up (LCS);
     3. a word that moved is found anywhere; 4. a word said in another form ("fails" → "fail") is reworded, not cut. The rest went */
  const slStem = w => w.replace(/(?:ies|es|s|ed|ing)$/, '').slice(0, 5);
  function slCut(draft, line, marks, structural) {
    const D = slToks(draft), O = slToks(line), extra = slExtra(draft), within = (x, R) => R.find(r => x.a >= r[0] && x.b <= r[1]) || null;
    const gone = D.map(() => false), done = D.map(() => false), oUsed = O.map(() => false), swapOf = D.map(() => null), ow = O.map(x => x.w).join(' ');
    const bag = new Map(); O.forEach(x => bag.set(x.w, (bag.get(x.w) || 0) + 1));
    /* 1. a never-say or wordy phrase that became its plain word is one swap; one that only lost words cuts those words */
    slSwaps(draft).forEach(sw => {
      const idx = D.map((x, i) => i).filter(i => !done[i] && D[i].a >= sw[0] && D[i].b <= sw[1]); if (!idx.length) return;
      const srcW = idx.map(i => D[i].w), src = srcW.join(' '), to = slToks(sw[2]).map(x => x.w);
      if (ow.includes(src) || (to.length && !ow.includes(to.join(' ')))) return;
      let k0 = 0; const sub0 = to.every(w => { const k = srcW.indexOf(w, k0); if (k < 0) return false; k0 = k + 1; return true; });
      if (sub0) { let k1 = 0; idx.forEach(i => { const k = to.indexOf(D[i].w, k1); if (k >= 0 && k1 <= k) { k1 = k + 1; return; } swapOf[i] = { sw, kind: /^(?:way|single|so|really|very)$/.test(D[i].w) ? 'intens' : 'tight' }; gone[i] = done[i] = true; }); return; }
      to.forEach(w => { const j = O.findIndex((x, k) => !oUsed[k] && x.w === w); if (j >= 0) oUsed[j] = true; });
      idx.forEach(i => { swapOf[i] = { sw, kind: 'swap' }; gone[i] = done[i] = true; });
    });
    /* 2. a soft-word mark goes as one piece: still there in order → kept; most of its words gone from the line → cut whole */
    D.forEach(x => { x.m = within(x, marks) || within(x, extra); });
    [...marks, ...extra].forEach(mk => {
      const idx = D.map((x, i) => i).filter(i => !done[i] && D[i].m === mk); if (!idx.length) return;
      const src = idx.map(i => D[i].w).join(' '); if (ow.includes(src)) return;
      if (mk[3] === 'disclaim') { const core = idx.filter(i => !/^(?:but|and|so)$/.test(D[i].w)); if (core.length && ow.endsWith(core.map(i => D[i].w).join(' '))) { idx.forEach(i => { if (!core.includes(i)) { gone[i] = done[i] = true; D[i].m = null; } else D[i].m = null; }); return; } }
      const have = idx.filter(i => (bag.get(D[i].w) || 0) > 0).length;
      if (have * 2 <= idx.length) idx.forEach(i => { gone[i] = done[i] = true; }); else idx.forEach(i => { D[i].m = null; });
    });
    /* 3. words that kept their order line up; 4. a word that moved is found anywhere; 5. one said in another form ("fails" → "fail") */
    const live = D.map((x, i) => done[i] ? -1 : i).filter(i => i >= 0), oi = O.map((x, j) => j).filter(j => !oUsed[j]);
    const n = live.length, m = oi.length, Lc = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) Lc[i][j] = D[live[i]].w === O[oi[j]].w ? Lc[i + 1][j + 1] + 1 : Math.max(Lc[i + 1][j], Lc[i][j + 1]);
    const ok = D.map(() => false);
    for (let i = 0, j = 0; i < n && j < m;) { if (D[live[i]].w === O[oi[j]].w) { ok[live[i]] = true; oUsed[oi[j]] = true; i++; j++; } else if (Lc[i + 1][j] >= Lc[i][j + 1]) i++; else j++; }
    const claim = (i, eq) => { const j = O.findIndex((x, k) => !oUsed[k] && eq(x.w, D[i].w)); if (j >= 0) { oUsed[j] = true; ok[i] = true; } };
    [false, true].forEach(fl => live.forEach(i => { if (!ok[i] && !!D[i].m === fl) claim(i, (a, b) => a === b); }));
    live.forEach(i => { if (!ok[i] && D[i].w.length > 3) claim(i, (a, b) => a.length > 3 && slStem(a) === slStem(b)); });
    live.forEach(i => { if (!ok[i]) gone[i] = true; });
    const out = [];
    D.forEach((x, i) => {
      if (!gone[i]) return;
      const so = swapOf[i], sw = so && so.sw, mk = sw ? null : x.m, kind = so ? (so.kind === 'swap' && !sw[2] ? 'intens' : so.kind) : mk ? mk[3] : structural ? 'move' : 'tight', id = sw || mk || null;
      const q = out[out.length - 1];
      if (q && q.kind === kind && q.id === id && q.last === i - 1 && (id || /^[\s,;:—-]*$/.test(draft.slice(q.b, x.a)))) { q.b = x.b; q.last = i; return; }
      out.push({ a: x.a, b: x.b, kind, id, last: i, to: sw && so.kind === 'swap' ? sw[2] : '' });
    });
    return out.map(c => ({ text: draft.slice(c.a, c.b), kind: c.kind, why: c.kind === 'swap' ? `Said as “${c.to}”.` : SL_KWHY[c.kind] || SL_KWHY.tight, at: [c.a, c.b] }));
  }
  const HK_WHY_SL = {
    q: 'Same question in fewer words, so it reads in one glance.',
    filler: 'Filler from talking out loud. In the feed it costs a second and adds nothing.',
    swap: 'Same claim in plainer words, so nothing snags the reader.',
    sharp: 'Already sharp. Nothing soft to cut.',
    clean: 'Nothing soft to cut, and no safe move makes it stronger.'
  };
  const slFig = z => { const m = String(z).match(/(?<![\w.,])[$€£]?\d|\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|fifty|hundred|a (?:year|month|week|day|decade))\b/i); return m ? (z.slice(0, m.index).match(/\S+/g) || []).length : -1; };
  const slBeats = z => (String(z).match(/[^.!?]+(?:[.!?]+|$)/g) || []).filter(x => /[\p{L}\p{N}]/u.test(x)).length;
  /* the move a version is about, checked against what it really did: "led with the number" only when the number leads */
  function slMove(draft, line, moves, cut) {
    const warm = cut.some(c => SL_WARM.test(c.kind)) || (moves || []).includes('warm') && wordsN(line) < wordsN(draft);
    for (const k of HK_PRI) {
      if (!(moves || []).includes(k) || !SL_STRUCT.includes(k)) continue;
      if (k === 'number' && !(slFig(line) >= 0 && slFig(line) <= 2 && (slFig(draft) < 0 || slFig(line) < slFig(draft)))) continue;
      if (k === 'contrast' && !(slBeats(line) > slBeats(draft))) continue;
      if (k === 'ask' && !(/\?\s+\S/.test(line) && !/\?\s+\S/.test(draft))) continue;
      if (k === 'loop' && !/(?::|\bhere[’']s (?:why|how|what)[^.!?]*[:.]?)$/i.test(line)) continue;
      return k;
    }
    if (warm) return 'warm';
    if ((moves || []).includes('tight') && wordsN(line) < wordsN(draft) && !cut.some(c => SL_HEDGE.test(c.kind) || SL_FILL.test(c.kind))) return 'tight';
    return '';
  }
  function slExplain(draft, line, moves, marks) {
    const cut0 = slCut(draft, line, marks, (moves || []).some(k => k !== 'end' && k !== 'soft'));
    const move = slMove(draft, line, moves, cut0);
    const cut = cut0;
    const nW = cut.filter(c => SL_WARM.test(c.kind)).length, nH = cut.filter(c => SL_HEDGE.test(c.kind)).length, nF = cut.filter(c => SL_FILL.test(c.kind)).length, nB = cut.filter(c => c.kind === 'bait').length, nS = cut.filter(c => c.kind === 'swap').length;
    const say = [], moved = /^(?:(?:this is )?not financial advice|nfa)\b/i.test(draft.replace(/^(?:gm|gn)\b[.!,]*\s*/i, '')) && /\b(?:nfa|not financial advice)$/i.test(line.trim()), warmT = nW > 0 || (move === 'warm' && !moved);
    if (warmT) say.push('Cut the warm-up');
    if (nH && nF) say.push(`Cut ${nH + nF} soft words`); else if (nH) say.push(`Cut ${nH} hedge${nH === 1 ? '' : 's'}`); else if (nF) say.push(`Cut ${nF} filler word${nF === 1 ? '' : 's'}`);
    if (nB) say.push('Dropped the bait');
    if (moved) say.push('Moved the disclaimer to the end');
    if (move && move !== 'warm') say.push(cap(HK_SAY[move]));
    if (!say.length) say.push(nS ? 'Said it plainer' : 'Tightened it');
    let why;
    if (move && move !== 'warm' && move !== 'tight') why = HK_WHY[move];
    else if (moved && !nW) why = 'A disclaimer up front tells people to trust the next words less. At the end it still covers you.';
    else if (warmT) why = HK_WHY.warm;
    else if (/\?\s*$/.test(line)) why = HK_WHY_SL.q;
    else if (nH) why = HK_WHY.soft;
    else if (nF) why = HK_WHY_SL.filler;
    else if (nB) why = HK_WHY.bait;
    else if (nS) why = HK_WHY_SL.swap;
    else why = HK_WHY.tight;
    return { cut, move, say: [...new Set(say)].slice(0, 3).join(' · '), why };
  }
  const SL_LONG = 'Over 280 for one X post. Hookworthy can split it into a thread.';
  function sharpenLine(text, opts = {}) {
    const keep = (opts.keep || []).filter(w => typeof w === 'string' && w.trim());
    const src = String(text == null ? '' : text).replace(/^\s+/, ''), nl = src.indexOf('\n');
    const draft = (nl < 0 ? src : src.slice(0, nl)).replace(/\s+$/, ''), rest = nl < 0 ? '' : src.slice(nl + 1);
    const more = opts.more != null ? !!opts.more : !!rest.trim();
    const R = { state: 'empty', draft, line: draft, rest, cut: [], marks: [], move: '', say: '', why: '', kept: [], alts: [], long: false, note: '' };
    const longOf = l => xLength(rest.trim() ? `${l}\n${rest}` : l) > 280;
    if (!draft) return R;
    R.long = longOf(draft); R.note = R.long ? SL_LONG : '';
    const vm = draft.match(HK_VOICE), body = vm ? draft.slice(vm[0].length) : draft;
    if (!body.trim() || slThin(body)) return { ...R, state: 'thin' };
    const marks = softMarks(draft, keep), facts = slFacts(draft, marks);
    R.marks = marks; R.kept = facts.map(f => f.v);
    const st = stanceKeep(body).filter(w => !keep.some(k => k.toLowerCase() === w.toLowerCase()));
    /* the stance note only while the stance is really still in the line */
    const stNote = l => { const k = st.find(w => lcw(l).includes(lcw(w))); return k ? `Kept your “${k}”: on a call, it’s your stance, not filler.` : ''; };
    let H = null; try { H = hookUp(rest ? `${draft}\n${rest}` : draft, { keep, more, pref: opts.pref }); } catch (e) { H = null; }
    const list = H && H.best ? [H.best, ...(H.alts || [])] : [];
    /* a full stop or a capital alone isn't a sharpen */
    const same = (a, b) => slToks(a).map(x => x.w).join(' ') === slToks(b).map(x => x.w).join(' ');
    const okL = o => o && o.line && !same(o.line, draft) && slOK(o.line, draft, facts);
    const best = list.find(okL) || null;
    const noteOf = l => [stNote(l), longOf(l) ? SL_LONG : ''].filter(Boolean).join(' ');
    if (!best) {
      const why = marks.length ? `Kept as written: cutting “${draft.slice(marks[0][0], marks[0][1])}” here would change how it lands or not help.` : hookScore(rest ? `${draft}\n${rest}` : draft).score >= 70 ? HK_WHY_SL.sharp : HK_WHY_SL.clean;
      return { ...R, state: marks.length ? 'unsure' : 'clean', say: marks.length ? 'Kept as written' : 'Nothing to cut', why: why.length > 140 ? `Kept as written: cutting it here would change how it lands or not help.` : why, note: noteOf(draft) };
    }
    const E = slExplain(draft, best.line, best.moves, marks);
    const alts = [], used = new Set([E.move || 'soft']);
    for (const o of list) {
      if (alts.length >= 2) break; if (o === best || !okL(o) || nearSame(o.line, best.line)) continue;
      const e = slExplain(draft, o.line, o.moves, marks), k = e.move || 'soft'; if (used.has(k)) continue; used.add(k);
      alts.push({ line: o.line, say: e.say, why: e.why, move: e.move, moves: o.moves, cut: e.cut });
    }
    return { ...R, state: 'sharp', line: best.line, cut: E.cut, move: E.move, say: E.say, why: E.why, alts, long: longOf(best.line), note: noteOf(best.line), moves: best.moves, score: { from: H.from, to: best.score } };
  }
  const SHARPEN = { OPTS: SH_OPTS, LABEL: SH_LABEL, sharpen, fromModel, frame, fit, judge, styleOf, versionsFor, pickVersions, modelTexts, stripModel, deEcho, checkPost: checkPost2, whyNot, nearSame, tidy: tidyT, cutHedges, MOVES, sub, WORDY, CONTRACT_W, PLAIN_W, JARGON_W, SHORTHAND, IDIOM, numsOf, ticksOf, hookUp, SOFT, softMarks, softCut, MOVE_WHY: HK_WHY, MOVE_SAY: HK_SAY, sharpenLine, stanceKeep, factsOf: s => slFacts(s, softMarks(s)).map(f => f.v) };

  /* ---------------- Claude credits ----------------
     One table for the app, the server and the tests. A credit is one everyday piece of Claude writing (a post rewrite).
     Bigger jobs cost more, and the button says how much before you click. Basic mode runs on your device and never uses
     a credit, and neither do Sharpen and the small automatic helpers. Every plan refills monthly, on the day you joined.
     Unused paid usage from the first month rolls over once, up to one extra month's worth. */
  const CR_DAY = 864e5;
  const CR_PLANS = {
    /* r65: Free gets a monthly taste of Claude (Sharpen stays free and unlimited); Pro 250 a month, more as a monthly add-on;
       Studio 500 per client voice, shared */
    free: { name: 'Free', amount: 20, per: 'month', roll: 0 },
    trial: { name: 'Pro trial', amount: 100, per: 'trial', roll: 0, days: 7 },
    pro: { name: 'Pro', amount: 250, per: 'month', roll: 250 },
    studio: { name: 'Studio', amount: 500, per: 'month', roll: 500, pooled: true, perVoice: true }
  };
  /* r66: monthly add-ons on a paid plan: more Claude rewrites every month, on top of what the plan includes */
  const CR_BOOSTS = [
    { k: 'b250', add: 250, price: 8 },
    { k: 'b750', add: 750, price: 22 },
    { k: 'b1750', add: 1750, price: 45 }
  ];
  const crBoost = k => CR_BOOSTS.find(b => b.k === k) || null;
  const CR_ACTS = {
    rewrite: { c: 1, label: 'Rewrite', does: 'Three versions in your voice that keep every number and name', long: true },
    instruct: { c: 1, label: 'Rewrite with a note', does: 'Your note, done in your voice, with every fact kept', long: true },
    hooks: { c: 1, label: 'Three stronger first lines', does: 'Three first lines in your voice, same facts' },
    room: { c: 2, label: 'Hook tournament', does: 'Six agents in the Room each pitch a first line, and the best one wins' },
    ideas: { c: 1, label: 'Post ideas', does: 'Fresh first lines from your notes and your best posts' },
    why: { c: 1, label: 'Why it did what it did', does: 'Why this post popped or flopped, against your own median' },
    digest: { c: 1, label: 'Your weekly note', does: 'What worked this week and what to try next' },
    compare: { c: 1, label: 'Compare two lines', does: 'Which first line your people are likelier to stop for, and why' },
    replies: { c: 1, label: 'Draft replies', does: 'Replies in your voice, up to ten at a time' },
    brief: { c: 1, label: 'Read a brief', does: 'The facts, the quotes worth keeping and three angles' },
    briefWrite: { c: 2, label: 'Write from a brief', does: 'A post or thread in your voice, facts checked against the brief' },
    picture: { c: 1, label: 'Write from a picture', does: 'Reads the chart or screenshot and drafts the post around it' },
    people: { c: 2, label: 'Patterns from accounts you learn from', does: 'What their best posts have in common, as formulas you can use' },
    week: { c: 3, label: 'Plan my week', does: 'Five posts for your next open times, from your ideas and best posts' },
    voice: { c: 5, label: 'Learn my voice', does: 'Reads up to 120 of your posts once, so every rewrite sounds like you' },
    sharpen: { c: 0, label: 'Sharpen', assist: true },
    visual: { c: 0, label: 'Pick a visual', assist: true },
    tidy: { c: 0, label: 'Tidy what you said', assist: true },
    setup: { c: 0, label: 'Setting up', assist: true }
  };
  const CR_LONG = 1000;
  /* r66: the small Claude helps (Sharpen, tidying, picking a visual) are free up to this many a day. After that Free waits
     for midnight (on-device Sharpen keeps working), and paid plans pay 1 each from their allowance */
  const CR_HELPERS = 50;
  /* what one call costs: the action's price, +1 for a post over 1,000 characters, +1 per PDF or picture Claude reads.
     The bigger model's tier never costs less than voice study, whatever the caller calls it */
  function crCost(act, { docs = 0, chars = 0, tier } = {}) {
    const a = CR_ACTS[act]; let c = a ? a.c : tier === 'complex' ? 5 : 1;
    if (a && a.long && chars > CR_LONG) c += 1;
    c += clamp(Math.floor(+docs || 0), 0, 3);
    if (tier === 'complex') c = Math.max(c, 5);
    return c;
  }
  function crAddMonths(t, k) { const a = new Date(t), d = a.getDate(); const x = new Date(a.getFullYear(), a.getMonth() + k, 1, a.getHours(), a.getMinutes(), a.getSeconds(), a.getMilliseconds()); x.setDate(Math.min(d, new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate())); return x.getTime(); }
  /* when the next refill lands: the end of the trial, or the next monthly anniversary of joining (every plan, Free included) */
  function crNext(plan, now, anchor = now) {
    const P = CR_PLANS[plan] || CR_PLANS.free;
    if (P.per === 'day') { const d = new Date(now); d.setHours(24, 0, 0, 0); return d.getTime(); }
    if (P.per === 'trial') return anchor + P.days * CR_DAY;
    let k = 1; while (crAddMonths(anchor, k) <= now && k < 2400) k++; return crAddMonths(anchor, k);
  }
  /* Studio's allowance is per client voice; every other plan has one amount */
  const crVoices = v => Math.max(1, Math.floor(+v || 1));
  /* a paid plan's month: what it includes (per client voice on Studio) plus any add-on */
  const crPaid = P => P.per === 'month' && P.roll > 0;
  const crAmt = (P, v, boost) => P.amount * (P.perVoice ? crVoices(v) : 1) + (crPaid(P) && crBoost(boost) ? crBoost(boost).add : 0);
  function crFresh(plan, now = Date.now(), voices = 1, boost = null) { const P = CR_PLANS[plan] || CR_PLANS.free, b = crPaid(P) && crBoost(boost) ? boost : null; return { plan: CR_PLANS[plan] ? plan : 'free', bal: crAmt(P, voices, b), anchor: now, next: crNext(plan, now, now), warned: 0, ...(P.perVoice ? { voices: crVoices(voices) } : {}), ...(b ? { boost: b } : {}) }; }
  /* bring a saved ledger up to now: a new plan starts fresh, a passed refill tops it up */
  function crSettle(st, plan, now = Date.now()) {
    const P = CR_PLANS[plan] || CR_PLANS.free;
    if (!st || typeof st !== 'object' || st.plan !== plan || !(st.next > 0) || typeof st.bal !== 'number' || !isFinite(st.bal)) return crFresh(plan, now, st && st.voices, st && st.boost);
    if (now < st.next || P.per === 'trial') return st;
    const A = crAmt(P, st.voices, st.boost), R = P.roll ? A : 0; /* the first month's leftovers roll over, up to one month's worth */
    if (P.per === 'day') return { ...st, bal: A, next: crNext(plan, now), warned: 0 };
    let bal = Math.max(0, st.bal), next = st.next, n = 0;
    /* round 46: only the first month's leftovers carry over; from the second refill on, each month starts at the plan's amount */
    while (now >= next && n++ < 2400) { const first = next <= crAddMonths(st.anchor, 1); bal = first ? Math.min(A + R, bal + A) : A; next = crNext(plan, next, st.anchor); }
    return { ...st, bal, next, warned: 0 };
  }
  /* what the meter shows. low = about 80% used (the gentle heads-up), plenty = paid and at least a quarter left (no count) */
  function crStatus(st, plan, now = Date.now()) {
    const P = CR_PLANS[plan] || CR_PLANS.free; const s = crSettle(st, plan, now);
    const left = Math.max(0, Math.floor(s.bal)), amount = crAmt(P, s.voices, s.boost);
    return { plan, name: P.name, per: P.per, left, amount, next: s.next, rolled: Math.max(0, left - amount), frac: clamp(left / amount, 0, 1), empty: left <= 0, low: left <= Math.ceil(amount * .2), plenty: plan !== 'free' && left >= amount * .25, ended: P.per === 'trial' && now >= s.next, st: s };
  }
  /* take c credits, or null when there aren't enough (nothing is taken) */
  function crSpend(st, c) { if (!(c > 0)) return st; if (!st || st.bal < c) return null; return { ...st, bal: st.bal - c }; }
  /* switch add-ons mid-month: the difference lands now, and every later month refills at the new amount */
  function crSetBoost(st, plan, boost, now = Date.now()) { const P = CR_PLANS[plan]; if (!P || !crPaid(P)) return st; const s = crSettle(st, plan, now), b = crBoost(boost) ? boost : null, before = crAmt(P, s.voices, s.boost), after = crAmt(P, s.voices, b); const out = { ...s, bal: Math.max(0, s.bal + (after - before)) }; if (b) out.boost = b; else delete out.boost; return out; }
  const CREDITS = { HELPERS: CR_HELPERS, BOOSTS: CR_BOOSTS, setBoost: crSetBoost, PLANS: CR_PLANS, ACTS: CR_ACTS, LONG: CR_LONG, cost: crCost, next: crNext, fresh: crFresh, settle: crSettle, status: crStatus, spend: crSpend };

  return { ROOM, CREDITS, HOOK_TIERS, hookTier, hookMove, hookNext, partState, learnHooks, personalScore, traitsOf, spearman, factCheck, tidySpoken, briefRead, briefDraft, visualPlan, voiceMatch, predictFromHistory, xLength, LINKS, clamp, cap, STOP, words, median, hashStr, hookScore, kindOf, KIND_NAMES, kindName, kindPlural, measured, parseCSV, parseCSVRows, parseXArchive, parseTypefully, parsePasted, normPost, mergeHistory, analyze, eng, BRIEF, voiceBlock, prompts: P, CRINGE, checkPost, SHARPEN, hookUp, sharpenLine, SOFT, softMarks, softCut, memory: { memNew, memPost, memEdit, memChoice, memKeep, memDigest, memPref, memKeepList, MOVE_NAMES } };
});
