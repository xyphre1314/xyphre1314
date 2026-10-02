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
  const URL_RX = /\bhttps?:\/\/\S+|\b(?:[a-z0-9-]+\.)+(?:com|io|xyz|co|ai|app|dev|so|gg|me|org|net|ly|to)(?:\/\S*)?/gi;
  const light = cp => cp <= 4351 || (cp >= 8192 && cp <= 8205) || (cp >= 8208 && cp <= 8223) || (cp >= 8242 && cp <= 8247);
  const seg = typeof Intl !== 'undefined' && Intl.Segmenter ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  function xLength(text) {
    let n = 0; const t = String(text || '').replace(URL_RX, () => { n += 23; return ''; });
    const gs = seg ? [...seg.segment(t)].map(x => x.segment) : [...t];
    for (const g of gs) { if (/\p{Extended_Pictographic}/u.test(g)) { n += 2; continue; } for (const ch of g) { const cp = ch.codePointAt(0); if (cp >= 0xFE00 && cp <= 0xFE0F || cp === 0x200D) continue; n += light(cp) ? 1 : 2; } }
    return n;
  }

  /* ---------------- hook score ----------------
     A transparent heuristic: five parts, each explainable in one sentence.
     calibrate() below checks it against the author's own results. */
  function hookScore(raw) {
    const text = (raw || '').trim();
    const zero = { clarity: 0, curiosity: 0, specificity: 0, tension: 0, brevity: 0 };
    if (!text) return { score: 0, parts: zero, reason: 'Nothing to grade yet. Your first line is the hook.', tone: 'none' };
    const lines = String(text).replace(/https?:\/\/\S+/g, 'link').split(/\n/).map(l => l.trim()).filter(Boolean); let first = lines[0]; if (first.length < 40 && lines[1]) first += ' ' + lines[1];
    const lc = first.toLowerCase(); const len = first.length;
    let clarity = 72, curiosity = 30, spec = 25, tension = 30, brevity;
    brevity = len < 22 ? 80 : len <= 100 ? 96 - Math.max(0, len - 70) * .35 : Math.max(12, 86 - (len - 100) * .55);
    const fillers = lc.match(/\b(really|very|just|basically|actually|literally|kind of|sort of|i think|maybe|perhaps|somewhat|quite|honestly)\b/g) || [];
    clarity -= fillers.length * 14;
    const warm = lc.match(/^(so|hey|hi|hello|ok|okay|well|guys)\b/);
    if (warm) clarity -= 18;
    if (/^(i think|in my opinion|i feel like)/.test(lc)) clarity -= 10;
    if (/[.!?:]$|↓|👇/.test(first)) clarity += 8;
    const imperative = /^(stop|start|quit|double|charge|raise|cut|ship|write|build|never|don[’']?t|forget|ignore|delete|kill|hire|ask|steal|try|drop)\b/.test(lc);
    if (imperative) clarity += 6;
    const cur = lc.match(/\b(nobody|no one|secret|mistake|wrong|why|how|learned|truth|stop|never|most people|here[’']?s|finally|until|almost|wish i|what happened|the one)\b/g) || [];
    curiosity += Math.min(3, cur.length) * 18;
    if (/[:…]\s*$|\.\.\.|↓|👇|🧵|\(thread\)/.test(first)) curiosity += 14;
    if (/\?\s*$/.test(first)) curiosity += 10;
    if (!fillers.length && len < 90 && /\.$/.test(first)) curiosity += 8;
    if (/\d/.test(first)) spec += 34;
    if (/[$€£%×]|\b\d+x\b|\b\d+k\b/i.test(first)) spec += 14;
    if (/\b(i|my|we|our)\b/.test(lc)) spec += 10;
    if (/\b(you|your)\b/.test(lc)) spec += 8;
    spec += Math.min(2, (first.slice(1).match(/\b[A-Z][a-z]{2,}/g) || []).length) * 5;
    const ten = lc.match(/\b(unpopular|overrated|underrated|wrong|myth|lie|stop|don[’']?t|backwards|nobody|hot take|instead|not|never|quit|fired|failed|broke|lost|hate|cop-out|hedge)\b/g) || [];
    tension += Math.min(3, ten.length) * 17 + (imperative ? 20 : 0);
    /* guards against gaming: unfilled blanks, keyboard mash, stacked bait phrases and number stuffing */
    /* blanks: [brackets], {braces}, ___ and TK; a lone X only counts when a Y placeholder sits beside it ("Stop X. Do Y."), so "grow on X" is just X */
    const blank = /\[[^\]]+\]|\{[^}]+\}|_{3,}|\bTK\b/.test(first) || /\bX\b[^\n]*\bY\b/.test(first);
    const toks = first.match(/[A-Za-z]{3,}/g) || [];
    /* tickers, acronyms and chat shorthand (BTC, PnL, tbh, nfts) are words, not mash: only lowercase vowel-less runs of 4+ count, minus a known list */
    const SHORT_OK = /^(btc|eth|sol|nfts?|pnl|tbh|imo|imho|ngl|dca|tvl|cpi|ppi|fomc|gm|gn|ath|atl|rsi|dma|ema|sma|lfg|wagmi|ngmi|wtf|smh|brb|ltv|cltv|mrr|arr|cac|kpis?|ctr|crm|cms|dms?|pfp|yolo|hmm+|psst|shh+|grr+|tsk|nth|rhythms?|crypts?|lynch|nymphs?|psych|spry|sync|synth|myth|lymph|gym|hymn|tryst|dryly|shyly|slyly|why|fly|cry|dry|try|sky|spy|sly|shy|pry|ply)$/i;
    const mash = toks.filter(w => /^(asdf|qwer|zxcv|sdfg|hjkl|uiop|lorem|ipsum|blah)/i.test(w) || /[bcdfghjklmnpqrstvwxz]{6,}/i.test(w) || (w.length >= 4 && w === w.toLowerCase() && !/[aeiouy]/.test(w) && !SHORT_OK.test(w))).length;
    const gib = toks.length ? mash / toks.length : 1;
    const bait = (lc.match(/\b(\d+% of (you|people)|won[’']?t (read|believe|see)|nobody (tells|talks)|secrets?|10x your|game[- ]?changer|you need to see|read (this|till the end)|bookmark this|thank me later|this will change|most people (don[’']?t|won[’']?t|will never)|nobody(?: is|['’]s) talking|stop scrolling|change your life|breaking|unpopular opinion|hot take)\b/g) || []).length + (/\b(agree|thoughts|am i wrong)\s*\?\s*$/i.test(text.trim()) ? 1 : 0) + ((first.match(/\p{Extended_Pictographic}/gu) || []).length >= 3 ? 1 : 0);
    const short = toks.length < 4 && !/\d/.test(first);
    const nums = (first.match(/\d+/g) || []).length;
    if (nums >= 3) spec -= 18 * (nums - 2);
    const c = v => clamp(Math.round(v), 4, 99);
    const parts = { clarity: c(clarity), curiosity: c(curiosity), specificity: c(spec), tension: c(tension), brevity: c(brevity) };
    const raw0 = parts.clarity * .22 + parts.curiosity * .24 + parts.specificity * .2 + parts.tension * .18 + parts.brevity * .16;
    let score = c(raw0 * 1.35 - 10);
    if (bait) score = c(score - (bait > 1 ? 14 * Math.min(3, bait) + 10 : 8));
    if (nums >= 3) score = c(score - 8 * (nums - 2));
    if (gib > .25 || toks.length < 2) score = Math.min(score, 30);
    else if (short) score = Math.min(score, 50);
    if (blank) score = Math.min(score, 40);
    let reason, tone;
    if (blank) { reason = 'There are blanks left. Fill them with what really happened, then it gets a real score.'; tone = 'fix'; }
    else if (gib > .25 || toks.length < 2) { reason = 'That doesn’t read as words yet. Say the thing plainly.'; tone = 'fix'; }
    else if (short) { reason = 'Too short to stop anyone. Say what it’s about.'; tone = 'fix'; }
    else if (bait > 1 || (bait && score < 66)) { reason = 'It reads like bait. Readers have learned to scroll past that. Say the real thing.'; tone = 'fix'; }
    else if (nums >= 3) { reason = 'Too many numbers at once. Keep the one that matters.'; tone = 'fix'; }
    else if (fillers.length) { const orig = (String(text).match(new RegExp(`\\b${fillers[0]}\\b`, 'i')) || [fillers[0]])[0]; reason = `“${orig}” softens the claim. Cut it and the line stands up straighter.`; tone = 'fix'; }
    else if (warm) { reason = `Opening with “${cap(warm[0])}” spends your best real estate on a warm-up.`; tone = 'fix'; }
    else if (parts.brevity < 45) { reason = 'Long first line. Land the point in under 100 characters.'; tone = 'fix'; }
    else if (score >= 70) {
      const s = [];
      if (parts.specificity >= 65) s.push('a concrete number');
      if (parts.curiosity >= 60) s.push('an open loop');
      if (parts.tension >= 60) s.push('real friction');
      if (!s.length) s.push('tight, clear phrasing');
      reason = `${cap(s.slice(0, 2).join(' and '))}. A strong first line.`; tone = 'good';
    }
    else if (parts.specificity < 45) { reason = 'No numbers or specifics yet. Concrete beats clever.'; tone = 'fix'; }
    else if (parts.curiosity < 45) { reason = 'It answers itself. Leave one question open.'; tone = 'fix'; }
    else if (parts.tension < 45) { reason = 'Safe take. What does everyone get wrong here?'; tone = 'fix'; }
    else { reason = 'Solid. A sharper verb or a number would push it over 80.'; tone = 'ok'; }
    return { score, parts, reason, tone };
  }

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
    views: ['impressions', 'views', 'impression_count', 'view count', 'reach']
  };
  function parseCSV(text, src = 'csv') {
    const rows = parseCSVRows(text); if (rows.length < 2) return [];
    const head = rows[0].map(h => h.trim().toLowerCase());
    const col = k => head.findIndex(h => COLS[k].includes(h));
    const ci = { text: col('text'), at: col('at'), likes: col('likes'), reposts: col('reposts'), replies: col('replies'), views: col('views') };
    if (ci.text < 0) { let best = -1, bl = 0; head.forEach((_, i) => { const l = rows.slice(1, 30).reduce((a, r) => a + (r[i] || '').length, 0); if (l > bl) { bl = l; best = i; } }); ci.text = best; }
    return rows.slice(1).map((r, i) => normPost({ text: r[ci.text], at: ci.at >= 0 ? r[ci.at] : null, likes: ci.likes >= 0 ? num(r[ci.likes]) : 0, reposts: ci.reposts >= 0 ? num(r[ci.reposts]) : 0, replies: ci.replies >= 0 ? num(r[ci.replies]) : 0, views: ci.views >= 0 ? num(r[ci.views]) : 0, src, id: `${src}-${i}` })).filter(Boolean);
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
      if (/tweets?(-part\d+)?\.js$/.test(name) || /^\s*window\.YTD\.tweets?/.test(body)) { try { items = items.concat(JSON.parse(stripYTD(body))); } catch (e) { /* keep going */ } }
    }
    const tw = items.map(x => x.tweet || x).filter(t => t && (t.full_text || t.text));
    const byId = new Map(tw.map(t => [t.id_str || t.id, t]));
    const selfId = account && account.id;
    const isSelfReply = t => t.in_reply_to_status_id_str && (t.in_reply_to_user_id_str === selfId || byId.has(t.in_reply_to_status_id_str));
    const heads = tw.filter(t => !/^RT @/.test(t.full_text || t.text) && !t.in_reply_to_status_id_str);
    const kids = new Map(); tw.filter(isSelfReply).forEach(t => { const p = t.in_reply_to_status_id_str; if (!kids.has(p)) kids.set(p, []); kids.get(p).push(t); });
    const thread = t => { const out = [t]; let cur = t; for (let k = 0; k < 25; k++) { const c = (kids.get(cur.id_str) || [])[0]; if (!c) break; out.push(c); cur = c; } return out; };
    const clean = s => String(s).replace(/https:\/\/t\.co\/\w+/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
    const posts = heads.map(t => { const th = thread(t); return normPost({ id: 'x-' + (t.id_str || t.id), text: clean(t.full_text || t.text), thread: th.slice(1).map(x => clean(x.full_text || x.text)), at: t.created_at, likes: num(t.favorite_count), reposts: num(t.retweet_count), replies: num(t.reply_count), views: num(t.view_count || t.impression_count), src: 'x-archive', url: account ? `https://x.com/${account.handle}/status/${t.id_str}` : undefined }); }).filter(Boolean);
    return { posts, account, following };
  }

  /* ---------------- Typefully (API JSON) and pasted text ---------------- */
  function parseTypefully(json) {
    const arr = Array.isArray(json) ? json : (json && (json.results || json.drafts || json.data)) || [];
    return arr.map((d, i) => { const text = d.text || d.content || (Array.isArray(d.tweets) ? d.tweets.map(t => t.text || t).join('\n\n') : '') || (d.platforms && d.platforms.x && d.platforms.x.posts ? d.platforms.x.posts.map(p => p.text).join('\n\n') : '');
      const parts = String(text).split(/\n{4,}/); return normPost({ id: 'tf-' + (d.id || i), text: parts[0], thread: parts.slice(1), at: d.published_on || d.published_at || d.scheduled_date || d.created_at, likes: num(d.likes || d.favorite_count), reposts: num(d.retweets || d.reposts), replies: num(d.replies), views: num(d.impressions), src: 'typefully', url: d.twitter_url || d.x_published_url || d.share_url }); }).filter(Boolean);
  }
  function parsePasted(text) {
    return String(text).split(/\n\s*(?:-{3,}|={3,}|\*{3,})\s*\n|\n{3,}/).map((b, i) => { const m = b.match(/(?:^|\n)\s*(?:❤️?|likes?:?)\s*([\d.,]+[kKmM]?)/); const body = b.replace(/(?:^|\n)\s*(?:❤️?|likes?:?)\s*[\d.,]+[kKmM]?\s*$/, ''); return normPost({ id: 'paste-' + i, text: body, likes: m ? num(m[1]) : 0, src: 'paste' }); }).filter(Boolean);
  }
  function normPost(p) {
    const text = String(p.text || '').trim(); if (!text || text.length < 3) return null;
    let at = p.at ? Date.parse(p.at) : NaN; if (isNaN(at) && p.at && /^\d+$/.test(String(p.at))) at = Number(p.at) * (String(p.at).length <= 10 ? 1000 : 1);
    return { id: p.id || 'p-' + hashStr(text), text, thread: (p.thread || []).filter(Boolean), at: isNaN(at) ? null : at, likes: p.likes || 0, reposts: p.reposts || 0, replies: p.replies || 0, views: p.views || 0, src: p.src || 'import', url: p.url, handle: p.handle };
  }
  function mergeHistory(old, add) { const seen = new Map((old || []).map(p => [p.id, p])); (add || []).forEach(p => { const k = [...seen.values()].find(x => x.text === p.text); if (k) Object.assign(k, { likes: Math.max(k.likes, p.likes), reposts: Math.max(k.reposts, p.reposts), replies: Math.max(k.replies, p.replies), views: Math.max(k.views, p.views), at: k.at || p.at }); else seen.set(p.id, p); }); return [...seen.values()].sort((a, b) => (b.at || 0) - (a.at || 0)); }

  /* ---------------- analytics over your own history ---------------- */
  const eng = p => p.likes + p.reposts * 2 + p.replies * 3;
  function analyze(posts, now = Date.now()) {
    const P = (posts || []).filter(p => p.text);
    if (!P.length) return null;
    const E = P.map(eng), med = median(E) || 1;
    const top = [...P].sort((a, b) => eng(b) - eng(a));
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
    const kinds = {}; P.forEach(p => { const k = kindOf(p.text); (kinds[k] = kinds[k] || []).push(eng(p)); });
    const kindStats = Object.entries(kinds).map(([k, arr]) => ({ k, n: arr.length, x: +(median(arr) / med).toFixed(2) })).sort((a, b) => b.x - a.x);
    const bestKind = kindStats.find(k => k.n >= Math.max(3, P.length * .04) && k.x > 1.15) || null;
    /* times: day-of-week x hour, median engagement relative to overall */
    const dated = P.filter(p => p.at);
    const grid = {}; dated.forEach(p => { const d = new Date(p.at); const key = `${d.getDay()}-${d.getHours()}`; (grid[key] = grid[key] || []).push(eng(p)); });
    const slots = Object.entries(grid).filter(([, a]) => a.length >= 2).map(([k, a]) => { const [dow, h] = k.split('-').map(Number); return { dow, h, n: a.length, x: +(median(a) / med).toFixed(2) }; }).sort((a, b) => b.x - a.x);
    const hours = Array.from({ length: 24 }, (_, h) => { const a = dated.filter(p => new Date(p.at).getHours() === h).map(eng); return { h, n: a.length, x: a.length ? +(median(a) / med).toFixed(2) : 0 }; });
    /* hook calibration: does a higher hook score actually earn more here? */
    const scored = P.map(p => ({ s: hookScore(p.text).score, e: eng(p) }));
    const hi = scored.filter(x => x.s >= 70), lo = scored.filter(x => x.s < 50);
    const calib = hi.length >= 3 && lo.length >= 3 ? { hiN: hi.length, loN: lo.length, x: +(median(hi.map(x => x.e)) / Math.max(1, median(lo.map(x => x.e)))).toFixed(2), r: +pearson(scored.map(x => x.s), scored.map(x => Math.log1p(x.e))).toFixed(2) } : null;
    /* cadence */
    const span = dated.length > 1 ? (Math.max(...dated.map(p => p.at)) - Math.min(...dated.map(p => p.at))) / 864e5 : 0;
    const perWeek = span > 6 ? +(dated.length / (span / 7)).toFixed(1) : null;
    const oldTop = top.filter(p => p.at && now - p.at > 60 * 864e5).slice(0, 5);
    return { n: P.length, median: med, top: top.slice(0, 12), flops: top.slice(-6).reverse(), oldTop, stats: { wps: +wps.toFixed(1), emojiPer: +emojiPer.toFixed(2), tagsPer: +tagsPer.toFixed(2), oneSentOpen: Math.round(oneSentOpen * 100), lower: Math.round(lower * 100), avgLen: Math.round(avgLen), threads: Math.round(threads * 100) }, lean, kindStats, bestKind, slots: slots.slice(0, 6), hours, calib, perWeek, span: Math.round(span) };
  }
  function pearson(a, b) { const n = a.length; if (n < 3) return 0; const ma = a.reduce((x, y) => x + y, 0) / n, mb = b.reduce((x, y) => x + y, 0) / n; let num = 0, da = 0, db = 0; for (let i = 0; i < n; i++) { num += (a[i] - ma) * (b[i] - mb); da += (a[i] - ma) ** 2; db += (b[i] - mb) ** 2; } return da && db ? num / Math.sqrt(da * db) : 0; }

  /* ---------------- prompts ----------------
     Every call carries the same editor brief plus the author's own evidence.
     tier: quick | default | complex → server maps to Sonnet 5.5 (low / medium effort) or Opus 5.5.
     All structured calls ask for one JSON value. */
  const BRIEF = `You are Hookworthy's editor: a sharp friend who edits social posts so they sound like the author on a good day, never like AI.
Hard rules:
- Keep the author's facts, numbers, names and claims. Never invent a number, a result, a person or an event. If a stronger version needs a number the author didn't give, write [number] instead.
- Match the author's voice from the evidence given: casing, punctuation, line breaks, sentence length, slang, emoji and hashtag habits. If they write lowercase, stay lowercase.
- Plain words. Short sentences. One idea per line.
- Never use these AI tells: delve, game-changer, unlock, leverage, elevate, supercharge, seamless, "in today's fast-paced world", "here's the thing", "let that sink in", "it's not X, it's Y" more than once, a stack of three adjectives, rhetorical questions as filler. No em dashes unless the author uses them.
- Never open with bait: "Here's the thing", "Unpopular opinion:", "Nobody talks about", "Most people…", "Stop X. Start Y.", "99% of you". Never end on "Agree?", "Thoughts?" or "Am I wrong?".
- No hashtags or emoji unless the author uses them in the examples.
- Respect the platform limit you're given.`;
  function voiceBlock(v) {
    if (!v) return '';
    const bits = [];
    if (v.summary) bits.push(`How they write: ${v.summary}`);
    if (v.rules && v.rules.length) bits.push(`Their habits:\n- ${v.rules.slice(0, 8).join('\n- ')}`);
    if (v.never && v.never.length) bits.push(`Words they never use: ${v.never.join(', ')}`);
    if (v.tone) bits.push(`Tone dials (0-100): calm→spicy ${v.tone.spice}, casual→polished ${v.tone.polish}, short→rich ${v.tone.length}`);
    if (v.examples && v.examples.length) bits.push(`Their best posts, for voice only (don't reuse the content):\n${v.examples.slice(0, 5).map((e, i) => `<post ${i + 1}>\n${e}\n</post ${i + 1}>`).join('\n')}`);
    return bits.join('\n\n');
  }
  const RIFF_ASK = {
    punchier: 'Make it punchier: cut filler and hedges, sharpen verbs, same length or shorter.',
    shorter: 'Make it clearly shorter (aim for two thirds of the length) without losing the point.',
    hook: 'Rewrite the FIRST LINE so it stops the scroll (specific, a little tension or an open loop). Keep the rest, lightly tightened.',
    contrarian: 'Reframe it as a contrarian take the author could defend. Same facts.',
    curiosity: 'Restructure it to open a curiosity gap in the first line and pay it off by the end.',
    grammar: 'Fix only spelling, grammar and punctuation. Keep their casing style and every word choice that isn\'t an error.',
    translate: 'Translate it naturally, keeping the tone, slang and line breaks.'
  };
  const P = {
    rewrite({ text, kind, lang, voice, platform = 'X', limit = 280 }) {
      return { tier: kind === 'grammar' ? 'quick' : 'default', json: true, prompt: `${BRIEF}

${voiceBlock(voice)}

Task: ${RIFF_ASK[kind] || RIFF_ASK.punchier}${kind === 'translate' ? ` Target language: ${lang}.` : ''}
Platform: ${platform}, ${limit} characters per post.

<draft>
${text}
</draft>

Reply with only JSON: {"options":[{"text":"...","why":"one short sentence on what changed"}]} with 3 genuinely different options${kind === 'grammar' ? ' (1 option is fine)' : ''}. If the draft is already strong for this task, the first option may be the draft with only tiny edits.` };
    },
    voiceProfile({ posts, handle, niche }) {
      const sample = posts.slice(0, 120).map(p => `<post likes="${p.likes}" reposts="${p.reposts}" replies="${p.replies}">\n${p.text}${p.thread && p.thread.length ? '\n' + p.thread.slice(0, 3).join('\n') : ''}\n</post>`).join('\n');
      return { tier: 'complex', json: true, prompt: `You study how one person writes on social media so an editor can match their voice exactly. ${handle ? `Account: @${handle}.` : ''} ${niche ? `Niche: ${niche}.` : ''}

Here are their posts, most engaging first, with engagement counts:
${sample}

Describe their voice from evidence only. Reply with only JSON:
{"summary":"2 sentences, plain words, how they sound","traits":[{"name":"one word, e.g. Direct","evidence":"a short measurable observation, e.g. 82% of openers are one sentence"}],"rules":["6-8 concrete habits an editor must keep, e.g. writes in lowercase, never uses hashtags, line break after the first sentence"],"avoid":["3-6 things that would sound wrong for them"],"works":["3-5 patterns that correlate with their best-performing posts, citing what you saw"],"most_you":"the exact text of the single post that sounds most like them","niche":"their niche in 2-4 words"}
Give exactly 3 traits.` };
    },
    ideas({ niche, voice, top, inbox, count = 6 }) {
      return { tier: 'default', json: true, prompt: `${BRIEF}

${voiceBlock(voice)}

The author writes about: ${niche || 'building in public'}.
Their best posts so far (what their audience rewards):
${(top || []).slice(0, 6).map(t => `- ${t.text.split('\n')[0]} (${t.likes} likes)`).join('\n') || '- (none yet)'}
Notes they saved to write about later:
${(inbox || []).slice(0, 8).map(t => `- ${t}`).join('\n') || '- (none)'}

Suggest ${count} first lines they could write today, grounded in their notes and what already works for them. No generic advice-guru lines. Reply with only JSON: [{"text":"the first line","kind":"Contrarian|Story|Listicle|How-to|Curiosity|Question","why":"one short sentence, tied to their evidence"}]` };
    },
    postmortem({ post, median, similar, voice }) {
      return { tier: 'default', json: true, prompt: `${BRIEF}

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
      return { tier: 'default', json: true, prompt: `${BRIEF}

These are recent high-performing posts from accounts someone learns from${niche ? ` in ${niche}` : ''}. Find the reusable patterns, not the topics.

${posts.slice(0, 40).map(p => `<post author="@${p.handle || 'someone'}" likes="${p.likes}">\n${p.text}\n</post>`).join('\n')}

Reply with only JSON: [{"pattern":"short name","why":"why it works, one sentence","example":"the post's first line that shows it","author":"handle","try":"a fill-in-the-blank first line the reader could use, with [brackets] for their own details"}] — 4 to 6 items.` };
    },
    replies({ post, replies, voice }) {
      return { tier: 'default', json: true, prompt: `${BRIEF}

${voiceBlock(voice)}

The author just posted this:
<post>
${post}
</post>

Replies in the first hour (the ones worth answering, most important first):
${replies.slice(0, 12).map((r, i) => `<reply id="${i}" from="@${r.handle}" followers="${r.followers || 0}">${r.text}</reply>`).join('\n')}

Write one reply for each, in the author's voice: short, warm or sharp as the reply deserves, adds something (a detail, a number, a question back), never generic thanks, never "Great question". Under 200 characters each. Reply with only JSON: [{"id":0,"reply":"...","why":"what this reply earns, 6 words max"}]` };
    },
    weekPlan({ niche, voice, top, inbox, slots, count = 5, limit = 280 }) {
      return { tier: 'default', json: true, prompt: `${BRIEF}

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
      return { tier: 'quick', json: true, prompt: `Two first lines for the same post. Using the author's own results below as the main evidence, predict which gets more engagement from their audience and say why in one sentence.

${voiceBlock(voice)}

Their posts most similar to each line, with engagement:
${evidence || '(no history)'}

<a>${a}</a>
<b>${b}</b>

Reply with only JSON: {"winner":"a"|"b","confidence":0.5-0.95,"why":"one sentence"}` };
    },
    digest({ week, best, worst, voice, niche }) {
      return { tier: 'default', json: true, prompt: `${BRIEF}

Write a short Sunday note to a creator about their week on social media. Plain, warm, specific, no hype, no emoji.

This week: ${week}
Best post: ${best ? `"${best.text}" (${best.likes} likes, ${best.replies || 0} replies)` : 'none'}
Quietest post: ${worst ? `"${worst.text}" (${worst.likes} likes)` : 'none'}
Niche: ${niche || ''}
${voiceBlock(voice)}

Reply with only JSON: {"subject":"under 60 characters","headline":"one sentence on the week","why_best":"why the best one worked, one sentence","try_next":"one concrete thing to try next week","first_line":"a first line they could post Monday, in their voice"}` };
    },
    briefRead({ text, niche }) {
      return { tier: 'default', json: true, prompt: `A creator dropped in a brief (notes, a doc, a transcript) and wants posts written from it. Read it like a careful editor before anyone writes a word.

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
      return { tier: 'default', json: true, prompt: `${BRIEF}

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
      return { tier: 'quick', json: true, prompt: `${BRIEF}

${voiceBlock(voice)}

This was dictated out loud, so it rambles. Turn it into ${format === 'thread' ? `an X thread (each post at most ${limit} characters)` : `one post (at most ${limit} characters)`} in the author's voice. Keep their words and every fact; cut fillers, repeats and false starts. Don't add claims.

<spoken>
${text}
</spoken>

Reply with only JSON: {"posts":["..."]}` };
    },
    radarReplies({ posts, voice, niche }) {
      return { tier: 'default', json: true, prompt: `${BRIEF}

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
      return { tier: 'default', json: true, prompt: `${BRIEF}

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
      return { tier: 'quick', json: true, prompt: `You are the art director for one social media graphic that goes under this post. The graphic must make someone scrolling stop and get the point in one second.

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
    critique({ text, voice }) {
      return { tier: 'quick', json: true, prompt: `${BRIEF}

${voiceBlock(voice)}

Grade only the first line of this post as a scroll-stopper for people who don't know the author yet.
<draft>
${text}
</draft>
Reply with only JSON: {"reason":"one plain sentence on the biggest issue or strength","better":["3 stronger first lines in their voice, same facts, [brackets] for any number they'd need to add"]}` };
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
  const NUM = '[$€£]?\\d[\\d,]*(?:\\.\\d+)?\\s?(?:%|[kKmMbB]\\b|x\\b|×)?';
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
  const KIND_PL = { Contrarian: 'contrarian posts', Listicle: 'lists', Question: 'questions', 'How-to': 'how-tos', Story: 'stories', Curiosity: 'open-loop posts', Announcement: 'announcements', Take: 'plain takes' };
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
    { re: /\s*(?:Let that sink in|Read that again)\.?/i, msg: '“Let that sink in” tells people how to feel.' },
    { re: /\s*(?:Agree|Thoughts|Am I wrong)\s*\?\s*$/i, msg: 'Ends on a bait question. End on your point instead.' },
    { re: /\bnobody(?: is|['’]s) talking about\b/i, msg: '“Nobody is talking about this” is a cliché. Say what you noticed.' },
    { re: /(?:(?:🚀|🔥|💯|🙌|👏)\s*){3,}/u, msg: 'An emoji pile-up.' }
  ];
  function checkPost(text, { never = [], limit = 280 } = {}) {
    const out = []; const t = String(text || '');
    if (/\[[^\]\n]{1,40}\]|\bTK\b|\bTODO\b/i.test(t)) out.push('Still has a blank to fill.');
    if ([...t].length > limit) out.push(`${[...t].length - limit} characters over the ${limit} limit.`);
    if ((t.match(/#\w+/g) || []).length > 2) out.push('More than two hashtags reads like a bot.');
    if (/\bhttps?:\/\//.test(t.split('\n')[0])) out.push('A link in the first post shrinks reach on X and LinkedIn. Put it in a reply.');
    CRINGE.forEach(c => { if (c.re.test(t)) out.push(c.msg); });
    never.forEach(w => { if (t.toLowerCase().includes(String(w).toLowerCase())) out.push(`Uses “${w}”, which is on the never-say list.`); });
    return out;
  }

  return { learnHooks, personalScore, traitsOf, spearman, factCheck, tidySpoken, briefRead, briefDraft, visualPlan, voiceMatch, predictFromHistory, xLength, clamp, cap, STOP, words, median, hashStr, hookScore, kindOf, parseCSV, parseCSVRows, parseXArchive, parseTypefully, parsePasted, normPost, mergeHistory, analyze, eng, BRIEF, voiceBlock, prompts: P, CRINGE, checkPost };
});
