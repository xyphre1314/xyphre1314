  /* ================= Sharpen v3 LIGHT validator PROTOTYPE (scratch only, spliced into a copy of core.js) =================
     Hard safety only: facts, numbers and names; negations; hedges; forecasts; claim words; banned and never-say words; obvious
     breakage. No vocabulary allowlist, no style checks. Claude's own judgement decides everything else. */
  const V3 = { opts: { thinkAll: false, quant: true, pointer: true, tone: true, length: true } };
  const v3lc = z => lcw(z);
  /* tokens with positions; a contraction stays one token ("don't", "it's") */
  const v3toks = z => [...lcw(z).matchAll(/[\p{L}\p{N}$%@#~][\p{L}\p{N}$%@#'.,~-]*/gu)].map(m => ({ w: m[0].replace(/[.,'-]+$/, ''), i: m.index }));
  const V3_STOP = new Set(('a an the and but or so of to in on at for from with by as is are was were be been being am it its this that these those there here ' +
    'i me my we us our you your they them their he him his she her do does did have has had will would can could should just really even ever actually quite very too ' +
    'also still then than if when what who which how why about up out into over all any some more most much many such own same other one ones thing things way lot').split(' '));
  const v3content = z => v3toks(z).map(t => t.w).filter(w => w.length > 2 && !V3_STOP.has(w) && /\p{L}/u.test(w));
  /* a clause of the draft "survives" when at least half its content words are in the line (by stem) */
  const v3stems = z => new Set(v3content(z).map(slStemC));
  const v3clauses = z => String(z).split(/(?<=[.!?;:])\s+|,\s+(?=(?:and|but|so|because|which|while|though|although|yet|or)\b)|\s+(?=(?:but|because|although|though|whereas)\s)|—|–|\s-\s/i).filter(c => c && c.trim());
  const v3survives = (clause, LS) => { const c = v3content(clause); if (!c.length) return false; return c.filter(w => LS.has(slStemC(w))).length / c.length >= 0.5; };

  /* ---- 1. negations, by scope: a negated word that survives stays negated, and no negation is added ---- */
  V3.NEG = /^(?:not|never|no|nobody|nothing|none|neither|nor|cannot|without|nowhere|noone)$|n['’]t$/;
  V3.NSKIP = new Set('a an the be been being is are was were that this it its to really just even ever actually quite very so too at all anymore yet always one any'.split(' '));
  V3.RESTRICT = new Set('just only simply merely always necessarily all every entirely completely quite exactly'.split(' '));
  function v3NegOK(line, draft) {
    const D = v3toks(draft), L = v3toks(line), isNeg = w => V3.NEG.test(w), stem = slStemC;
    const lineNegHeads = new Set(); L.forEach((t, j) => { if (!isNeg(t.w)) return; for (let k = j + 1; k < Math.min(L.length, j + 6); k++) { if (isNeg(L[k].w)) break; lineNegHeads.add(stem(L[k].w)); } });
    const lineStems = new Set(L.map(t => stem(t.w)));
    for (let i = 0; i < D.length; i++) {
      if (!isNeg(D[i].w)) continue;
      let j = i + 1; while (j < D.length && j < i + 5 && (V3.NSKIP.has(D[j].w) || V3.RESTRICT.has(D[j].w))) j++;
      const head = D[j] ? D[j].w : '';
      if (!head || isNeg(head)) continue;
      if (!lineStems.has(stem(head))) continue;                 /* the negated phrase was cut whole ("It's no secret that", "Not sure if…") */
      if (!lineNegHeads.has(stem(head))) return `negation of "${head}" lost`;
      /* "don't just write" ≠ "don't write"; "didn't really train" ≠ "didn't train" */
      const r = D[i + 1] && (V3.RESTRICT.has(D[i + 1].w) || (D[i + 1].w === 'really' && /n['’]t$|^not$|^never$/.test(D[i].w))) ? D[i + 1].w : '';
      if (r && !new RegExp(`(?:n['’]t|\\bnot|\\bnever|\\bno)\\s+(?:[\\w'’]+\\s+){0,2}${r}\\b`, 'i').test(lcw(line))) return `"${D[i].w} ${r}" lost`;
    }
    if (negsOf(line) > negsOf(draft)) return 'negation added';
    return '';
  }

  /* ---- 2. hedges: a hedge stays while its clause does; "I think" stays on any claim (opts.thinkAll) or on calls and plans ---- */
  V3.HEDGE = /\b(?:probably|maybe|perhaps|possibly|likely|unlikely|might|arguably|apparently|presumably|supposedly|i['’]d (?:say|argue|guess|bet)|i suspect|i guess|i doubt|seems?|seemed|could|imo|imho|nfa)\b|\bmay(?! \d)\b/gi;
  V3.STANCE = /\b(?:i|we)\s+(?:(?:really|honestly|genuinely|truly|personally|do|still|kind of|kinda)\s+)*(?:think|believe|reckon|feel like|bet)\b|\bin my (?:humble )?opinion\b/gi;
  function v3HedgeOK(line, draft, body, st) {
    const LS = v3stems(line), L = lcw(line), cl = v3clauses(draft);
    const need = {}, have = {};
    for (const c of cl) { if (!v3survives(c, LS)) continue; (c.match(V3.HEDGE) || []).forEach(h => { const k = lcw(h).replace(/['’]/g, "'"); need[k] = (need[k] || 0) + 1; }); }
    (line.match(V3.HEDGE) || []).forEach(h => { const k = lcw(h).replace(/['’]/g, "'"); have[k] = (have[k] || 0) + 1; });
    const miss = Object.keys(need).find(k => (have[k] || 0) < need[k]); if (miss) return `hedge "${miss}" lost`;
    /* "I really think that" → "I think" is fine; "I think" → nothing is not */
    const stanceN = z => (String(z).match(V3.STANCE) || []).length;
    let needS = 0; for (const c of cl) if (v3survives(c, LS) && (V3.opts.thinkAll || isCall(body) || rx(ST_PLAN.source, 'i').test(c))) needS += stanceN(c);
    /* a stance phrase may go when its clause keeps a modal hedge ("I think it might be…" → "It might be…") */
    if (stanceN(line) < needS) { let needS2 = 0; for (const c of cl) if (v3survives(c, LS) && (V3.opts.thinkAll || isCall(body) || rx(ST_PLAN.source, 'i').test(c)) && !(c.match(V3.HEDGE) || []).some(h => L.includes(lcw(h)))) needS2 += stanceN(c); if (stanceN(line) < needS2) return 'hedge "I think" lost'; }
    /* the engine's own stance list on calls, plans and forecasts, compared on its core */
    const core = w => lcw(slUnC(w)).replace(/\b(?:really|honestly|genuinely|truly|actually|personally|just|do|that)\b\s*/g, '').replace(/\s+/g, ' ').trim();
    for (const w of st) { const c = core(w); if (L.includes(lcw(w)) || (c && lcw(slUnC(line)).includes(c))) continue;
      if (/^(?:kind of|sort of|kinda|sorta|a bit|a little)$/i.test(w)) continue;      /* degree words: checked by v3DegreeOK */
      return `stance "${w}" lost`; }
    return '';
  }
  /* "kind of okay", "pretty impressed", "a little nervous": the degree stays with its word */
  V3.FEELW = String.raw`(?:okay|ok|fine|grateful|thankful|tired|exhausted|burn(?:ed|t) out|struggling|scared|afraid|nervous|anxious|proud|sorry|impressed|disappointed|worried|lonely|bored|sad|happy|upset|mad|angry|frustrated|confused|overwhelmed|embarrass(?:ed|ing)|regret(?:s|ted|ting)?|hate|love|miss|appreciate|ashamed|jealous|stressed|relieved|shaking|heartbroken|humbled|honou?red|glad|thrilled|excited|terrified|emotional|lost|numb|torn|conflicted|guilty|homesick)`;
  V3.DEG = new RegExp(String.raw`\b(kind of|sort of|kinda|sorta|a bit|a little|pretty|somewhat|slightly)\s+(?:(?:still|just)\s+)?(${V3.FEELW})\b`, 'giu');
  V3.DSKIP = new Set('just really like the a an of been being much more less sure'.split(' '));
  function v3DegreeOK(line, draft, marks) {
    const L = lcw(line), LW = new Set(v3toks(line).map(t => t.w));
    for (const m of String(draft).matchAll(V3.DEG)) {
      const w = lcw(m[2]); if (V3.DSKIP.has(w) || V3_STOP.has(w)) continue;
      if (marks.some(r => /^(?:announce|throat)$/.test(r[3]) && m.index >= r[0] && m.index < r[1])) continue;
      if (!LW.has(w)) continue;
      const q = lcw(m[1]).replace(/^kinda$/, 'kind of').replace(/^sorta$/, 'sort of');
      if (!new RegExp(`\\b(?:${q.replace(' ', '\\s+')}|${q === 'kind of' ? 'kinda' : q === 'sort of' ? 'sorta' : q})\\s+(?:\\w+\\s+)?${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(L)) return `degree "${m[0]}" lost`;
    }
    return '';
  }

  /* ---- 3. forecasts: the future stays future and nothing becomes a promise ---- */
  V3.FUT = /\b(?:will|won['’]t|shall)\b|\bgonna\b(?! (?:lie|be honest))|['’]ll\b|\bgoing to(?= (?!(?:the|a|an|my|your|our|their|his|her|this|that|bed|work|school|church|college|jail|court|sleep|hell|war|be honest|lie)\b)[a-z])/gi;
  /* "I'm going to talk about…" points at the post; it is not a forecast */
  V3.META_FUT = /\b(?:i['’]m|i am|we['’]re|we are|i['’]ll|we['’]ll|i will|we will|gonna)\s+(?:going to\s+)?(?:be\s+)?(?:talk(?:ing)?|explain(?:ing)?|shar(?:e|ing)|show(?:ing)?|break(?:ing)? (?:it )?down|walk(?:ing)? (?:you )?through|tell(?:ing)? you|cover(?:ing)?|go(?:ing)? (?:over|through)|div(?:e|ing) into|unpack(?:ing)?|answer(?:ing)?|writ(?:e|ing) about)\b/gi;
  function v3FutureOK(line0, draft0) {
    const draft = String(draft0).replace(new RegExp(V3.META_FUT.source, 'gi'), ' '), line = String(line0).replace(new RegExp(V3.META_FUT.source, 'gi'), ' ');
    const LS = v3stems(line); let need = 0; for (const c of v3clauses(draft)) if (v3survives(c, LS)) need += cnt(c, new RegExp(V3.FUT.source, 'gi'));
    const have = cnt(line, new RegExp(V3.FUT.source, 'gi')), all = cnt(draft, new RegExp(V3.FUT.source, 'gi'));
    if (have < need) return 'future lost';
    if (have > all) return 'future added';
    return '';
  }

  /* ---- 4. numbers, names, links: verbatim, none lost, none added; a number keeps its qualifier ---- */
  V3.NUMW = /\b(?:two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion|dozen|half|halved|double[ds]?|doubling|triple[ds]?|tripling|quadrupled?|twice|thrice|x\d+|\d+x)\b/gi;
  V3.NQUAL = /\b(about|around|roughly|approximately|almost|nearly|over|under|only|just|like|at least|at most|more than|less than|up to|barely|exactly)\s+(~?[$€£]?\d[\d,.]*\s?[kKmMbB%x]?|(?:two|three|four|five|six|seven|eight|nine|ten|twenty|hundred|a hundred|a thousand|a million|a dozen|half)\b)|~\s?\$?\d[\d,.]*/gi;
  function v3NumOK(line, draft, facts) {
    const TIMEN = /^(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|january|february|march|april|june|july|august|september|october|november|december)$/i;
    const lostF = facts.find(f => !slHas(line, f.v) && !TIMEN.test(f.v)); if (lostF) return `fact "${lostF.v}" lost`;
    const dl = lcw(draft);
    const added = slFacts(line, softMarks(line)).find(f => !slHas(draft, f.v) && !dl.includes(lcw(f.v))); if (added) return `fact "${added.v}" added`;
    const dd = new Set(slDigitRuns(draft)); const nd = slDigitRuns(line).find(x => !dd.has(x)); if (nd) return `number "${nd}" added`;
    if (slMore(line, draft, V3.NUMW)) return 'number word added';
    { const LS = v3stems(line); let o = ''; for (const c of v3clauses(draft)) if (v3survives(c, LS)) o += ' ' + c; if (slMore(o, line, V3.NUMW) && slMore(o, line.replace(/\b\d+\b/g, ''), V3.NUMW)) return 'number word lost'; }
    for (const m of String(draft).matchAll(V3.NQUAL)) { const num = (m[2] || m[0].replace(/^~\s?/, '')).trim(); if (!lcw(line).includes(lcw(num))) continue; const q = m[1] ? lcw(m[1]) : '~';
      if (!new RegExp(`(?:${q.replace(/[.*+?^${}()|[\]\\~]/g, '\\$&').replace(' ', '\\s+')})\\s?${lcw(num).replace(/[.*+?^${}()|[\]\\~]/g, '\\$&')}`, 'i').test(lcw(line))) return `qualifier "${m[0]}" lost`; }
    if (!slApxOK(line, draft)) return 'approximator lost';
    return '';
  }

  /* ---- 5. claim words: no superlative, absolute, multiplier or hype word added; a quantifier stays with its noun ---- */
  V3.HYPE = /\b(?:huge|big|major|massive|insane|incredible|amazing|awesome|epic|legendary|guaranteed|unbeatable|game[- ]?changing|revolutionary|world[- ]class|best[- ]in[- ]class|ever|nailed|crushed|smashed|aced|killed it|skyrocket\w*|soar\w*|explod\w*|dominat\w*|blew up|went viral|viral|perfect(?:ly|ed)?|flawless\w*)\b/gi;
  /* restrictors change what a claim covers: "I want to build" is not "I just want to build" */
  V3.RESTR_ADD = /\b(?:just|only|even|still|already|finally|merely|simply)\b/gi;
  V3.QUANT = /\b(most|all|every|only|almost|nearly|always|usually|often|sometimes|rarely|many|few|several)\s+(?:of\s+(?:the|my|our|your|their|these|those)\s+)?([\p{L}'’-]+)/giu;
  function v3ClaimOK(line, draft) {
    const dsw = String(draft).replace(/\bthe (?:vast |overwhelming )?majority of\b/gi, 'most').replace(/\bthe (?:vast |overwhelming )?majority\b/gi, 'most');
    const more = re => slMore(line, draft, re) && slMore(line, dsw, re);
    if (more(SL_COMPW)) return 'claim added'; if (slMore(line, draft, V3.RESTR_ADD)) return 'restrictor added'; if (more(V3.HYPE) && !/game[- ]?changer|life[- ]?changer/i.test(draft)) return 'hype added';
    if (V3.opts.quant) { const LW = new Set(v3toks(line).map(t => slStemC(t.w))), L = lcw(line);
      for (const m of String(dsw).matchAll(V3.QUANT)) { const q = lcw(m[1]), w = lcw(m[2]); if (V3_STOP.has(w) || /^(?:down|up|out|over|in|on|off|around|about|through|along|back|together|at|by|for|to|into|set|good|right|gone|done|ready|day|week|year|time|night)$/.test(w)) continue; if (!LW.has(slStemC(w))) continue;
        if (!new RegExp(`\\b${q}\\b`, 'i').test(L)) return `quantifier "${m[1]} ${m[2]}" lost`; } }
    return '';
  }

  /* ---- 6. obvious breakage only ---- */
  V3.BREAK = [
    [/^\P{L}{0,2}[,;:.!?)\]—–-]/u, 'dangling opener'],
    [/\b([a-z]{2,})\s+\1\b/gi, 'doubled word'],
    [/([,;:!?])\1|(?<!\.)\.\.(?!\.)|[,;:][.!?]|[.!?][,;:]/g, 'doubled punctuation'],
    [/\b(?:i|we|you|they|he|she|it)\s*,\s+(?:think|believe|am|was|were|have|had|do|did|will|would|can|could|really|just|know|feel|want|need)\b/gi, 'stray comma'],
    [/(?:^|[.!?]\s+)(?:and|but|or|because|so)\s*[.!?]/gi, 'dangling connector'],
    [/\b(?:and|but|or|because|the|a|an|to|of|with|for|my|our|your|their)\s*[.!?:]?\s*$/gi, 'dangling end'],
  ];
  function v3BrokenOK(line, draft) {
    for (const [re, k] of V3.BREAK) if (cnt(line, new RegExp(re.source, gFlags(re.flags))) > cnt(draft, new RegExp(re.source, gFlags(re.flags)))) return k;
    if (!slEmojiOK(line, draft)) return 'split emoji';
    const bal = z => (String(z).match(/\(/g) || []).length - (String(z).match(/\)/g) || []).length; if (bal(line) !== 0 && bal(draft) === 0) return 'unbalanced';
    const qn = z => (String(z).match(/["“”]/g) || []).length % 2; if (qn(line) && !qn(draft)) return 'unbalanced';
    return '';
  }

  /* ---- 7. tone that flips meaning, and the thread pointer ---- */
  V3.TONE = /(?<![\p{L}\p{N}])(?:lol|lmao|lmfao|haha+|jk|\/s)(?![\p{L}\p{N}])/giu;
  function v3ToneOK(line, draft) { return cnt(line, new RegExp(V3.TONE.source, 'giu')) < cnt(draft, new RegExp(V3.TONE.source, 'giu')) ? 'tone' : ''; }
  V3.PTR = /\bhere(?:['’]s| is)\s+(?:exactly\s+)?(?:why|how|what|my reasoning|the story|the breakdown|everything)\b|\bthread\b|[🧵👇⬇↓]|\(\s*\d+\/|\b\d{1,2}\/(?:\d{1,2}|n)?\s*$/iu;
  V3.PTR_LINE = /:\s*$|\bhere(?:['’]s| is| are)\b|[🧵👇⬇↓]|\bthread\b|\(\s*\d+\//iu;
  function v3PointerOK(line, draft, rest) { return V3.PTR.test(draft) && !V3.PTR.test(line) && !V3.PTR_LINE.test(line) ? 'pointer lost' : ''; }

  /* an opinion frame keeps its noun: "A few thoughts on the Fed decision" is not "The Fed decision" */
  V3.FRAMEN = /\b(thoughts|take|opinions?|lessons|takeaways|reasons|notes|predictions|questions)\s+(?:on|about|from|for)\s+(?:the\s+|my\s+|our\s+|this\s+|today['’]s\s+)?([\p{L}$][\p{L}\p{N}'’-]+)/iu;
  function v3FrameOK(line, draft) { const m = V3.FRAMEN.exec(draft); if (!m) return ''; const L = lcw(line); return L.includes(lcw(m[2])) && !new RegExp(`\\b${m[1].replace(/s$/, '')}`, 'i').test(L) ? `frame "${m[1]}" lost` : ''; }
  /* "it's something nobody teaches you" is not "Nobody teaches you": the verb kept its object */
  V3.OBJ = /\b(?:something|what|the thing|stuff|things|a lesson|one thing)\s+(?:that\s+)?((?:nobody|no one|everyone|people|most people|they|we|i|you)\s+(?:\w+\s+){0,2}?\w+\s+(?:you|us|me|them))\b/i;
  function v3ObjectOK(line, draft) { const m = V3.OBJ.exec(draft); if (!m) return ''; const tail = lcw(m[1]), L = lcw(line), i = L.indexOf(tail); if (i < 0) return ''; return /\b(?:something|what|thing|stuff|things|lesson|it|that|this)\s+(?:that\s+)?$/.test(L.slice(0, i)) || /^\s*(?:that|this|it|these|those|about|how|why|what|when|the|a|any)\b/.test(L.slice(i + tail.length)) ? '' : 'object lost'; }
  /* cutting "I can tell you that" after "after coaching 400 parents," leaves the modifier dangling on the wrong subject */
  V3.DANGLE = /\b(after|since|by|from|while|when|before)\s+(\w+ing)\b([^,.!?;:]{0,90}?),?\s+(?:i|we)\s+(?:can|could|will|['’]ll|have|['’]ve|am|['’]m)?\s*(?:honestly |confidently |safely |definitely )?(?:tell you|say|promise you|promise|guarantee|assure you)(?: that)?\s+/i;
  function v3DangleOK(line, draft) { const m = V3.DANGLE.exec(draft); if (!m) return ''; const head = lcw(`${m[1]} ${m[2]}${m[3]}`).trim(), L = lcw(line), i = L.indexOf(head); if (i < 0) return ''; const after = L.slice(i + head.length).replace(/^[,\s]+/, ''); return /^(?:i|we|i'm|i've|we've|we're|my|our|i'd|i'll)\b/.test(after) ? '' : 'dangling'; }
  function fromClaudeV3(text, data, opts = {}) {
    const trace = opts.trace && typeof opts.trace === 'object' ? opts.trace : {};
    const no = (k, all) => { trace.reject = k; if (all) trace.rejects = all; return null; };
    try {
      if (!data || typeof data !== 'object') return no('shape');
      let vers = Array.isArray(data.versions) ? data.versions : typeof data.line === 'string' ? [{ line: data.line, why: data.why }] : null;
      if (!vers) return no('shape');
      vers = vers.filter(v => v && typeof v === 'object' && typeof v.line === 'string').slice(0, 3); if (!vers.length) return no('shape');
      const keep = (Array.isArray(opts.keep) ? opts.keep : []).filter(w => typeof w === 'string' && w.trim());
      const never = (Array.isArray(opts.never) ? opts.never : []).filter(w => typeof w === 'string' && w.trim()).map(w => lcw(w.trim()));
      const src = String(text == null ? '' : text).replace(/^\s+/, ''), nl = src.indexOf('\n');
      const draft = (nl < 0 ? src : src.slice(0, nl)).replace(/\s+$/, ''), rest = nl < 0 ? '' : src.slice(nl + 1);
      const norm = z => String(z).replace(/\s+/g, ' ').trim();
      const vm = draft.match(HK_VOICE), body = vm ? draft.slice(vm[0].length) : draft;
      const marks = softMarks(draft, keep), facts = slFacts(draft, marks).filter(f => !(f.link && false)), kept = facts.filter(f => !f.link && slKeepW(f.v)).map(f => f.v);
      const st = stanceKeep(body).filter(w => !keep.some(k => k.toLowerCase() === w.toLowerCase()));
      const longOf = l => xLength(rest.trim() ? `${l}\n${rest}` : l) > 280;
      const nvRe = never.map(w => new RegExp(`(?<![\\p{L}\\p{N}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\p{L}\\p{N}])`, 'giu'));
      const aiN = z => cnt(z, rx(SL_AIW.source, 'giu')) + cnt(z, rx(SL_LEVV.source, 'gi')) + nvRe.reduce((n, re) => n + cnt(lcw(z), re), 0);
      const R = { state: 'clean', draft, line: draft, rest, cut: [], marks: [], move: '', say: '', why: '', kept, alts: [], long: longOf(draft), note: '', source: 'claude' };
      const asUnchanged = why => ({ ...R, state: slSkip(draft) ? 'thin' : 'clean', say: 'Nothing to cut', why: slAIWhy(why, draft, draft, { cut: [] }, z => aiN(z) > 0) || HK_WHY_SL.sharp });
      const check = (line0, why) => {
        let line = String(line0).trim();
        if (/^["“'‘]/.test(line) && /["”'’]$/.test(line) && !/^["“'‘]/.test(draft)) line = line.slice(1, -1).trim();
        if (!line || /[\r\n]/.test(line)) return ['empty'];
        if ([...line].length > SHARPEN_AI_MAX) return ['longer'];
        if (V3.opts.length && [...line].length > Math.max([...draft].length * 1.25, [...draft].length + 25)) return ['longer'];
        if (norm(line) === norm(draft)) return ['same', 'unchanged'];
        line = line.replace(new RegExp(`(${SL_URL.source})\\.$`, 'iu'), '$1');
        for (const f of [() => v3NumOK(line, draft, facts), () => v3NegOK(line, draft), () => v3HedgeOK(line, draft, body, st), () => v3DegreeOK(line, draft, marks), () => v3FutureOK(line, draft), () => v3ClaimOK(line, draft),
          () => (aiN(line) > aiN(draft) ? 'banned word' : ''), () => (keep.every(k => !lcw(draft).includes(lcw(k)) || lcw(line).includes(lcw(k))) ? '' : 'put-back'), () => v3BrokenOK(line, draft),
          () => (V3.opts.tone ? v3ToneOK(line, draft) : ''), () => (V3.opts.pointer ? v3PointerOK(line, draft, rest) : ''), () => v3FrameOK(line, draft), () => v3ObjectOK(line, draft), () => v3DangleOK(line, draft)]) { const r = f(); if (r) return [r]; }
        if (slSkip(draft)) return ['thin'];
        const cand = slReordered(draft, line) ? SL_AI_MOVES : SL_AI_CUT, e1 = slExplain(draft, line, cand, marks), mv = e1.moves.length ? e1.moves : ['tight'], E = slExplain(draft, line, mv, marks);
        return [null, { ...R, state: 'sharp', line, cut: E.cut, marks, move: E.move, say: E.say, why: slAIWhy(why, draft, line, E, z => aiN(z) > 0) || E.why, long: longOf(line), moves: E.moves.length ? E.moves : ['tight'],
          score: { from: hookScore(rest ? `${draft}\n${rest}` : draft).score, to: hookScore(rest ? `${line}\n${rest}` : line).score } }];
      };
      const reasons = [], ok = [];
      for (let i = 0; i < vers.length; i++) {
        const [why, res, flag] = check(vers[i].line, typeof vers[i].why === 'string' ? vers[i].why : '');
        if (why === 'same') { reasons.push('unchanged'); if (i === 0 || data.unchanged) { trace.rejects = reasons; trace.pick = i; return { ...asUnchanged(vers[i].why), pick: i }; } continue; }
        reasons.push(why || 'ok'); if (res && !ok.some(o => o.res.line === res.line)) ok.push({ i, res });
        if (res && ok.length === 1) { /* the first passing version ships; later ones are only alts */ }
      }
      trace.rejects = reasons;
      if (!ok.length) return no(reasons[0], reasons);
      trace.pick = ok[0].i;
      return { ...ok[0].res, alts: ok.slice(1).map(o => ({ line: o.res.line, why: o.res.why, moves: o.res.moves })), pick: ok[0].i };
    } catch (e) { return no('error: ' + (e && e.message)); }
  }
  V3.fns = { v3NegOK, v3HedgeOK, v3DegreeOK, v3FutureOK, v3NumOK, v3ClaimOK, v3BrokenOK, v3ToneOK, v3PointerOK, v3clauses, v3survives, v3stems };
