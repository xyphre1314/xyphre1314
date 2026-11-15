# Sharpen v3 dry run: the 37 lines where v2's first version wasn't graded h

Source: the 200-line v2 held-out set (now the dev set). For each line: the draft, v2's first version with the blind judges' grade and note, the version v3's prompt should return, and what `fromClaudeV3` (the light validator) does with it. The v3 versions are hand-written expectations of prompt-v3, not live model output; no API call was made. Verdicts come from running them through the prototype (`_work/v3proto-fn.js` spliced into a scratch copy of core.js).

Grades: **h** = a pro would post it, **o** = okay but not pro, **m** = miss (not postable). The meaning flag is separate and marked ⚑.

Four lines (h-12, h-27, h-42, h-81) are also prompt-v3 examples, so they're circular evidence; they're marked †.

| miss type in v2 (from the judges' notes) | lines |
|---|---|
| reorder | 12 |
| fluff | 9 |
| frame | 7 |
| reveal | 2 |
| voice | 1 |
| passive + hedge | 1 |
| pivot | 1 |
| left alone | 1 |
| object | 1 |
| passive + reorder | 1 |
| fluff + reorder | 1 |


## 1. `h-2` (crypto; fluff)

**Draft:** I have come to the conclusion, after a lot of late nights staring at charts, that it's time for me to start taking some profits

**v2 v1** (graded **o**): After a lot of late nights staring at charts, it's time for me to start taking some profits.  
_Judge: Cut fluff; tail 'it's time for me to start' still wordy_

**v3 version 1:** After a lot of late nights staring at charts, it's time to take some profits.  
_why:_ “I have come to the conclusion” and “for me to start” went. Your order, and the plan lands last.  
Validator: `ok` → **ships**


## 2. `h-12` † (founder; reveal (prompt example))

**Draft:** So here's the thing nobody tells you about raising a seed round: the money is the easy part

**v2 v1** (graded **m**): The money is the easy part of raising a seed round. Nobody tells you that.  
_Judge: Inversion kills the reveal; limp tag_

**v3 version 1:** Here's what nobody tells you about raising a seed round: the money is the easy part.  
_why:_ “So” went and the reveal stays last, after the colon, where it lands.  
Validator: `ok` → **ships**


## 3. `h-15` (newsletter; frame)

**Draft:** Wrote up how I grew from 0 to 10k subscribers in 9 months without going viral once, it's a long one so grab a coffee

**v2 v1** (graded **o**): I grew from 0 to 10k subscribers in 9 months without going viral once. Here's how:  
_Judge: Strong hook but drops write-up framing and coffee aside_

**v3 version 1:** Wrote up how I grew from 0 to 10k subscribers in 9 months without going viral once. It's a long one, so grab a coffee.  
_why:_ The splice is two sentences. The write-up framing and the coffee aside stay: they set the tone.  
Validator: `ok` → **ships**


## 4. `h-20` (crypto; reorder)

**Draft:** ok so after watching like 50 friends get wrecked this cycle i think i finally figured out why most people lose money in crypto

**v2 v1** (graded **o**): i think i finally figured out why most people lose money in crypto, after watching like 50 friends get wrecked this cycle  
_Judge: Inversion buries vivid '50 friends' detail_

**v3 version 1:** after watching like 50 friends get wrecked this cycle, i think i finally figured out why most people lose money in crypto  
_why:_ “ok so” went. Your order keeps the 50 friends up front, and “i think” stays.  
Validator: `ok` → **ships**


## 5. `h-27` † (fitness; frame (prompt example))

**Draft:** This might get me some hate but I really think most people would be better off doing less cardio and more strength training

**v2 v1** (graded **o**): Most people would be better off doing less cardio and more strength training.  
_Judge: Clean but loses the provocation framing_

**v3 version 1:** This might get me some hate, but I think most people would be better off doing less cardio and more strength training.  
_why:_ The frame stays: it tells readers it’s a provocation. “really” went; “I think” stays.  
Validator: `ok` → **ships**


## 6. `h-32` (founder; fluff)

**Draft:** I've been thinking a lot lately about what it actually means to build a company that lasts, and I keep coming back to the same idea

**v2 v1** (graded **o**): I keep coming back to the same idea about what it means to build a company that lasts.  
_Judge: Tighter but 'same idea about what' clunky_

**v3 version 1:** What does it actually mean to build a company that lasts? I keep coming back to the same idea.  
_why:_ The question opens on the topic, and the run-up “I've been thinking a lot lately” went.  
Validator: `ok` → **ships**

**v3 version 2:** I've been thinking a lot about what it means to build a company that lasts. I keep coming back to the same idea.  
_why:_ The light edit: the splice is two sentences.  
Validator: `ok`


## 7. `h-33` (newsletter; reorder)

**Draft:** This week's newsletter is a little different than usual, I'm going to talk about something personal that happened over the summer

**v2 v1** (graded **m**): I'm going to talk about something personal that happened over the summer. This week's newsletter is a little different than usual.  
_Judge: Reorder leads with throat-clearing, ends flat_

**v3 version 1:** This week's newsletter is a little different than usual: it's about something personal that happened over the summer.  
_why:_ One sentence in your order: the colon turns the aside into the promise, and the splice is gone.  
Validator: `ok` → **ships**


## 8. `h-34` (crypto; frame)

**Draft:** Quick PSA for anyone new: there's a lot of scam airdrops going around right now, please be careful, don't sign anything you don't understand

**v2 v1** (graded **o**): A lot of scam airdrops are going around right now. Be careful: don't sign anything you don't understand.  
_Judge: Clean, but lost 'for anyone new' cue_

**v3 version 1:** PSA for anyone new: there are a lot of scam airdrops going around right now. Be careful, and don't sign anything you don't understand.  
_why:_ “for anyone new” stays: it says who this is for. The splices are two sentences.  
Validator: `ok` → **ships**


## 9. `h-42` † (crypto; voice (prompt example))

**Draft:** gm everyone, hope you're all having a great week, wanted to share a quick update on my portfolio which is up 212% since january

**v2 v1** (graded **o**): my portfolio is up 212% since january  
_Judge: Punchy but dropped 'gm' voice_

**v3 version 1:** gm everyone. quick update: my portfolio is up 212% since january  
_why:_ The well-wishing and “wanted to share” went, so 212% comes fast. “gm everyone” stays: it’s your voice.  
Validator: `ok` → **ships**


## 10. `h-53` (marketing; fluff)

**Draft:** We spent $80k on Meta ads last quarter and I want to share what we learned, because a lot of it surprised us

**v2 v1** (graded **o**): We spent $80k on Meta ads last quarter. Here's what we learned, because a lot of it surprised us  
_Judge: Clunky because-clause, no end punctuation_

**v3 version 1:** We spent $80k on Meta ads last quarter. A lot of what we learned surprised us:  
_why:_ “I want to share” went. The $80k leads, and the colon points at the lessons.  
Validator: `ok` → **ships**


## 11. `h-56` (crypto; passive + hedge)

**Draft:** It is believed by a lot of people in this space that alts are dead, but I personally think that's not really the case

**v2 v1** (graded **o**): A lot of people in this space believe alts are dead. I think that's not really the case  
_Judge: Active fix; 'I think that's not really' clunky_

**v3 version 1:** A lot of people in this space believe alts are dead. I don't think that's really the case.  
_why:_ Active voice for the crowd, “personally” went, and your “I think” stays as the turn.  
Validator: `ok` → **ships**


## 12. `h-60` (b2b; pivot)

**Draft:** Customer success teams are often seen as a cost center, but in reality they can be one of the biggest drivers of expansion revenue if they are set up correctly.

**v2 v1** (graded **o**): Customer success teams are often seen as a cost center. They can be one of the biggest drivers of expansion revenue if they are set up correctly.  
_Judge: Dropped contrast pivot; second sentence limp_

**v3 version 1:** Customer success teams are often seen as a cost center, but set up correctly, they can be one of the biggest drivers of expansion revenue.  
_why:_ “in reality” went, the “but” pivot stays, and the line ends on expansion revenue.  
Validator: `ok` → **ships**


## 13. `h-61` (design; left alone)

**Draft:** In almost every portfolio review I do, designers show the final screens but never explain why they made the decisions they did

**v2 v1** (graded **m**): Almost every portfolio review I do: designers show the final screens but never explain why they made the decisions they did  
_Judge: Awkward colon construction, not better_

**v3:** `unchanged`: Already sharp: one observation with its turn, “but never explain why”, at the end.  
Validator: ships unchanged


## 14. `h-74` (design; fluff)

**Draft:** I put together a list of 8 free resources that I think every designer should have bookmarked

**v2 v1** (graded **o**): I put together a list of 8 free resources every designer should have bookmarked  
_Judge: Minor trim; 'I put together a list' kept_

**v3 version 1:** 8 free resources I think every designer should have bookmarked:  
_why:_ “I put together a list of” went, so the 8 leads. “I think” stays.  
Validator: `ok` → **ships**


## 15. `h-78` (founder; reorder)

**Draft:** Today marks one year since I left Google to go full-time on my startup, and it has been the hardest and most rewarding year of my life

**v2 v1** (graded **m**): The hardest and most rewarding year of my life: today marks one year since I left Google to go full-time on my startup.  
_Judge: Inversion leads with cliche; no tighter_

**v3 version 1:** Today marks one year since I left Google to go full-time on my startup. It's been the hardest and most rewarding year of my life.  
_why:_ Your order, two beats: the date, then the verdict it earns.  
Validator: `ok` → **ships**


## 16. `h-81` † (dev; object (prompt example))

**Draft:** Reading other people's code is a hugely underrated skill for developers and it's honestly something nobody really teaches you

**v2 v1** (graded **m** ⚑): Reading other people's code is a hugely underrated skill for developers. Nobody really teaches you.  
_Judge: 'Nobody really teaches you' loses object, shifts meaning_

**v3 version 1:** Reading other people's code is a hugely underrated skill for developers, and nobody really teaches it.  
_why:_ “honestly” went. “teaches it” keeps the verb’s object, so the claim still means the same.  
Validator: `ok` → **ships**


## 17. `h-93` (founder; fluff)

**Draft:** A lot of people have been asking me how we got our first 100 users, so I figured I'd finally write it all down in one place

**v2 v1** (graded **o**): How we got our first 100 users? A lot of people have been asking, so I figured I'd finally write it all down in one place.  
_Judge: Awkward fragment question; second line still wordy_

**v3 version 1:** A lot of people have asked how we got our first 100 users. I finally wrote it all down in one place.  
_why:_ Two clean beats in your order; “I figured I'd” went.  
Validator: `ok` → **ships**

**v3 version 2:** A lot of people have been asking how we got our first 100 users, so I finally wrote it all down in one place.  
_why:_ The light edit: “me” and “I figured I'd” went.  
Validator: `ok`


## 18. `h-96` (personal; reorder)

**Draft:** My mom immigrated here in 1989 with two suitcases, a nursing degree nobody would recognize, and a four-year-old (me), and she spent the next eleven years working night shifts at a care home in Fresno so I could stay in school, and today, after 22 years of saying "someday," I finally took her back to Manila to see the street she grew up on 🇵🇭

**v2 v1** (graded **o**): Today, after 22 years of saying "someday," I finally took my mom back to Manila to see the street she grew up on 🇵🇭. She immigrated here in 1989 with two suitcases, a nursing degree nobody would recognize, and a four-year-old (me). She spent the next eleven years working night shifts at a care home in Fresno so I could stay in school.  
_Judge: Payoff-first loses build; emoji mid-sentence_

**v3 version 1:** My mom immigrated here in 1989 with two suitcases, a nursing degree nobody would recognize, and a four-year-old (me). She spent the next eleven years working night shifts at a care home in Fresno so I could stay in school. Today, after 22 years of saying "someday," I finally took her back to Manila to see the street she grew up on 🇵🇭  
_why:_ The build stays in order and ends on Manila; the run-on is three sentences, and 🇵🇭 stays at the end.  
Validator: `ok` → **ships**


## 19. `h-97` (creator; fluff)

**Draft:** Burnout doesn't announce itself, and after 4 years as a full-time creator I've learned that it kind of just quietly shows up one day and you don't notice until it's too late

**v2 v1** (graded **o**): Burnout doesn't announce itself. After 4 years as a full-time creator, I've learned it kind of just quietly shows up one day and you don't notice until it's too late.  
_Judge: Good hook split, 'kind of just' fluff kept_

**v3 version 1:** Burnout doesn't announce itself. After 4 years as a full-time creator, I've learned it quietly shows up one day, and you don't notice until it's too late.  
_why:_ Two beats, and “kind of just” went: “quietly” does the work.  
Validator: `ok` → **ships**


## 20. `h-107` (fitness; passive + reorder)

**Draft:** The squat is often considered by many coaches to be the king of all exercises, but I'd argue it isn't the best choice for most people

**v2 v1** (graded **o**): I'd argue the squat isn't the best choice for most people. Many coaches consider it the king of all exercises.  
_Judge: Inverted order ends on conventional view_

**v3 version 1:** Many coaches see the squat as the king of all exercises, but I'd argue it isn't the best choice for most people.  
_why:_ Active voice, your order: the consensus, then your “I'd argue” turn at the end.  
Validator: `ok` → **ships**


## 21. `h-112` (creator; reorder)

**Draft:** Okay so I need to vent for a second about the state of brand deals right now because it's getting kind of ridiculous

**v2 v1** (graded **o**): The state of brand deals right now is getting kind of ridiculous. I need to vent about it.  
_Judge: 'state... is getting' awkward; flat tag_

**v3 version 1:** I need to vent about the state of brand deals right now, because it's getting kind of ridiculous.  
_why:_ “Okay so” and “for a second” went. Your order, and “kind of ridiculous” stays.  
Validator: `ok` → **ships**


## 22. `h-118` (creator; reorder)

**Draft:** I quit my job 18 months ago to do YouTube full-time and last month I made more than my old salary for the first time, $9,200

**v2 v1** (graded **o**): Last month I made more than my old salary for the first time: $9,200. I quit my job 18 months ago to do YouTube full-time.  
_Judge: Payoff first but context arrives late_

**v3 version 1:** I quit my job 18 months ago to do YouTube full-time. Last month I made more than my old salary for the first time: $9,200.  
_why:_ Your order, two beats, and the $9,200 lands last after a colon.  
Validator: `ok` → **ships**


## 23. `h-120` (dev; frame)

**Draft:** Hot take: I think a lot of developers are overcomplicating their stacks for projects that will never need to scale

**v2 v1** (graded **o**): A lot of developers are overcomplicating their stacks for projects that will never need to scale.  
_Judge: Lost 'Hot take' frame; flatter_

**v3:** `unchanged`: Already sharp: “Hot take:” tells readers how to take it, and “I think” keeps the call honest.  
Validator: ships unchanged


## 24. `h-130` (marketing; reorder)

**Draft:** One of the most common mistakes I see founders make with marketing is trying to be everywhere at once instead of picking one channel

**v2 v1** (graded **m**): Trying to be everywhere at once instead of picking one channel is one of the most common mistakes I see founders make with marketing.  
_Judge: Inversion, no tighter; heavy subject_

**v3 version 1:** One of the most common mistakes I see founders make with marketing: trying to be everywhere at once instead of picking one channel.  
_why:_ A colon turns the setup into a reveal, in your order.  
Validator: `ok` → **ships**


## 25. `h-140` (b2b; fluff)

**Draft:** In today's rapidly evolving business landscape, leaders must adapt or risk being left behind.

**v2 v1** (graded **o**): Leaders must adapt or risk being left behind.  
_Judge: Cut cliche; 'risk being' still soft_

**v3 version 1:** Leaders must adapt or get left behind.  
_why:_ The cliché opener went. Still generic: a story or number of yours would make it a hook.  
Validator: `ok` → **ships**


## 26. `h-152` (newsletter; reorder)

**Draft:** I've been writing this newsletter for three years now and it just crossed 20,000 subscribers, which is something I never thought would happen

**v2 v1** (graded **o**): This newsletter just crossed 20,000 subscribers. I've been writing it for three years, and I never thought that would happen.  
_Judge: 'that' ambiguous in second sentence_

**v3 version 1:** I've been writing this newsletter for three years, and it just crossed 20,000 subscribers. I never thought that would happen.  
_why:_ Your order, and “which is something” went, so “that” clearly means 20,000.  
Validator: `ok` → **ships**


## 27. `h-153` (b2b; frame)

**Draft:** Agree? Hiring for attitude over skills is one of the best decisions any manager can make.

**v2 v1** (graded **o**): One of the best decisions any manager can make? Hiring for attitude over skills.  
_Judge: Punchy but drops the 'Agree?' ask_

**v3:** `unchanged`: Already sharp: “Agree?” is the ask, and the claim answers it.  
Validator: ships unchanged


## 28. `h-155` (founder; reveal)

**Draft:** Month 23 of building in public — revenue is up, churn is down, and I made a pretty big mistake with pricing that I want to talk about

**v2 v1** (graded **m**): I made a pretty big mistake with pricing that I want to talk about. Month 23 of building in public: revenue is up, churn is down.  
_Judge: Reorder breaks setup-twist, ends flat_

**v3 version 1:** Month 23 of building in public: revenue is up, churn is down, and I made a pretty big mistake with pricing I want to talk about.  
_why:_ Your order keeps the twist last; the dash is a colon and “that” went.  
Validator: `ok` → **ships**


## 29. `h-156` (newsletter; reorder)

**Draft:** This issue was supposed to come out on Tuesday but I got the flu, so apologies for the delay, anyway here it is

**v2 v1** (graded **o**): Apologies for the delay. This issue was supposed to come out on Tuesday but I got the flu. Here it is.  
_Judge: Leads with apology; weaker opener_

**v3 version 1:** This issue was supposed to come out on Tuesday, but I got the flu, so apologies for the delay. Here it is.  
_why:_ “anyway” went and the splice is fixed. Your order: the reason, the apology, then “Here it is.”  
Validator: `ok` → **ships**


## 30. `h-164` (newsletter; fluff + reorder)

**Draft:** Something I've noticed over the course of interviewing over 60 operators for this newsletter is that the best ones are almost boring

**v2 v1** (graded **o**): The best operators are almost boring. I've noticed that over the course of interviewing over 60 operators for this newsletter.  
_Judge: Good lead; second sentence wordy, repeats 'operators'_

**v3 version 1:** After interviewing over 60 operators for this newsletter, I've noticed the best ones are almost boring.  
_why:_ “Something I've noticed over the course of” went. Your order, and the line ends on “almost boring”.  
Validator: `ok` → **ships**


## 31. `h-168` (b2b; reorder)

**Draft:** Saving this for my RevOps folks — the 11 KPIs you should actually be tracking in 2027 📌

**v2 v1** (graded **o**): The 11 KPIs you should actually be tracking in 2027, for my RevOps folks 📌  
_Judge: Tail 'for my RevOps folks' weak_

**v3 version 1:** For my RevOps folks: the 11 KPIs you should actually be tracking in 2027 📌  
_why:_ “Saving this” went and the colon sets up the 11 KPIs. The 📌 stays at the end.  
Validator: `ok` → **ships**


## 32. `h-169` (personal; frame)

**Draft:** Not to be dramatic but I think learning to cook at 34 has genuinely changed my life in ways I didn't expect

**v2 v1** (graded **o**): Learning to cook at 34 has changed my life in ways I didn't expect.  
_Judge: Clean but flattens the wink and sincerity_

**v3 version 1:** Not to be dramatic, but I think learning to cook at 34 has genuinely changed my life in ways I didn't expect.  
_why:_ Only a comma. The wink, “I think” and “genuinely” stay: they are the tone.  
Validator: `ok` → **ships**


## 33. `h-177` (fitness; fluff)

**Draft:** Beginner mistakes I see in the gym literally every day (there are like 6 of them)

**v2 v1** (graded **m**): There are like 6 beginner mistakes I see in the gym every day  
_Judge: Weak 'There are' opener, not sharper_

**v3 version 1:** Beginner mistakes I see in the gym every day (there are like 6 of them)  
_why:_ Only “literally” went. The aside and its “like 6” stay.  
Validator: `ok` → **ships**


## 34. `h-187` (b2b; fluff)

**Draft:** Let's talk about something that doesn't get discussed enough in sales: the importance of actually listening to your customers.

**v2 v1** (graded **o**): The importance of listening to your customers doesn't get discussed enough in sales.  
_Judge: Shorter but flat 'The importance of'_

**v3 version 1:** Something that doesn't get discussed enough in sales: actually listening to your customers.  
_why:_ “Let's talk about” and “the importance of” went. The reveal stays after the colon.  
Validator: `ok` → **ships**


## 35. `h-189` (fitness; reorder)

**Draft:** I hit a 500 lb deadlift today after being stuck at 455 for almost two years and I think I finally figured out what was holding me back

**v2 v1** (graded **o**): Stuck at 455 for almost two years, I hit a 500 lb deadlift today. I think I finally figured out what was holding me back.  
_Judge: Participial phrase reads slightly off_

**v3 version 1:** I hit a 500 lb deadlift today after being stuck at 455 for almost two years. I think I finally figured out what was holding me back.  
_why:_ Two beats in your order: the lift, then the lesson. “I think” stays.  
Validator: `ok` → **ships**


## 36. `h-190` (creator; frame)

**Draft:** New video just dropped! In this one I talk about how I made $14k from a channel with only 3,000 subscribers

**v2 v1** (graded **o**): I made $14k from a channel with only 3,000 subscribers. New video just dropped: I talk about how.  
_Judge: Number first; 'I talk about how' clunky_

**v3 version 1:** New video just dropped: how I made $14k from a channel with only 3,000 subscribers  
_why:_ “In this one I talk about” went, so the colon goes straight to the $14k.  
Validator: `ok` → **ships**


## 37. `h-191` (crypto; reorder)

**Draft:** Honestly I don't want to sound like a permabull but I really think we could be in the early innings of something pretty big here

**v2 v1** (graded **o**): We could be in the early innings of something pretty big here. I don't want to sound like a permabull.  
_Judge: Call first but trailing disclaimer deflates_

**v3 version 1:** I don't want to sound like a permabull, but I think we could be in the early innings of something pretty big here.  
_why:_ “Honestly” and “really” went. Your order ends on the call, with “I think” and “could”.  
Validator: `ok` → **ships**


## The 21 lines v2's validator threw away

Each of these was graded h as Claude wrote it, but `fromClaudeV2` rejected it, so the engine's line shipped. `fromClaudeV3` accepts all 21 as written.

| id | v2 reject | v3 | Claude's line (graded h) | engine line that shipped (grade) |
|---|---|---|---|---|
| `h-3` | broken | accept | It's been a minute! Lots to catch up on this week. | — it's been a minute! Lots to catch up on this week so let's dive right in. (**m**) |
| `h-6` | added word "used" | accept | Finally open-sourcing the internal feature flag tool we've used at work for two years!! Repo link below. Would love stars and feedback. | Finally open-sourcing the internal feature flag tool we've been using at work for two years!! Repo link below, (**h**) |
| `h-8` | number lost | accept | I just hit 100k subscribers on YouTube. Thank you to every single one of you who has supported me along the way. | 100k subscribers on YouTube. I wanted to take a second to thank every single one of you who has supported me a (**o**) |
| `h-9` | unchanged | accept | Reminder: file your 83(b) within 30 days. I didn't, and it cost me $186k. | File your 83(b) within 30 days. I didn't, and it cost me $186k. (**h**) |
| `h-18` | number lost | accept | everyone calling alt season this week is probably early by a month or two, maybe more, nfa. in the last three cycles alt season didn't start | long one but bear with me: if you look at the last three cycles alt season didn't start until btc dominance dr (**o**) |
| `h-26` | tense: drops a hedge | accept | Cold calling is not dead. It's just being done badly. | Here's an unpopular opinion that might ruffle some feathers: cold calling is not dead, it's just being done ba (**m**) |
| `h-31` | broken | accept | Just wrapped up a rebrand for a fintech client. I'm really proud of how it turned out. Swipe through to see the process. | Just wrapped up a rebrand for a fintech client. I'm really proud of how it turned out, swipe through to see th (**o**) |
| `h-51` | broken | accept | We lost our biggest customer last week. They were about 40% of revenue. I've been going back and forth on whether to post about it | We lost our biggest customer last week, they were about 40% of revenue, and I've been going back and forth on  (**m**) |
| `h-58` | added word "decided" | accept | We decided to shut down the consumer app and focus entirely on enterprise | The decision was made by our founding team to shut down the consumer app and focus entirely on enterprise. (**o**) |
| `h-64` | meaning | accept | A lot of founders are burning out quietly and not talking about it | Not sure if this is going to resonate with anyone but I think a lot of founders are burning out quietly and no (**m**) |
| `h-68` | meaning | accept | Code reviews are broken at most companies. | I know everyone has an opinion on this already. But I, think code reviews are broken at most companies. (**m**) |
| `h-80` | meaning | accept | The way buyers make purchasing decisions has fundamentally changed over the last five years. | It's no secret that the way buyers make purchasing decisions has fundamentally changed over the last five year (**m**) |
| `h-87` | meaning | accept | Thank you to our investors, our team, and most of all our customers for believing in us from day one. | First of all, thank you to our investors, our team, and most of all our customers for believing in us from day (**o**) |
| `h-92` | same | accept | Would really appreciate some honest feedback from design twitter on my new portfolio. It's been a long time coming and I'm a little nervous. | Would appreciate some honest feedback from design twitter on my new portfolio. It's been a long time coming an (**m**) |
| `h-115` | same | accept | Big news coming soon 👀 Can't say too much yet, but it's something I've been working on for over a year. | Big news coming soon 👀 can't say too much yet but it's something I've been working on for over a year (**h**) |
| `h-121` | unchanged | accept | In today's issue: why the creator economy is quietly consolidating, a new study on attention spans, and three tools I can't stop using | In today's issue: why the creator economy is quietly consolidating, a new study on attention spans, and three  (**h**) |
| `h-147` | number lost | accept | Algorithms are shaping what we read. I find myself thinking about it more and more. | One of the things I find myself thinking about more and more these days is the way algorithms are shaping what (**m**) |
| `h-157` | thin | accept | asdfgh | asdfgh (**h**) |
| `h-162` | meaning | accept | After 9 incredible years at Halbrook, I've decided it's time for a new chapter. | I never thought I'd be writing a post like this, but after 9 incredible years at Halbrook, I've decided it's t (**m**) |
| `h-185` | meaning | accept | Every brand wants to go viral, but almost nobody stops to think about what happens after the spike. | Every brand wants to go viral. But in my experience almost nobody stops to think about what actually happens a (**o**) |
| `h-199` | same | accept | Long overdue reflection on the past year of building Tallyhand: the good, the bad, and the stuff I'd rather not admit publicly but will anyw | Long overdue reflection on the past year of building Tallyhand, the good, the bad, and the stuff I'd rather no (**h**) |

## Tally

| | |
|---|---|
| expected v3 versions accepted by the light validator | 37 of 37 lines (every version written passes) |
| lines where v3 keeps the writer's order (v2's top miss: reorders) | 14 reorder misses → all in-order or setup-kept in v3 |
| lines left unchanged in v3 (sharp; v2 over-edited) | 3 (h-61, h-120, h-153) |
| v2 false rejects now accepted | 21 of 21 |

What v3 can't promise from this file: these are my expected outputs, not Sonnet's. The measurable claim is the validator's (validator-v3.md §0); the prompt's effect needs the next held-out run.

