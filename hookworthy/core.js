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

  /* ---------------- hook score ----------------
     A transparent heuristic: five parts, each explainable in one sentence.
     calibrate() below checks it against the author's own results. */
  function hookScore(raw) {
    const text = (raw || '').trim();
    const zero = { clarity: 0, curiosity: 0, specificity: 0, tension: 0, brevity: 0 };
    if (!text) return { score: 0, parts: zero, reason: 'Nothing to grade yet. Your first line is the hook.', tone: 'none' };
    const lines = text.split(/\n/).map(l => l.trim()).filter(Boolean); let first = lines[0]; if (first.length < 40 && lines[1]) first += ' ' + lines[1];
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
    const c = v => clamp(Math.round(v), 4, 99);
    const parts = { clarity: c(clarity), curiosity: c(curiosity), specificity: c(spec), tension: c(tension), brevity: c(brevity) };
    const raw0 = parts.clarity * .22 + parts.curiosity * .24 + parts.specificity * .2 + parts.tension * .18 + parts.brevity * .16;
    const score = c(raw0 * 1.35 - 10);
    let reason, tone;
    if (fillers.length) { reason = `“${fillers[0]}” softens the claim. Cut it and the line stands up straighter.`; tone = 'fix'; }
    else if (warm) { reason = `Opening with “${cap(warm[0])}” spends your best real estate on a warm-up.`; tone = 'fix'; }
    else if (parts.brevity < 45) { reason = 'Long first line. Land the point in under 100 characters.'; tone = 'fix'; }
    else if (score >= 70) {
      const s = [];
      if (parts.specificity >= 65) s.push('a concrete number');
      if (parts.curiosity >= 60) s.push('an open loop');
      if (parts.tension >= 60) s.push('real friction');
      if (!s.length) s.push('tight, clear phrasing');
      reason = `${cap(s.slice(0, 2).join(' and '))}. That stops a scroll.`; tone = 'good';
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
- Never use these AI tells: delve, game-changer, unlock, leverage, elevate, supercharge, seamless, "in today's fast-paced world", "here's the thing", "let that sink in", "it's not X, it's Y" more than once, a stack of three adjectives, em dashes in every sentence, rhetorical questions as filler.
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

The author writes about: ${niche || 'building things in public'}.
Their best posts so far (what their audience rewards):
${(top || []).slice(0, 6).map(t => `- ${t.text.split('\n')[0]} (${t.likes} likes)`).join('\n') || '- (none yet)'}
Notes they saved to write about later:
${(inbox || []).slice(0, 8).map(t => `- ${t}`).join('\n') || '- (none)'}

Suggest ${count} first lines they could write today, grounded in their notes and what already works for them. No generic advice-guru lines. Reply with only JSON: [{"text":"the first line","kind":"Contrarian|Story|Listicle|How-to|Curiosity|Question","why":"one short sentence, tied to their evidence"}]` };
    },
    postmortem({ post, median, similar, voice }) {
      return { tier: 'default', json: true, prompt: `You explain why one social post over- or under-performed for its author, using only the evidence given. Be specific and plain; no hype.

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
      return { tier: 'default', json: true, prompt: `These are recent high-performing posts from accounts someone learns from${niche ? ` in ${niche}` : ''}. Find the reusable patterns, not the topics.

${posts.slice(0, 40).map(p => `<post author="@${p.handle || 'someone'}" likes="${p.likes}">\n${p.text}\n</post>`).join('\n')}

Reply with only JSON: [{"pattern":"short name","why":"why it works, one sentence","example":"the post's first line that shows it","author":"handle","try":"a fill-in-the-blank first line the reader could use, with [brackets] for their own details"}] — 4 to 6 items.` };
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

  /* pre-post rules shared with the server's /api/v1/check and the MCP server */
  const CRINGE = [
    { re: /\b(?:I['’]?m|I am|we['’]re|we are) (?:so |super |beyond )?(?:humbled|thrilled|excited|delighted|honou?red) to (?:announce|share)(?: that)?/i, msg: 'Opens like a press release.' },
    { re: /\s*(?:Let that sink in|Read that again)\.?/i, msg: '“Let that sink in” tells people how to feel.' },
    { re: /\s*(?:Agree|Thoughts|Am I wrong)\s*\?\s*$/i, msg: 'Ends on a bait question.' },
    { re: /\bnobody(?: is|['’]s) talking about\b/i, msg: '“Nobody is talking about this.”' },
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

  return { clamp, cap, STOP, words, median, hashStr, hookScore, kindOf, parseCSV, parseCSVRows, parseXArchive, parseTypefully, parsePasted, normPost, mergeHistory, analyze, eng, BRIEF, voiceBlock, prompts: P, CRINGE, checkPost };
});
