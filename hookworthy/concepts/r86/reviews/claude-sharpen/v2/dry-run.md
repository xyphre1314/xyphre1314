# Sharpen v2 dry run: 25 of v1's worst lines

Each row: the writer's draft, what v1 actually shipped (with the blind judges' grade and note), the versions v2's prompt should return (up to three; one when the line is already sharp), and what v2's validator does with each. Verdicts come from running the versions through the v2 validator prototype (`_work/v2proto-fn.js` spliced into a scratch copy of core.js; core.js itself was not touched). The versions are hand-written expectations of the prompt, not live model output; no API call was made.

Legend: **ships** = what the user sees (the first version that passes). `ok` = passes; anything else is the validator's reject reason. Grades: h = a pro would post it, o = okay but not pro, m = meaning changed.


## 1. `r4-65` (fitness)

**Draft:** I used to think that being fit meant spending two hours in the gym every single day, eating chicken and rice out of tupperware and basically giving up any kind of social life, but after coaching over 400 busy parents in the last 5 years I can honestly tell you that the people who get the best results are the ones who just do three 45 minute sessions a week and never miss.

**v1 shipped** (claude, graded **m**): I used to think that being fit meant spending two hours in the gym every single day, eating chicken and rice out of tupperware and basically giving up any kind of social life, but after coaching over 400 busy parents in the last 5 years, the people who get the best results are the ones who just do three 45 minute sessions a week and never miss.  
_Judge: Dangling modifier after 'after coaching'; still run-on._

**v2 returns**

| | line | why | validator |
|---|---|---|---|
| 1 | I used to think being fit meant two hours in the gym every single day, chicken and rice out of tupperware and giving up any kind of social life. But after coaching over 400 busy parents in the last 5 years, I can tell you that the people who get the best results just do three 45 minute sessions a week and never miss. | One run-on is two beats now, and “honestly” and “basically” went. “I can tell you” stays so the second half still has its subject. | ok |
| 2 | After coaching over 400 busy parents in the last 5 years, I can tell you that the people who get the best results just do three 45 minute sessions a week and never miss. I used to think being fit meant two hours in the gym every single day, chicken and rice out of tupperware and giving up any kind of social life. | The result leads: 400 parents and what works for them come first, the old belief second. | ok |
| 3 | I used to think that being fit meant spending two hours in the gym every single day, eating chicken and rice out of tupperware and giving up any kind of social life. But after coaching over 400 busy parents in the last 5 years, I can tell you that the people who get the best results are the ones who just do three 45 minute sessions a week and never miss. | The light edit: “basically” and “honestly” went and a full stop splits the run-on. Every word else is yours. | ok |

**Ships:** version 1. v1's validator on version 1: `ok`.

**What does it:** Prompt: run-on → beats, keep the subject when cutting "I can tell you that". Validator: new `dangling` check rejects v1's line (the "after coaching…, the people…" modifier).


## 2. `r4-121` (crypto)

**Draft:** A few quick thoughts on the Fed decision today:

**v1 shipped** (claude, graded **m**): The Fed decision today:  
_Judge: Lost 'thoughts' framing; reads like a news label._

**v2 returns** `unchanged: true`

| | line | why | validator |
|---|---|---|---|
| 1 | A few quick thoughts on the Fed decision today: | Already a clean header: “thoughts” says it’s your take, not the news, and the colon points at the thread. | ok (unchanged accepted) |

**Ships:** version 1 (unchanged). v1's validator on version 1: `ok`.

**What does it:** Prompt: "A few thoughts on…:" is a pointer and stays. Validator: `pointer` check needs a promise word ("thoughts") back, so v1's "The Fed decision today:" is rejected.


## 3. `r3-20` (crypto)

**Draft:** >$100k BTC by Q1? I'd say 60% chance. Here's my reasoning:

**v1 shipped** (claude, graded **m**): >$100k BTC by Q1? I'd say 60% chance.  
_Judge: Cut 'Here's my reasoning' lead-in to the thread_

**v2 returns** `unchanged: true`

| | line | why | validator |
|---|---|---|---|
| 1 | >$100k BTC by Q1? I'd say 60% chance. Here's my reasoning: | Already sharp: the question, your odds, then “Here's my reasoning:” pointing at the thread. Nothing pads it. | ok (unchanged accepted) |

**Ships:** version 1 (unchanged). v1's validator on version 1: `ok`.

**What does it:** Prompt: "Here's my reasoning:" is a pointer. Validator: `pointer lost` rejects v1's cut.


## 4. `r3-27` (lowercase)

**Draft:** lowkey the best investment i made this year was a $40 pair of running shoes

**v1 shipped** (claude, graded **m**): best investment i made this year? a $40 pair of running shoes  
_Judge: Dropped 'lowkey', the slang voice marker._

**v2 returns** `unchanged: true`

| | line | why | validator |
|---|---|---|---|
| 1 | lowkey the best investment i made this year was a $40 pair of running shoes | Already sharp: the payoff lands last, and “lowkey” is your voice, not filler. | ok (unchanged accepted) |

**Ships:** version 1 (unchanged). v1's validator on version 1: `ok`.

**What does it:** Prompt: slang stays (lowkey). Validator: `voice` check rejects any line that drops "lowkey".


## 5. `r4-106` (meaning)

**Draft:** Honestly is the most underrated trait in a co-founder.

**v1 shipped** (claude, graded **m**): Honestly is the most underrated trait in a co-founder.  
_Judge: Typo left: 'Honestly' should be 'Honesty'_

**v2 returns** `unchanged: true`

| | line | why | validator |
|---|---|---|---|
| 1 | Honestly is the most underrated trait in a co-founder. | Already sharp, but check the first word: you may mean Honesty, the trait, not the adverb. | ok (unchanged accepted) |

**Ships:** version 1 (unchanged). v1's validator on version 1: `ok`.

**What does it:** Prompt: don't fix spelling, flag a likely typo in why without quotes. Ships the line unchanged with a useful note (v1 shipped it silently). Still graded as a miss on the line itself; see validator-v2.md §9.


## 6. `r4-94` (meaning)

**Draft:** I was literally on fire. Not a metaphor — my kitchen caught fire.

**v1 shipped** (rules, graded **m**): I was on fire. Not a metaphor — my kitchen caught fire.  
_Judge: Cut 'literally', the word the gag hinges on_

**v2 returns** `unchanged: true`

| | line | why | validator |
|---|---|---|---|
| 1 | I was literally on fire. Not a metaphor — my kitchen caught fire. | Already sharp: “literally” stays because it is the joke, and “Not a metaphor” sets it up. | ok (unchanged accepted) |

**Ships:** version 1 (unchanged). v1's validator on version 1: `unchanged`.

**What does it:** v1's Claude answer was right; the validator rejected `unchanged` on the single "literally" mark and shipped the engine's cut (m). v2 accepts an unchanged line whose only marks are 1–2 single filler/intensifier words.


## 7. `r4-57` (ghostwriting)

**Draft:** Here's how we help B2B brands leverage LinkedIn to supercharge their pipeline and unlock seamless growth.

**v1 shipped** (rules, graded **o**): Here's how we help B2B brands use LinkedIn to speed up their pipeline and grow.  
_Judge: Jargon gone; 'speed up pipeline' drifts from 'supercharge'._

**v2 returns**

| | line | why | validator |
|---|---|---|---|
| 1 | Here's how we help B2B brands use LinkedIn to grow their pipeline. | The AI-speak went: “leverage” is “use” and “supercharge” and “unlock seamless growth” are “grow”. | ok |
| 2 | We help B2B brands use LinkedIn to grow their pipeline. Here's how: | What you do comes first, in plain words, and “Here's how” points at the rest. | ok |
| 3 | Here's how we help B2B brands use LinkedIn to speed up their pipeline and grow. | Each AI word swapped for a plain one: “use”, “speed up”, “grow”. Same order as yours. | ok |

**Ships:** version 1. v1's validator on version 1: `added word`.

**What does it:** Prompt: closed swap list (leverage → use, supercharge → speed up, unlock growth → grow). Validator: swap words are licensed per draft (v1 rejected "grow"/"speed" as added words), and `swap` rejects v1's garbled cut that dropped the verbs.


## 8. `r4-17` (crypto)

**Draft:** Really quick thread on why I think @jessepollak and the Base team are basically building the next Coinbase inside of Coinbase

**v1 shipped** (claude, graded **o**): @jessepollak and the Base team are basically building the next Coinbase inside of Coinbase  
_Judge: Lost thread signal; kept 'basically', 'inside of'._

**v2 returns**

| | line | why | validator |
|---|---|---|---|
| 1 | Why I think @jessepollak and the Base team are building the next Coinbase inside Coinbase: | Opens on “Why I think”, so the promise comes first, and the colon points at the thread. “Really quick” and “basically” went. | ok |
| 2 | @jessepollak and the Base team are building the next Coinbase inside Coinbase. A thread on why I think so: | The claim leads with @jessepollak, and the thread pointer closes it. “basically” went. | ok |
| 3 | Quick thread on why I think @jessepollak and the Base team are building the next Coinbase inside of Coinbase | The light edit: “Really” and “basically” went. Same order as yours. | ok |

**Ships:** version 1. v1's validator on version 1: `ok`.

**What does it:** Prompt: keep the thread pointer and its "why"; cut "basically". Validator: `pointer` rejects v1's line (no "thread", no "why").


## 9. `r4-27` (lowercase)

**Draft:** honestly just wanted to say thank you to everyone who bought the course this week, it really means a lot

**v1 shipped** (claude, graded **o**): thank you to everyone who bought the course this week, it means a lot  
_Judge: Cut 'really' softens warmth; comma splice remains._

**v2 returns**

| | line | why | validator |
|---|---|---|---|
| 1 | thank you to everyone who bought the course this week. it really means a lot. | “honestly just wanted to say” went and the splice is two sentences. “really means a lot” stays: it’s the warmth. | ok |
| 2 | to everyone who bought the course this week: thank you. it really means a lot. | Who it’s for comes first, then the thanks. Still lowercase, and “really” stays. | ok |
| 3 | thank you to everyone who bought the course this week — it really means a lot | The light edit: the run-up went and a dash fixes the splice. Still lowercase. | ok |

**Ships:** version 1. v1's validator on version 1: `ok`.

**What does it:** Prompt: "really means a lot" is a feeling at its strength; fix the splice. Validator: `feeling` rejects v1's "it means a lot".


## 10. `r4-53` (ghostwriting)

**Draft:** In today's fast-paced digital landscape, it's more important than ever to build thought leadership on social media.

**v1 shipped** (claude, graded **o**): It's more important than ever to build thought leadership on social media.  
_Judge: Cliche opener cut, but still a generic platitude._

**v2 returns**

| | line | why | validator |
|---|---|---|---|
| 1 | Build thought leadership on social media. It's more important than ever. | The cliché opener went and the action leads. It’s still a general claim: your own number or story would make it stop the scroll. | ok |
| 2 | It's more important than ever to build thought leadership on social media. | “In today's fast-paced digital landscape” went. Still generic: a result of yours would make it a hook. | ok |
| 3 | Thought leadership on social media is more important than ever. Build it. | The topic leads and the ask closes it. The cliché opener went. | ok |

**Ships:** version 1. v1's validator on version 1: `ok`.

**What does it:** Prompt move 5: a platitude gets tight, and the why says what's missing instead of inventing a hook. CLICHE_W licenses the cut.


## 11. `r4-59` (fitness)

**Draft:** Honestly, the best workout program is just the one that you will actually stick to.

**v1 shipped** (claude, graded **o**): The best workout program is just the one that you will actually stick to.  
_Judge: Only 'Honestly' cut; 'just', 'that', 'will' remain._

**v2 returns**

| | line | why | validator |
|---|---|---|---|
| 1 | The best workout program? Just the one you'll actually stick to. | The question opens a gap and the answer closes it. “Honestly” and “that” went; “actually” stays: it’s the contrast. | ok |
| 2 | The best workout program is just the one you'll actually stick to. | “Honestly” and “that” went, and “you will” is “you'll”. “actually” stays: it’s the point. | ok |
| 3 | The best workout program is just the one that you will actually stick to. | The light edit: only “Honestly” went. | ok |

**Ships:** version 1. v1's validator on version 1: `ok`.

**What does it:** Prompt: Q→A move; "just" here is guarded by the engine ("just the one"), so v2 keeps it and cuts "that", "will" instead.


## 12. `r4-109` (question)

**Draft:** Honest question: why do so many founders think they need a co-founder?

**v1 shipped** (claude, graded **o**): Why do so many founders think they need a co-founder?  
_Judge: Lost 'Honest question' framing; now reads as a dig._

**v2 returns** `unchanged: true`

| | line | why | validator |
|---|---|---|---|
| 1 | Honest question: why do so many founders think they need a co-founder? | Already sharp: “Honest question” stays: it tells readers you’re asking, not taking a dig. | ok (unchanged accepted) |

**Ships:** version 1 (unchanged). v1's validator on version 1: `unchanged`.

**What does it:** Prompt: sincere frames stay. Validator: "Honest question" becomes a guard, so `unchanged` is accepted (v1 shipped the engine's cut, o).


## 13. `r3-34` (founders)

**Draft:** I'm super excited to announce that after a lot of hard work we've officially launched our new product on Product Hunt today!

**v1 shipped** (claude, graded **o**): After a lot of hard work we've officially launched our new product on Product Hunt today!  
_Judge: Weak 'After a lot of hard work' opener kept._

**v2 returns**

| | line | why | validator |
|---|---|---|---|
| 1 | We've officially launched our new product on Product Hunt today! | “I'm super excited to announce that” went, so it opens on the launch. The “!” keeps the energy. | ok |
| 2 | Today we officially launched our new product on Product Hunt! | “Today” leads, so it reads as news. The announce frame went; the “!” stays. | ok |
| 3 | After a lot of hard work, we've officially launched our new product on Product Hunt today! | The light edit: only “I'm super excited to announce that” went. | ok |

**Ships:** version 1. v1's validator on version 1: `ok`.

**What does it:** Prompt: cut the announce frame, keep the "!", put the launch first.


## 14. `r3-80` (dev)

**Draft:** Just a friendly reminder that `rm -rf /` is not a valid way to free up disk space

**v1 shipped** (claude, graded **o**): `rm -rf /` is not a valid way to free up disk space  
_Judge: Mock-PSA frame carried part of deadpan joke_

**v2 returns** `unchanged: true`

| | line | why | validator |
|---|---|---|---|
| 1 | Just a friendly reminder that `rm -rf /` is not a valid way to free up disk space | Already sharp: “Just a friendly reminder” stays: the mock PSA is the joke. | rejects: unchanged |

**Ships:** the engine's line (v2 validator: `unchanged`), same as v1.

**What does it:** Known gap. v2 returns unchanged (the mock PSA is the joke), but the mark is a `label`, which v2 never lets the model vouch for (it would also vouch for "Unpopular opinion:"), so the engine's line ships, as in v1.


## 15. `r3-86` (dev)

**Draft:** So I finally got around to trying out Cursor for the first time and I have to say I'm genuinely pretty impressed with how it handles large codebases

**v1 shipped** (claude, graded **o**): I finally got around to trying out Cursor for the first time and I'm pretty impressed with how it handles large codebases  
_Judge: Still wordy 'got around to trying out'_

**v2 returns**

| | line | why | validator |
|---|---|---|---|
| 1 | Finally tried Cursor for the first time. I'm pretty impressed with how it handles large codebases | “got around to trying out” is “tried”, and it’s two beats. “pretty impressed” stays: that’s how impressed. | ok |
| 2 | I'm pretty impressed with how Cursor handles large codebases. Finally tried it for the first time. | The verdict leads, then the news. “pretty impressed” stays. | ok |
| 3 | I finally got around to trying out Cursor for the first time, and I'm pretty impressed with how it handles large codebases | The light edit: “So”, “I have to say” and “genuinely” went. | ok |

**Ships:** version 1. v1's validator on version 1: `added word`.

**What does it:** Prompt: "got around to trying out" → "tried" (licensed swap), "pretty impressed" kept. "for the first time" stays: "first" is a qualifier the validator protects.


## 16. `r3-99` (personal)

**Draft:** I don't usually share personal stuff on here but I've been really struggling with burnout lately and I just wanted to talk about it

**v1 shipped** (rules, graded **o**): I've been really struggling with burnout lately. I just wanted to talk about it.  
_Judge: Dropped vulnerable 'don't usually share' context; weak close._

**v2 returns**

| | line | why | validator |
|---|---|---|---|
| 1 | I've been really struggling with burnout lately. I don't usually share personal stuff on here. | The struggle leads, and “really struggling” stays. The weak close “I just wanted to talk about it” went. | ok |
| 2 | I don't usually share personal stuff on here, but I've been really struggling with burnout lately. | Your order, one sentence, and the comma fixes the run-on. “really struggling” stays. | ok |
| 3 | I don't usually share personal stuff on here, but I've been really struggling with burnout lately and wanted to talk about it. | The light edit: only “I just” went from the close. | ok |

**Ships:** version 1. v1's validator on version 1: `ok`.

**What does it:** Prompt: lead with the struggle, keep "really struggling" (feeling) and the vulnerable context.


## 17. `r3-111` (newsletter)

**Draft:** Just dropped a new episode of the podcast with @naval, we talked about wealth, happiness, and why most people really don't actually want to be rich

**v1 shipped** (claude, graded **o**): New podcast episode with @naval: wealth, happiness, and why most people really don't actually want to be rich  
_Judge: Good structure; clumsy 'really don't actually' kept._

**v2 returns**

| | line | why | validator |
|---|---|---|---|
| 1 | New podcast episode with @naval: wealth, happiness, and why most people don't actually want to be rich | “Just dropped” is now a header, and the splice is gone. “really” went; “don't actually want” stays. | ok |
| 2 | Just dropped a new episode of the podcast with @naval. We talked about wealth, happiness, and why most people don't actually want to be rich | The splice is two sentences, and “really” went from “really don't actually”. | ok |
| 3 | Just dropped a new podcast episode with @naval on wealth, happiness, and why most people don't actually want to be rich | One clean sentence: “we talked about” is “on”, and “really” went. | ok |

**Ships:** version 1. v1's validator on version 1: `ok`.

**What does it:** Prompt: fix the comma splice, cut one of "really don't actually".


## 18. `r3-116` (crypto)

**Draft:** So I've been thinking a lot about this lately and I honestly believe that the vast majority of retail traders are basically just gambling, because they don't have a plan, they don't size their positions properly, they don't use stop losses, and they really just chase whatever coin is pumping on their timeline that day, which is exactly why 90% of them lose money.

**v1 shipped** (claude, graded **o**): The vast majority of retail traders are basically just gambling, because they don't have a plan, they don't size their positions properly, they don't use stop losses, and they just chase whatever coin is pumping on their timeline that day, which is exactly why 90% of them lose money.  
_Judge: Still one sprawling sentence; 'basically' kept_

**v2 returns**

| | line | why | validator |
|---|---|---|---|
| 1 | Most retail traders are just gambling, and that's exactly why 90% of them lose money. They don't have a plan, they don't size their positions properly, they don't use stop losses, and they just chase whatever coin is pumping on their timeline that day. | The claim and the 90% lead; the reasons follow. The run-up, “honestly” and “basically” went. | ok |
| 2 | The vast majority of retail traders are just gambling. They don't have a plan, they don't size their positions properly, they don't use stop losses, and they just chase whatever coin is pumping on their timeline that day. That's exactly why 90% of them lose money. | Three beats instead of one sprawl: the claim, the reasons, the 90%. The run-up went. | ok |
| 3 | The vast majority of retail traders are just gambling, because they don't have a plan, they don't size their positions properly, they don't use stop losses, and they just chase whatever coin is pumping on their timeline that day, which is exactly why 90% of them lose money. | The light edit: the run-up, “basically” and “really” went. | ok |

**Ships:** version 1. v1's validator on version 1: `claim added`.

**What does it:** Prompt: three beats; claim and 90% first. Validator: "most" is licensed by the WORDY swap of "the vast majority of", and the `claim added` tally now runs against the swapped draft (v1 rejected this as "claim added").


## 19. `r3-118` (fitness)

**Draft:** Honestly I think one of the biggest mistakes that people make when they first start going to the gym is that they basically try to do way too much way too soon, and then they end up getting injured or burned out after just a couple of weeks and they quit completely, when really they should just start with three days a week.

**v1 shipped** (claude, graded **o**): One of the biggest mistakes people make when they first start going to the gym is that they try to do way too much way too soon, and then they end up getting injured or burned out after just a couple of weeks and they quit completely, when they should just start with three days a week.  
_Judge: Still one long run-on_

**v2 returns**

| | line | why | validator |
|---|---|---|---|
| 1 | One of the biggest mistakes people make when they first start going to the gym is doing way too much way too soon. They get injured or burned out after just a couple of weeks and quit completely. They should just start with three days a week. | Three beats for one run-on: the mistake, what it costs, the fix. “Honestly I think” and “basically” went. | ok |
| 2 | Just start with three days a week. One of the biggest mistakes people make when they first start going to the gym is doing way too much way too soon, then getting injured or burned out after just a couple of weeks and quitting completely. | The advice leads, then the mistake behind it. The hedges and “basically” went. | ok |
| 3 | One of the biggest mistakes people make when they first start going to the gym is trying to do way too much way too soon. Then they get injured or burned out after just a couple of weeks and quit completely, when they should just start with three days a week. | The light edit: “Honestly I think”, “that” and “basically” went, and a full stop splits it. | ok |

**Ships:** version 1. v1's validator on version 1: `ok`.

**What does it:** Prompt: three beats (mistake, cost, fix), or the advice first.


## 20. `r3-119` (dev)

**Draft:** Unpopular opinion but I really think that most junior developers would honestly be much better off spending their first year actually learning how to read other people's code and debug real production issues rather than just building yet another todo app with whatever the trendiest framework of the month happens to be at the time.

**v1 shipped** (claude, graded **o**): Most junior developers would be much better off spending their first year actually learning how to read other people's code and debug real production issues rather than just building yet another todo app with whatever the trendiest framework of the month happens to be at the time.  
_Judge: Opener cut; flabby tail and 'actually' remain._

**v2 returns**

| | line | why | validator |
|---|---|---|---|
| 1 | Most junior developers would be much better off spending their first year learning to read other people's code and debug real production issues, rather than just building yet another todo app with the trendiest framework of the month. | “Unpopular opinion”, “I really think”, “honestly” and “actually” went, and the tail is shorter. | ok |
| 2 | Most junior developers would be much better off learning to read other people's code and debug real production issues in their first year than just building yet another todo app with the trendiest framework of the month. | The two choices sit side by side with “than”. The run-up went and the tail is shorter. | ok |
| 3 | Most junior developers would be much better off spending their first year learning how to read other people's code and debug real production issues rather than just building yet another todo app with whatever the trendiest framework of the month happens to be. | The light edit: the run-up, “honestly” and “actually” went. | ok |

**Ships:** version 1. v1's validator on version 1: `ok`.

**What does it:** Prompt: cut the run-up and the flabby tail; keep "rather than just building yet another" (the engine guards that clause).


## 21. `r4-42` (newsletter)

**Draft:** In this week's issue of The Margin, I break down exactly how Shopify quietly became a bank: https://themargin.co/p/shopify-bank

**v1 shipped** (claude, graded **o**): I break down exactly how Shopify quietly became a bank in this week's issue of The Margin: https://themargin.co/p/shopify-bank  
_Judge: Slight front-load; still promo-flat_

**v2 returns**

| | line | why | validator |
|---|---|---|---|
| 1 | Shopify quietly became a bank. I break down exactly how in this week's issue of The Margin: https://themargin.co/p/shopify-bank | The hook leads: “Shopify quietly became a bank” comes first, and the issue and link follow. | ok |
| 2 | Exactly how Shopify quietly became a bank, in this week's issue of The Margin: https://themargin.co/p/shopify-bank | Opens on the promise, “Exactly how Shopify”, so the issue name stops opening the line. | ok |
| 3 | In this week's issue of The Margin: exactly how Shopify quietly became a bank https://themargin.co/p/shopify-bank | The light edit: “I break down” went, so the colon goes straight to the story. | ok |

**Ships:** version 1. v1's validator on version 1: `ok`.

**What does it:** Prompt move 3: lead with the hook. Validator: `frame` keeps "issue" (what the link is).


## 22. `r3-12` (crypto)

**Draft:** not going to lie, I sold my entire $PEPE bag at 0.0000012 and I'm kind of regretting it now lol

**v1 shipped** (claude, graded **o**): I sold my entire $PEPE bag at 0.0000012 and I'm regretting it now lol  
_Judge: Dropped 'kind of' softener; lol kept_

**v2 returns**

| | line | why | validator |
|---|---|---|---|
| 1 | I sold my entire $PEPE bag at 0.0000012. I'm kind of regretting it now lol | “not going to lie” went and the sale is its own beat. “kind of regretting” and “lol” stay: that’s you. | ok |
| 2 | I sold my entire $PEPE bag at 0.0000012 and I'm kind of regretting it now lol | The light edit: only the run-up went. “kind of” and “lol” stay. | ok |
| 3 | Sold my entire $PEPE bag at 0.0000012. I'm kind of regretting it now lol | Opens on the sale, clipped. “kind of regretting” and “lol” stay: that’s you. | ok |

**Ships:** version 1. v1's validator on version 1: `ok`.

**What does it:** Prompt: "kind of regretting" and "lol" stay. Validator: `feeling` and `voice` reject v1's "I'm regretting it".


## 23. `r4-13` (crypto)

**Draft:** Unpopular opinion: staking yields are not really 'yield', they're basically just dilution with extra steps.

**v1 shipped** (claude, graded **o**): Staking yields are not really 'yield', they're basically just dilution with extra steps.  
_Judge: Kept 'basically' and the comma splice._

**v2 returns**

| | line | why | validator |
|---|---|---|---|
| 1 | Staking yields are not really 'yield'. They're just dilution with extra steps. | “Unpopular opinion:” and “basically” went, and the comma splice is two sentences. “not really” and “just” stay. | ok |
| 2 | Staking yields aren't really 'yield'. They're just dilution with extra steps. | Two short beats, and “aren't really” keeps your doubt. The label and “basically” went. | ok |
| 3 | Staking yields are not really 'yield'; they're just dilution with extra steps. | The light edit: the label and “basically” went, and a semicolon fixes the splice. | ok |

**Ships:** version 1. v1's validator on version 1: `ok`.

**What does it:** Prompt: fix the splice, "basically just" → "just". Validator: contraction-blind guards accept "aren't really" for "are not really".


## 24. `r4-10` (crypto)

**Draft:** Not financial advice but I genuinely believe that $HYPE could literally 10x from here.

**v1 shipped** (claude, graded **o**): Not financial advice but I believe $HYPE could 10x from here.  
_Judge: Still leads with disclaimer; missing comma_

**v2 returns**

| | line | why | validator |
|---|---|---|---|
| 1 | I believe $HYPE could 10x from here. Not financial advice. | The call leads and the disclaimer follows it. “genuinely” and “literally” went; “I believe” and “could” stay. | ok |
| 2 | $HYPE could 10x from here. Not financial advice. | Opens on $HYPE. “could” still hedges the call, so “I believe” went with “genuinely” and “literally”. | ok |
| 3 | Not financial advice, but I believe $HYPE could 10x from here. | The light edit: “genuinely”, “that” and “literally” went, and a comma fixes the run-on. | ok |

**Ships:** version 1. v1's validator on version 1: `ok`.

**What does it:** Prompt: the disclaimer goes behind the call; keep the hedge.


## 25. `r3-147` (meaning)

**Draft:** I'm literally shaking right now. We got into YC.

**v1 shipped** (claude, graded **o**): We got into YC. I'm shaking right now.  
_Judge: Reversed order kills reaction-then-reveal suspense_

**v2 returns**

| | line | why | validator |
|---|---|---|---|
| 1 | I'm shaking right now. We got into YC. | Only “literally” went. The order stays: the reaction first, then the reveal. | ok |

**Ships:** version 1. v1's validator on version 1: `ok`.

**What does it:** Prompt: a setup and reveal keeps its order. v2 cuts only "literally". (No validator check: two-sentence swaps are sometimes the best edit, as in r3-99.)


## Also covered (short)

| id | draft | v1 shipped (grade) | v2 ships | how |
|---|---|---|---|---|
| `r3-98` | I moved to Lisbon 2 years ago knowing nobody. Here's what happened: | I moved to Lisbon 2 years ago knowing nobody. (**m**) | unchanged | pointer stays; `pointer` rejects v1's cut |
| `r4-28` | lowkey the best productivity hack is just going to bed at 10pm | the best productivity hack? just going to bed at 10pm (**o**) | unchanged | unchanged; `voice` keeps lowkey |
| `r4-66` | I just spent 6 hours debugging a production issue that ended up being a single missing await. | I spent 6 hours debugging a production issue that ended up being a single missing await. (**o**) | unchanged | unchanged; recency "just" stays (prompt) |
| `r4-68` | TIL that you can actually use `git worktree` to work on multiple branches at the same time without stashing. | You can actually use `git worktree` to work on multiple branches at the same time without stashing. (**o**) | TIL you can actually use `git worktree` to work on multiple branches at the same time without stashing. | TIL kept; `voice` rejects v1's cut |
| `r3-110` | New video is up! I basically break down my entire morning routine step by step 👉 youtu.be/abc123 | I break down my entire morning routine step by step 👉 youtu.be/abc123 (**o**) | New video is up! I break down my entire morning routine step by step 👉 youtu.be/abc123 | "New video is up!" kept; `frame` rejects v1's cut |
| `r3-14` | Just a quick thread on why I think the halving is already priced in 👇 | I think the halving is already priced in 👇 (**o**) | Why I think the halving is already priced in 👇 | "Why I think…" keeps the promise; `pointer` rejects v1's dropped "why" |
| `r4-50` | As a ghostwriter for 12 SaaS founders, I can tell you that the hook is basically 80% of the work. | As a ghostwriter for 12 SaaS founders: the hook is basically 80% of the work. (**o**) | I'm a ghostwriter for 12 SaaS founders. The hook is basically 80% of the work. | credential as its own beat; `As a X:` now counts as broken |
| `r3-90` | Here's a simple trick to make your UI look 10x more professional: use fewer colors. | Use fewer colors to make your UI look 10x more professional. (**o**) | unchanged | unchanged: the colon reveal; `reveal`/`pointer` reject v1's flattened line |

## Fixed by the validator alone

On these lines v1's Claude answer was graded h, but v1's validator rejected it and shipped the engine's weaker line (o or m). Under the v2 validator, the same v1 answer is accepted. r4-94 (main table, #6) is the eighth.

| id | v1 Claude line (h) | v1 reject | v1 shipped instead (grade) |
|---|---|---|---|
| `r4-0` | i think $SOL is just getting started, the chart looks bullish right now | meaning | i think $SOL is just getting started, the chart looks really really bullish right now. (**o**) |
| `r4-3` | I think ETH/BTC bottomed this week. Here's why 🧵 | stance | I really think that ETH/BTC bottomed this week. Here's why 🧵 (**o**) |
| `r3-23` | i've been bullish on $ARB for a while now but i'm starting to think i might have been wrong about it | stance | i've been bullish on $ARB for a while now but i might have been kind of wrong about it. (**o**) |
| `r4-103` | Very few people know you only have 30 days to file an 83(b). | unchanged | Few people know you only have 30 days to file an 83(b). (**o**) |
| `r3-143` | Very few founders talk about this. | unchanged | Few founders talk about this. (**o**) |
| `r3-150` | I really don't like the new X algorithm. | unchanged | I don't like the new X algorithm. (**m**) |
| `r3-153` | I'm still not sure if I really want to do this. | unchanged | I'm still not sure if I want to do this. (**o**) |

## Tally

| | lines |
|---|---|
| v2 ships a version I expect a pro to post (all 3 versions pass v2's validator unless noted) | 23 of 25 |
| r4-106: ships unchanged with the typo flagged in why (better than v1, but the line still has the typo) | 1 |
| r3-80: v2's prompt gets it right (unchanged), but the validator still won't take a vouch on a `label` mark, so the engine's line ships, as in v1 | 1 |
| versions written | 59; the v2 validator rejects 1 (r3-80's `unchanged`) |
| v1's validator on the same version 1s | rejects 6: r4-94, r4-109, r3-80 (`unchanged`), r4-57, r3-86 (`added word`), r3-116 (`claim added`) |

Two places where the expected output depends on the engine's guards rather than on judgment: r4-59 keeps "just" ("is just the one"), and r3-119 keeps "rather than just building yet another" (the engine guards a sincere "yet another" clause). Both are safe, and slightly less tight than a human editor would go.

