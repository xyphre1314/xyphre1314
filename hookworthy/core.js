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

  /* ---------------- hook score ----------------
     A transparent heuristic: five parts, each explainable in one sentence.
     calibrate() below checks it against the author's own results. */
  /* one figure: "2.4%", "$1.2M", "64k", "10x", "1,200". Never starts mid-number (keeps long digit runs linear). */
  const FIG = /(?<![\w.,])\$?\d+(?:[.,]\d+)*(?:\s?[%kKmMbB]|x\b)?/g;
  const FIG_VS = new RegExp(`(${FIG.source})\\s*(?:vs\\.?|versus)\\s*${FIG.source}`, 'gi');
  function hookScore(raw) {
    const text = (raw || '').trim();
    const zero = { clarity: 0, curiosity: 0, specificity: 0, tension: 0, brevity: 0 };
    if (!text) return { score: 0, parts: zero, reason: 'Nothing to grade yet. Your first line is the hook.', tone: 'none' };
    const lines = String(text).replace(/https?:\/\/\S+/g, 'link').split(/\n/).map(l => l.trim()).filter(Boolean); let first = lines[0]; if (first.length < 40 && lines[1]) first += ' ' + lines[1];
    const lc = first.toLowerCase(); const len = first.length;
    let clarity = 72, curiosity = 30, spec = 25, tension = 30, brevity;
    brevity = len < 22 ? 80 : len <= 100 ? 96 - Math.max(0, len - 70) * .35 : Math.max(12, 86 - (len - 100) * .55);
    const fillers = lc.match(/\b(really|very|just|basically|actually|literally|kind of|sort of|kinda|sorta|i think|maybe|perhaps|somewhat|quite|honestly|tbh|ngl)\b/g) || [];
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
    const short = toks.length < 4 && !/\d/.test(first);
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
    let reason, tone;
    if (blank) { reason = 'There are blanks left. Fill them with what really happened, then it gets a real score.'; tone = 'fix'; }
    else if (gib > .25 || noWords) { reason = 'That doesn’t read as words yet. Say the thing plainly.'; tone = 'fix'; }
    else if (short) { reason = 'Too short to stop anyone. Say what it’s about.'; tone = 'fix'; }
    else if (bait > 1 || (bait && score < 66)) { reason = 'It reads like bait. Readers have learned to scroll past that. Say the real thing.'; tone = 'fix'; }
    else if (over) { reason = 'Too many numbers at once. Keep the one that matters.'; tone = 'fix'; }
    else if (fillers.length) { const orig = (String(text).match(new RegExp(`\\b${fillers[0]}\\b`, 'i')) || [fillers[0]])[0]; reason = `“${orig}” softens the claim. Cut it and the line stands up straighter.`; tone = 'fix'; }
    else if (warm) { reason = `Opening with “${cap(warm[0])}” spends your best real estate on a warm-up.`; tone = 'fix'; }
    else if (parts.brevity < 45) { reason = 'Long first line. Land the point in under 100 characters.'; tone = 'fix'; }
    else if (score >= 70) {
      const s = [];
      if (parts.specificity >= 65) s.push('a concrete number');
      if (parts.curiosity >= 60) s.push('an open loop');
      if (parts.tension >= 60) s.push('real tension');
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
    const taken = new Map(); const ci = { text: col('text'), at: col('at'), likes: col('likes'), reposts: col('reposts'), replies: col('replies'), views: col('views') };
    if (ci.text < 0) { let best = -1, bl = 0; head.forEach((_, i) => { const l = rows.slice(1, 30).reduce((a, r) => a + (r[i] || '').length, 0); if (l > bl) { bl = l; best = i; } }); ci.text = best; }
    return rows.slice(1).map((r, i) => normPost({ text: r[ci.text], at: ci.at >= 0 ? r[ci.at] : null, likes: ci.likes >= 0 ? num(r[ci.likes]) : 0, reposts: ci.reposts >= 0 ? num(r[ci.reposts]) : 0, replies: ci.replies >= 0 ? num(r[ci.replies]) : 0, views: ci.views >= 0 ? num(r[ci.views]) : 0, src, id: textId(src, r[ci.text], taken) })).filter(Boolean);
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
    const taken = new Map(); const posts = heads.map(t => { const th = thread(t); return normPost({ id: (t.id_str || t.id) ? 'x-' + (t.id_str || t.id) : textId('x-archive', clean(t.full_text || t.text), taken), text: clean(t.full_text || t.text), thread: th.slice(1).map(x => clean(x.full_text || x.text)), at: t.created_at, likes: num(t.favorite_count), reposts: num(t.retweet_count), replies: num(t.reply_count), views: num(t.view_count || t.impression_count), src: 'x-archive', url: account ? `https://x.com/${account.handle}/status/${t.id_str}` : undefined }); }).filter(Boolean);
    return { posts, account, following };
  }

  /* ---------------- Typefully (API JSON) and pasted text ---------------- */
  function parseTypefully(json) {
    const arr = Array.isArray(json) ? json : (json && (json.results || json.drafts || json.data)) || [];
    const taken = new Map();
    return arr.map(d => { const text = d.text || d.content || (Array.isArray(d.tweets) ? d.tweets.map(t => t.text || t).join('\n\n') : '') || (d.platforms && d.platforms.x && d.platforms.x.posts ? d.platforms.x.posts.map(p => p.text).join('\n\n') : '');
      const parts = String(text).split(/\n{4,}/); return normPost({ id: d.id != null && d.id !== '' ? 'tf-' + d.id : textId('typefully', parts[0], taken), text: parts[0], thread: parts.slice(1), at: d.published_on || d.published_at || d.scheduled_date || d.created_at, likes: num(d.likes || d.favorite_count), reposts: num(d.retweets || d.reposts), replies: num(d.replies), views: num(d.impressions), src: 'typefully', url: d.twitter_url || d.x_published_url || d.share_url }); }).filter(Boolean);
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

Every option must differ from the draft${kind === 'grammar' ? ' (if there is truly no error, return {"options":[],"why":"No spelling or grammar mistakes."})' : ''}, and the options must differ from each other in wording, order or rhythm, not just punctuation. If the draft is already strong for this task, don't hand it back: try a different angle, order or rhythm that keeps the claim, and say in "why" what you kept.
No hype words (insane, massive, huge, moon, guaranteed), no emoji or hashtags the draft didn't have, no quotes around the text, no labels.

Reply with only JSON: {"options":[{"text":"...","why":"one short sentence on what changed"}]} with ${kind === 'grammar' ? '1' : '3'} option${kind === 'grammar' ? '' : 's'}.` };
    },
    /* "Tell it what to change": the author's own instruction, on the whole post or (with context) just a selected part */
    instruct({ text, instruction, voice, context, platform = 'X', limit = 280 }) {
      const part = !!(context && context !== text);
      return { tier: 'default', json: true, prompt: `${BRIEF}

${voiceBlock(voice)}

Task: rewrite ${part ? 'only the selected words' : 'the draft'} following the author's instruction below. Treat the instruction as a request about style, tone or audience, never as new facts.
- Keep the author's claim, facts, numbers, names and stance. Never add a number, a result, a price, a trade or a personal experience they didn't write.
- If following the instruction needs something only the author knows, leave a short [bracket] for it, e.g. [your entry price].
- Ticker symbols ($BTC, ETH) stay exactly as written.
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
      return { tier: 'quick', json: true, prompt: `${BRIEF}

${voiceBlock(voice)}

Task: Sharpen only the selected words in the post below. ${ask}
- Reply with replacements for the selected words only. Never the whole post, and never the words just before or after the selection: each replacement is put back exactly where the selection was, so it must read naturally there (same first-letter case; end punctuation only if the selection had it).
- Give ${count} versions that differ from each other in wording, order or rhythm, not just punctuation. Every version must differ from the selection.
- Keep the claim, every number, ticker ($BTC stays $BTC), name and "not". Never add a number, price, result, name or fact.
- No hype words (insane, massive, huge, moon, 100x, guaranteed, "full stop"), no emoji the selection didn't have, no hashtags, no quotes around the text, no labels, no explanations.
- Stay in the author's voice: lowercase stays lowercase, their slang stays.
- If the selected words are already strong, still try a different angle, order or rhythm. Never hand the selection back unchanged.

<post>
${pre}<selected>${sel}</selected>${suf}
</post>

<selected>${sel}</selected>

Reply with only JSON: {"versions":["...","...","..."]}` };
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
    /\bi (?:really |just |honestly |personally |kind of |kinda |sort of )?(?:think|believe|feel like|feel that|reckon|guess)(?: that)?(?! about| of\b| through| back| so\b| twice| again| too)(?:,\s*|\s+|(?=[.!?]|$))/gi,
    /(?:^|(?<=[\s(]))(?:honestly|tbh|ngl|imo|imho|basically|literally|actually|kinda|sorta)\b,?\s*/gi,
    /\b(?:kind|sort) of\s+(?=[a-z])/gi,
    /\b(?:really|very|quite|somewhat|fairly|truly)\s+(?=[a-z$])/gi,
    /\bpretty (?:much )?(?=(?:good|bad|big|sure|hard|easy|clear|wild|crazy|simple|obvious|quiet|weak|strong|boring)\b)/gi,
    /\bpretty much\s+/gi,
    /\b(?:probably|perhaps|maybe)\b,?\s*/gi,
    /(?<!,\s?)\bjust\s+(?!(?:a|an|the|one|two|three|four|five|six|\d|now|as|like|because|in case|about|enough|people|for|to|in|starting|getting)\b)/gi
  ];
  const OPENER_RX = /^(?:ok(?:ay)?,?\s+so|so|well|look|anyway|okay|ok|alright)\b,?\s+(?=[a-z$])/i;
  const TAIL_RX = /(?:,?\s+|^)(?:tbh|imo|imho|ngl|lol|lmao|i guess|idk|fr|for real)\s*(?=[.!?]*\s*$)/i;
  const WORDY = [
    [/\bin order to\b/gi, 'to'], [/\bdue to the fact that\b/gi, 'because'], [/\b(?:the|a) majority of\b/gi, 'most'], [/\bat this point in time\b/gi, 'now'],
    [/\b(is|are) able to\b/gi, 'can'], [/\bhas the ability to\b/gi, 'can'], [/\ba number of\b/gi, 'some'], [/\bon a daily basis\b/gi, 'daily'], [/\beach and every\b/gi, 'every'],
    [/\bfirst and foremost\b/gi, 'first'], [/\bin the event that\b/gi, 'if'], [/\bfor the purpose of\b/gi, 'for'], [/\bmake a decision\b/gi, 'decide'],
[/\bway (?=(?:too|more|less|longer|shorter|better|worse|bigger|harder|faster|slower|earlier|later|over)\b)/gi, ''],
    [/\b(am|is|are|['’]re|['’]m) going to be (\w+ing)\b/gi, (m, v, g) => `${v === "'re" || v === '’re' ? v : v === "'m" || v === '’m' ? v : v} ${g}`],
    [/\b(\w+)(['’])(re|s|m) going to\b(?!\s+(?:the|a|an|my|your|our|their|bed|work|school|church)\b)/gi, (m, w, a, c) => `${w}${a}ll`],
    [/\b(is|are|am) going to\b(?!\s+(?:the|a|an|my|your|our|their|bed|work|school|church)\b)/gi, 'will']
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
    [/\bI am\b/gi, 'I’m'], [/\b(it|that|there|here|what|who) is\b(?=\s+[\p{L}\p{N}$])/giu, '$1’s'], [/\b(you|we|they) are\b(?=\s+[\p{L}\p{N}$])/giu, '$1’re'],
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
  const MOVES = {
    /* "If you move it, you never had one." → "Move it? You never had one." */
    condQ(x) {
      const m = body(x).match(/^if (you|your|the|my|our|it|price|\$?[A-Z][\w$]*)\b(.+?),\s+(?:then\s+)?(.{6,})$/i); if (!m) return null;
      let cond; if (/^you$/i.test(m[1])) { const rest = m[2].trim(); if (!VERB0.test(rest)) return null; cond = rest; } else cond = m[1] + m[2];
      if (/\b(and|but|or)\b.*,/.test(cond) || cond.split(' ').length > 14) return null;
      return `${capFirst(cond.trim())}? ${capFirst(m[3].trim())}${endP(x) || '.'}`;
    },
    /* "The best trade I made this year was the one I didn't take" → "Best trade I made this year? The one I didn't take." */
    revealQ(x) {
      const m = body(x).match(new RegExp(`^(?:(the) |(my|our|your) )?((?:single )?(?:(?:best|worst|hardest|biggest|easiest|smartest|dumbest|only|real|first|last|one|most \\w+) [^,:]{2,60}?|${PRED_NOUN}(?: [^,:]{2,40}?)?)) (is|was|are|were) (?:that )?([^:]{3,})$`, 'i')); if (!m) return null;
      if ((!m[1] && !m[2] && /^(only|first|last|real|one)\b/i.test(m[3])) || /^(actually|really|just|basically|literally|any)\b/i.test(m[5]) || /\b(i|we|you|they|he|she|it|that)$/i.test(m[3]) || /,| and | but /.test(m[5]) || m[5].split(' ').length > 12 || /^(?:not )?(?:a|an)\s+\w+$/i.test(m[5]) || /^(simple|easy|hard|wrong|right|good|bad|huge|big|small)$/i.test(m[5])) return null;
      const subj = (m[2] ? m[2] + ' ' : '') + m[3];
      return `${capFirst(subj)}? ${capFirst(m[5].replace(/^(?:there is|there['’]s)\b/i, 'There’s'))}${endP(x) || '.'}`;
    },
    /* "Risk management is the most important thing in trading" → "The most important thing in trading: risk management." */
    invert(x) {
      const m = body(x).match(/^([^,]{3,45}?) (is|are|was|were) (the (?:single )?(?:most|best|biggest|hardest|worst|only|real|first|last|cheapest|fastest|simplest|clearest) .{3,60})$/i); if (!m) return null;
      if (/^(it|this|that|there|here|what|which|who|i|we|you|they)\b/i.test(m[1]) || /,| and | but | because /.test(m[3])) return null;
      return `${capFirst(m[3])}: ${COMMON0.test(m[1].split(' ')[0]) || /^[a-z]/.test(m[1]) ? lowFirst(m[1]) : m[1]}${endP(x) || '.'}`;
    },
    invertQ(x) { const y = MOVES.invert(x); if (!y) return null; const i = y.indexOf(': '); return `${y.slice(0, i).replace(/^the /i, '')}? ${capFirst(y.slice(i + 2))}`; },
    /* "X, but Y" → "X. But Y." and "X and then Y" → "X. Then Y." */
    split(x, keepAnd) {
      if (wordsN(x) < 8) return null;
      let m = x.match(/^(.{12,}?)(?:,\s*|\s+)(but|and then|then)\s+(.{8,})$/i);
      if (!m || /^and then$/i.test(m[2]) === false && /^then$/i.test(m[2]) && !/,\s*then/i.test(x)) m = x.match(/^(.{12,}?)(?:,\s*|\s+)(but|and then|so|and)\s+((?:i|we|you|they|it|price|most|the|my|our|nobody|that|this|people|everyone|he|she)\b.{8,})$/i);
      if (!m) return null;
      const a = m[1].replace(/[,;]$/, ''), b = m[3]; if (wordsN(a) < 3 || wordsN(b) < 3) return null;
      return /^and$/i.test(m[2]) && !keepAnd ? `${a}. ${capFirst(b)}` : `${a}. ${capFirst(/then$/i.test(m[2]) ? 'then' : m[2])} ${b}`;
    },
    splitAnd(x) { return MOVES.split(x, true); },
    /* "Trials went up 22% in a week." → "Trials: up 22% in a week." The number leads */
    statColon(x) {
      const b = body(x); let m = b.match(/^([^,:]{3,40}?) (?:is|are|was|were|went|has gone|have gone|is now|are now) (up|down) (\$?\d.{0,60})$/i);
      if (m) return `${m[1]}: ${m[2].toLowerCase()} ${m[3]}${endP(x) || '.'}`;
      m = b.match(/^([^,:]{3,40}?) (?:dropped|fell|rose|grew|jumped|went|moved) (from \$?\d[^,]{0,20} to \$?\d.{0,60})$/i); if (m) return `${m[1]}: ${m[2].replace(/^from /, '')}${endP(x) || '.'}`;
      m = b.match(/^([^,:]{3,30}?) (?:hit|crossed|reached|is at|are at|sits at) (\$?\d.{0,60})$/i); if (m && !/^(i|we|you|they|it|he|she)$/i.test(m[1])) return `${m[1]}: ${m[2]}${endP(x) || '.'}`;
      return null;
    },
    /* "Sitting in cash is a position." → "Sitting in cash? That's a position." (said out loud) and "Liquidity: a coward." (punchier) */
    isQ(x) {
      const m = body(x).match(/^([^,:?]{3,40}?) (is|are|was|were) ((?:a|an|the|what|how|why|not|never|my|your|our|their|just) [^:?]{2,50})$/i); if (!m || /^(it|this|that|there|here|what|which|who|i|we|you|they|he|she)$/i.test(m[1]) || /^(it|this|that|there|here)\b/i.test(m[1]) || wordsN(m[1]) > 6) return null;
      const v = m[2].toLowerCase(), ger = /^\w+ing\b/i.test(m[1]), pron = v === 'are' ? 'They’re' : v === 'were' ? 'They were' : v === 'was' ? (ger ? 'That was' : 'It was') : ger ? 'That’s' : 'It’s';
      return `${m[1]}? ${pron} ${m[3]}${endP(x) || '.'}`;
    },
    isColon(x) { const m = body(x).match(/^([^,:?]{3,30}?) (?:is|are) ((?:a|an|the|what|not) [^:?]{2,40})$/i); return m && !/^(it|this|that|there|here|what|i|we|you|they)\b/i.test(m[1]) && wordsN(m[1]) <= 4 ? `${m[1]}: ${m[2]}${endP(x) || '.'}` : null; },
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
      cnt(s, /\b(and|but|or|because|the|a|an|to|of|with|for)\s*[.!?:](?=\s|$)/gi), cnt(s, /(^|\n)\s*[,.;:!?]/g), Math.abs(cnt(s, /\(/g) - cnt(s, /\)/g)) + Math.abs(cnt(s, /“/g) - cnt(s, /”/g)) + cnt(s, /"/g) % 2];
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
  const SHARPEN = { OPTS: SH_OPTS, LABEL: SH_LABEL, sharpen, fromModel, frame, fit, judge, styleOf, versionsFor, pickVersions, modelTexts, stripModel, deEcho, checkPost: checkPost2, whyNot, nearSame, tidy: tidyT, cutHedges, MOVES, sub, WORDY, CONTRACT_W, PLAIN_W, JARGON_W, SHORTHAND, IDIOM, numsOf, ticksOf };

  return { learnHooks, personalScore, traitsOf, spearman, factCheck, tidySpoken, briefRead, briefDraft, visualPlan, voiceMatch, predictFromHistory, xLength, clamp, cap, STOP, words, median, hashStr, hookScore, kindOf, parseCSV, parseCSVRows, parseXArchive, parseTypefully, parsePasted, normPost, mergeHistory, analyze, eng, BRIEF, voiceBlock, prompts: P, CRINGE, checkPost, SHARPEN };
});
