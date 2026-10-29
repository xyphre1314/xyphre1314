# r86 engine pass 2 (continued): first-contact rounds

Each round is 80 new lines (round-X.json), run through HWCore.sharpenLine and graded by hand BEFORE any code change
(round-X.first.json = outputs, round-X.graded.json = grades + notes). h = a good creator would post it as is;
o = better, with a soft spot; m = unchanged when it should change, worse, wrong, awkward, a fact lost or meaning changed.
"expl false" = rows whose why/say/cut is not true for the edit (counted separately from the line grade).

## Baseline before round A (snapshot core.js, no change)
- Juror's 159 (changed rows re-graded by hand): 150 h / 9 o / 0 m = 94.3% h.
- Held-out fixture (132): 129 h / 3 o / 0 m = 97.7% h. sharpen-eval (48): 44 h / 4 o = 91.7% h.

## Round A — first contact (snapshot core.js)
- 72 h / 4 o / 4 m = **90.0% h**. Explanations false on 20 rows.
- m: #29 lost "straight" from "200 weeks straight" (meaning) · #30 forced Q/A "Today's newsletter? It's a love letter…" (awkward)
  · #42 "I'd like to take this opportunity to thank…" left (should change) · #72 "Gonna be honest with you guys," left, why says nothing soft (should change, why false).
- o: #9 "genuinely" left · #25 "For anyone following along:" label left · #37 "B2B companies: understand that…" · #66 "Overrated for most apps: dark mode." (why also false).
- Explanation misses: structural words ("and" in a split, "is/the" in a Q/A, "because", "Here are") struck in `cut` but not counted in the receipt (16 rows); receipt counts that undercount tight cuts (#36, #37); #66 why quotes the wrong end word.

## Fixes after round A (root causes, all patterns)
- Receipt = strikes: `cut` holds only the struck fluff; a reshape's small words (and/is/the/Here are) and plain-word swaps are named by the move, not struck. Unmarked dropped phrases are fluff of kind `extra`.
- Meaning guard: qualifiers about a number/time ("straight", "almost", "only", "every", "about 3") may not be dropped by a reshape.
- Questions that only name a topic ("Today's newsletter? It's…", "My first ebook? Out now.") are blocked; superlative/gap questions stay.
- Frames: "take this opportunity to thank", "gonna be honest with you guys", "Just a quick update for anyone following along", "excited to share it with you all" (whole), "I'm proud to say" after an intro, "It's been a while since I posted, but", "In this thread I'm going to explain", "been thinking about why/how/what" (line start only); a run-up right after a leading soft word is marked too.
- "just" in a progressive ("are just overcomplicating") or before a state word ("just obsessed") is filler; "overX… way too much" is redundant.
- Every sentence a version makes needs a verb (or is a question/header/stat/number-led/≤2-word tag); a sentence opening "It with…", a second colon, "!." are broken. Header colons only for short headers the draft announced.
- Thin = gibberish only; ≤2 real words = complete post ("Short and complete. Nothing to cut.").
- Why: quotes a clause the line opens on (never a fragment), names every cut (≤3, exact text) or none; plain variants otherwise; put-back why "You kept “X”…".
- Kept: numbers carry their unit ("90 days", "1,000 paying users"); public acronyms (CPI, ETF, AI, SaaS, B2B, DCA…), bare 0/1 and orphan ordinals are not "yours".
- A line that opens on a @handle/#tag/$ticker keeps it first; a number in the first three words stays put.
- Fallback when a run-up can't go: cut only the in-sentence fluff.

## Round B — first contact (after round-A fixes, before any round-B change)
- 68 h / 4 o / 8 m = **85.0% h**. Explanations false on 1 row.
- m (8): #0 "$ARB unlock" (a noun) swapped to "open up" · #7 "Here's my honest take on memecoins:" cut took the topic · #14 "what if…" question given a header colon · #30 forced Q/A on a quantifier ("Most newsletter writers? Undercharging…") · #36 "I'd like to take a moment to thank everyone…" left · #39 "We're thrilled to welcome @dana_writes…" left, why false · #43 "Personally" left in an answer · #58 a colon after a bare link.
- o (4): #9 "all just vibes" lost its "just" · #22 fragment answer · #28 "This week's issue is about" left · #35 "Weekly reminder that" left.
- Reading: the round-A fixes held (no receipt/strike disagreement left), but round B found new classes; not yet generalising.

## Fixes after round B
- "$TICKER unlock" is a noun (no never-say swap); "Here's my honest take on X:" keeps X; "what if…" stays a question; quantifier questions ("Most newsletter writers?") blocked; "Weekly reminder that" is a label; "thank everyone who…" → "Thank you to everyone who…"; "welcome @x" is a verb; no header colon after a bare link.
- Marks are cut exactly as marked (a cut word can't shield the next, "Personally I think" goes whole); a put-back restores only that word and the run-up after it stays cuttable (uiux-18); comparatives keep their clause ("more than I can say here", web-15); "is it all just vibes" keeps its "just".
- First line's own "i"/"I" settles the case; passive why quotes "was redesigned by" whole; ask+split says "Asked, then answered" once.

## Round C — first contact (after round-B fixes)
- 70 h / 4 o / 6 m = **87.5% h**. Explanations false on 5 rows.
- m: #3 split dropped the subject ("Then fully recovers by Friday.") · #12 already-sharp parallel line reshaped ("engagement: up 40%. sleep went down 100%.") · #37 "As someone who…, I can confidently say that" left, why false · #75 "I don't usually post personal stuff but" left, why false · #77 sarcasm "Very original." → "Original." · #78 gibberish "blorp snazzle wib wob totally the of" not thin.
- o: #0 stance cut on a "$DOGE is about to…" call · #29 "excited to share our new newsletter with you all" left as unsure (true why) · #41 pure CTA "Nothing soft to cut" · #76 long line keeps "I've been going back and forth…".
- Expl: Kept "Series" (not "Series A"), "25 minute" (lost "sub-").

## Fixes after round C
- "is about to" counts as a price call (the stance stays); a split that drops its subject ("Then fully recovers…") is a fragment; no stat-colon reshape on a line of several sentences.
- "As someone who has X, I can confidently say that Y" → "I've X. Y."; "it's important to be transparent with you" is never turned into an order.
- Disclaimers "I don't usually post personal stuff but", "I've been going back and forth on whether to post this, but"; a pure "I would love to hear your thoughts…" is bait.
- Sarcasm: "Very original." / "Love that…" + a quote; word salad trailing off on two small words is thin.
- Kept: "Series A", "June 1st", "sub-25 minute"; a run-up a reshape dropped is still struck and counted as what it is.
- "-ing" adjectives ("just boring") aren't a progressive; contrast whys quote a clause.

## Round D — first contact (after round-C fixes; 81 lines, one extra meaning line written before the run)
- 70 h / 4 o / 7 m = **86.4% h**. Explanations false on 3 rows.
- m: #2 "Just wanted to remind everyone that" left (why false) · #6 colon after a youtu.be link + Kept from inside the link (unknown TLD) · #14 "i'll just check one email" lost the joke's "just" · #22 "Can I be real for a second?" → "For a second?…" · #41 "how important it’s to reply" + frame left · #76 "What it means to build something meaningful." fragment · #78 keyboard mash called a complete post.
- o: #15 "random thought but" left · #27 "The truth about … that nobody talks about." fragment · #34 "Just a quick thank you to…" left · #66 header colon after a comma tail.

## Fixes after round D
- "Just wanted to remind everyone that", "Can I be real for a second?", "random thought but", "Just a quick thank you to", "I want to emphasize how important it is to X" → "X."
- "i'll just …" (the minimizer is the joke) is kept; "how important it is to" never contracts; "Here's the truth about X that nobody talks about" keeps "Here's" unless a colon follows.
- "What it means to build…" alone is a fragment, and the "been thinking about what…" cut only fires when the clause runs to the end of the line.
- More link endings (youtu.be, .tech…) are atoms; a link at the end never takes a full stop; header colons never follow a comma tail; keyboard runs ("qwe rty") are gibberish; a reshape that adds a sentence says "Split it into two beats"; the plain why never claims fewer words when there aren't.

## Round E — first contact (after round-D fixes; 81 lines)
- 75 h / 2 o / 4 m = **92.6% h**, but 2 grammar misses, so it does not count toward "done". Explanations false on 1 row.
- m: #9 "no cap" unknown → "…? no cap this." (grammar) · #26 "Let me tell you about them." → "About them." (grammar) · #36 "We're excited to be partnering with Stripe…" left · #72 "I've been meaning to post this for a while but" left, why false.
- o: #0 "So" left after "1/" · #3 stance cut on a cycle call.

## Fixes after round E
- "no cap" is "no lie"; an answer that is only "this/that" is blocked; "Let me tell you about them." is not a run-up; "I've been meaning to post this for a while but" is a disclaimer.
- "We're excited to be partnering…" → "We're partnering…" (only "excited to be" goes when a subject is there); a thread number "1/" is format, so the warm-up after it goes; cycle calls ("in the boring middle of the cycle") keep the stance; "6 year old" stays whole in Kept.

## Round F — first contact (after round-E fixes; 81 lines) — the sixth and last round
- 75 h / 5 o / 1 m = **92.6% h**. 0 fact or grammar misses; 1 miss with a false why (#72 "I don't really know how to say this but" left, why says it is meaning).
- o: #10 "ok but why…" left (unsure) · #16 wry "i guess" cut · #26 surprise "actually" cut · #42 "It's important that…" frame left · #63 "excited to share NP with you all" (unsure, true why).

## Verdict on the bar
- First contact by round: A 90.0% · B 85.0% · C 87.5% · D 86.4% · E 92.6% · F 92.6%.
- Rounds E and F are both ≥ 92% h on first contact, but neither is clean: E had 2 grammar misses ("…? no cap this.", "About them."), F had 1 frame left with a false why. So the "two consecutive rounds, 0 misses, every explanation true" bar was NOT met within the 6 rounds. Stopping here as the brief says.

## Fixes after round F (not first contact)
- "I don't really know how to say this but" is a disclaimer; "ok but why…" goes as one opener; "It's really important that your posts sound…" → "Your posts should sound…"; a split a reshape already explains isn't named twice; "how i went from 0 to 5k…" can be said flat, "how ghostwriters should price…" can't.

## Regression after all fixes (every changed row re-graded by hand)
- Juror's 159: 151 h / 8 o / 0 m = **95.0% h**.
- Original held-out fixture (132): 129 h / 3 o / 0 m = 97.7% h. Whole fixture now 773 rows: 752 h / 21 o / 0 m = 97.3% h.
- sharpen-eval (48): 44 h / 4 o / 0 m = 91.7% h (unchanged from baseline).
- Rounds as they stand now (not first contact): A 98.8% · B 97.5% · C 96.3% · D 98.8% · E 100% · F 96.3%.
- Invariants over 833 distinct lines (fixture, 159, rounds, probes): receipt = strikes, no moved word struck, a why names all its cuts or none, no quote ending on a small word, Kept never a public acronym/0/"lowercase", why ≤ 140: 0 violations.

# Pass 4 (ENGINE4): rounds G–J, graded under the calibrated standard
Standard: h = a good creator would post it exactly as is, with no "it's fine but…". Each round is 80–81 new lines, half of them
needing work (layered run-ups, labels, hedges, buried numbers, over-280 posts), half already sharp. First-contact outputs
were recorded (round-X.first.json / .first.txt) and graded (round-X.graded.json) before any change for that round.

## Round G — first contact (after the hook-1…16 / marketing / uiux / web fixes; 80 lines, 40 need work)
- 66 h / 12 o / 2 m = **82.5% h** · needs-work **30/40 = 75.0%** · should-stay 36/40. Explanations false: 0.
- m: #29 "sunseting" (ing of "sunset") · #60 "Cold email still works. Lazy cold email doesn't." called thin (trailing full stops hid the verbs).
- o: "It's honestly kind of wild that…" (split made "wild" attach to the first fact) · "I've been thinking a lot lately about why…" · "…and I wanted to talk about how it's going" · "really happy" flattened · "Hardest ones to get?" · "Long story short," · leftover "The current market:" · over-280 with the run-up kept · 3 sharp lines reshaped (Q/A ×2, a split).
- Fixes: doubled consonants (sunsetting, committing…); thin never misses a verb behind a full stop; "It's (kind of) wild/crazy that" frame; "Why do X?" from "been thinking about why X, and it's because Y"; "…. Here's how it's going:"; a first-person feeling keeps its intensifier; no Q/A built on "ones"; "Long story short"; a crisp line (nothing soft, its own full stop) gets no Q/A or split; "Day 90", "Year 2" are one fact; the news leads on every candidate of an over-280 post, which also loses its run-up.

## Round H — first contact (after round-G fixes; 81 lines, 40 need work)
- 63 h / 16 o / 2 m = **77.8% h** · needs-work **22/40 = 55.0%** · should-stay 41/41. Explanations false: 3.
- m: #4 "Because I thought nobody would care." (a disclaimer cut took the clause's head) · #27 "I'll say it again: …. I've said this before." (the frame reordered behind the point).
- Explanations false: #7 one frame struck in pieces and the kept "I" struck · #24 quote "$HYPE looks" · #39 quote "We're 14 months".
- o: 16 frames the table didn't know: "I need to talk about something that's been bugging me:", "Just my two cents but", "Let me be clear:", "This is going to sound crazy but", "It turns out that", "What I've realized after 8 years… is that", "One thing I've noticed is that", "I know this is a hot take but", "So yeah,", "Thrilled to finally be able to share that", "Can't believe I'm saying this but", "Here's a thought:", "I want to be really transparent with you all about our numbers:", a mid-line "and I'm so happy to finally announce that", "I've personally read", a buried "the one that actually worked was X, which bumped conversions by 19%".
- Fixes: all of the above as frames (with "I almost didn't post this" kept when "because" follows); a sentence that opens on "Because/Although" with no main clause is a fragment; quotes never stop before "like", "in" (14 months in), "for" (asked for), "of" (80% of), a pronoun object, or "than"; "8 years of design work taught me this: …"; "X bumped conversions by 19%. It was the one thing that actually worked this quarter."; a disclaimer that holds a meaning word ("Maybe it's just me but") goes whole, and a call's own hedge is read outside it.

## Round I — first contact (after round-H fixes; 80 lines, 40 need work)
- 65 h / 13 o / 2 m = **81.3% h** · needs-work **26/40 = 65.0%** · should-stay 39/40. Explanations false: 0.
- m: #22 "basically zero customers" → "zero customers" (approximate became absolute) · #39 "Something that doesn't get discussed enough…, which is how lonely…" (fragment after the news moved up).
- o: "I just wanted to drop a quick note to say that", "I'm starting to think that", "genuinely so proud", "Not sure if anyone else feels this way but", "It's safe to say that", "I recently realized that", "Just thinking out loud here but", "I don't usually do this but… a quick win:", "Here are a few things that I wish I knew", "What I'm trying to say is that", "One of the things I love most about… is", "For those of you who have been asking, yes,", and a sharp line's "is just guessing" lost its "just".
- Fixes: all of those frames; "basically zero/never" is a qualifier; "just" before guessing/gambling/pretending (= merely) stays; "Things I wish I knew…", "My favorite part of X: Y", "Not enough people in X talk about Y"; "Something that…, which is…" is a fragment.

## Round J — first contact (after round-I fixes; 80 lines, 40 need work) — the fourth and last round
- 63 h / 14 o / 3 m = **78.8% h** · needs-work **23/40 = 57.5%** · should-stay 40/40. Explanations false: 1 (#36 quote "just expensive").
- m: #22 "There's one thing I've learned…? It's that…" (condQ on "If there's one thing") · #25 "Obviously but I've been…" (the NFA moved, its "obviously but" stayed) · #28 "The best founders aren't the solution." (notFlip took the "not" for the subject).
- o: "It's been a crazy year… but the biggest lesson by far is that", "I'm honestly kind of embarrassed to admit this", "One thing that… get wrong… is that", "I wanted to write a quick thread on", "Just a quick tip for anyone learning React:", "This is kind of a weird one but", "Not to get too personal on here but", "So we did a thing:", "Not sure why more people aren't talking about the fact that", "After spending… on it, I'm happy to say that" (unsure: the cut would dangle), "I've said it once and I'll say it a thousand times:", "I know it sounds counterintuitive but", "In my honest opinion", "I've been thinking a lot about burnout lately." kept in an over-280 post.
- Fixes: all except "Not sure why more people aren't talking about…" (every rewrite drops a negation, so the guard rejects it) and the burnout sentence (cutting it loses the topic).

## Verdict on the bar (ENGINE4)
- First contact, overall / needs-work: G 82.5% / 75.0% · H 77.8% / 55.0% · I 81.3% / 65.0% · J 78.8% / 57.5%.
- Bar: two consecutive rounds ≥ 92% overall and ≥ 85% on needs-work, 0 misses, every explanation true. **Not met** in the four rounds the brief allows. Should-stay lines are fine at first contact (156/161 h); the gap is the long tail of run-up frames on the needs-work half, plus one or two structural misses per round.
- After each round's fixes those rounds stand at G 98.8% · H 100% · I 100% · J 97.5% (not first contact).
