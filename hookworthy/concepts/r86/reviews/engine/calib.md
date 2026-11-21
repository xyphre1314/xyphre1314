# r86 engine pass 3 — calibration against the third juror

I graded the juror's 158 outputs blind (r86/engine/calib/blind.json: draft, line, say, why, cut, kept; their grades, notes and
keep-as-is flags removed), then compared (calib/mine.json).

| | h | o | m | h% | h% on the 79 lines that need work | h% on the 79 that should stay |
|---|---|---|---|---|---|---|
| juror | 115 | 34 | 9 | 72.8% | 50.6% | 94.9% |
| me, blind | 113 | 32 | 13 | 71.5% | 46.8% | 96.2% |

- Same grade on 140 of 158 (88.6%). Of the 18 disagreements, I was harsher on 12 and kinder on 6 (table below).
- Cross-tab mine→juror: h→h 111, o→o 24, m→m 5, m→o 8, o→m 4, o→h 4, h→o 2.

## What the gap is
On the same outputs my grading is as strict as the jury's, a little stricter on m. So the 92.6% I measured in rounds E/F is
not mainly lenient grading of the same work. It is the line mix and difficulty:
- in my rounds about 58% of lines needed work (by the proxy "sharp/unsure or not h"), and on those I measured 86–87% h;
- on the juror's set the same proxy gives 49% h. Their needs-work lines carry longer, layered frames ("As a designer, one of the
  most important lessons I've learned is that…", "Just wanted to give a huge shoutout to", "I just wanted to take a moment to
  really thank…", over-280 thank-yous with the news last), which my lines rarely did, and which I tended to accept as h once
  the obvious words were cut ("fine, but the frame is still there").

## The standard I adopt from here
h = a good creator would post it exactly as is, no "fine but". In particular, from the juror's notes:
- a frame left in front of the point is o at best (#1, #42, #63, #104, #155), and m when the engine claims nothing is soft (#94);
- "just" = simply / merely is meaning (#26, #28, #133 m); "basically/pretty much everyone" is a qualifier (#146 m);
- an already-sharp line touched for no gain is o (#3 tricolon split, #47 "every single week", #143);
- an orphan tail or a contraction that kills a stressed contrast is m (#0, #83);
- a label cut that leaves a bare preposition or runs a tag into the sentence is m (#44, #109);
- a struck/receipt mismatch (words vanish unstruck) is an explanation miss even when the line is h (#33).

## Disagreements
| # | draft (start) | engine line (start) | mine | juror | juror note (short) |
|---|---|---|---|---|---|
| 0 | honestly i think $SOL is going to outperform $ETH this cycle, just my  | i think $SOL will outperform $ETH this cycle, my opinion though. | o | m | Cutting "just" from "just my opinion though" leaves the orphan "my opi |
| 4 | I just wanted to quickly say that I am not a financial advisor and thi | I’m not a financial advisor and this isn’t financial advice. But I rea | m | o | Clean and true, NFA kept. Still opens on the disclaimer; "say" does no |
| 14 | Just a quick thread on why I think the halving is already priced in 👇 | Just a quick thread on why the halving is already priced in 👇 | m | o | Kept the real fluff "Just a quick thread on why"; cut the stance "I th |
| 26 | today i learned that you can just ask people for things and they'll of | today i learned that you can ask people for things. they'll often say  | m | o | "you can just ask" -> "you can ask": the "just" (= simply) was the ins |
| 28 | idk who needs to hear this but you can just log off | you can log off. | o | m | "you can just log off" -> "you can log off.": the "just" (= simply) is |
| 33 | We just hit $10k MRR after 14 months of building in public. Here's eve | $10k MRR after 14 months of building in public. Here's everything that | o | h | Strong hook. But "We just hit" vanishes with nothing struck, while the |
| 47 | I've been writing a newsletter every single week for 3 years. Here are | I've been writing a newsletter every week for 3 years. Here are 7 less | h | o | Sharp brag "every single week for 3 years" lost its emphasis; struck w |
| 51 | I wanted to share a really interesting chart I came across this week t | An interesting chart I came across this week that shows how much atten | m | o | Becomes a caption fragment ("An interesting chart I came across ... th |
| 59 | It's really important for B2B companies to understand that their buyer | B2B companies should understand that their buyers are people too. They | o | h |  |
| 76 | Hot take: most apps don't need microservices. A monolith is probably f | Most apps don't need microservices. A monolith is fine. | h | o | Cut "probably" from a deliberate understatement ("A monolith is probab |
| 83 | I'm not saying you should never use an ORM, but I am saying you should | I'm not saying you should never use an ORM. But I'm saying you should  | o | m | Split contracted the emphatic "I am saying" to "But I'm saying": the c |
| 109 | #buildinpublic update: we're now at 1,200 users and $3.4k MRR, up 22%  | #buildinpublic we're now at 1,200 users and $3.4k MRR, up 22% from las | o | m | "#buildinpublic update:" -> "#buildinpublic we're now at ...": the col |
| 111 | Just dropped a new episode of the podcast with @naval, we talked about | Just dropped a new episode of the podcast with @naval, we talked about | o | h |  |
| 117 | I just wanted to take a moment to really thank everyone who has suppor | I just wanted to take a moment to thank everyone who has supported us  | m | o | Still >280; the news ("We're officially profitable") stays buried at t |
| 119 | Unpopular opinion but I really think that most junior developers would | I really think that most junior developers would honestly be much bett | m | o | "yet another" tripped the sarcasm guard, which froze "really/honestly/ |
| 122 | purple elephant spreadsheet tomorrow banana | (unchanged) | m | o | Word salad treated as clean ("no safe move makes it stronger") instead |
| 133 | Love how every 'passive income' guru is actually just selling a course | Love how every 'passive income' guru is selling a course on passive in | m | o | Sarcasm payoff "is actually just selling" -> "is selling": the jab's " |
| 143 | Very few founders talk about this. | Few founders talk about this. | o | h |  |

## After the pass (re-graded by hand on every changed row; these are the juror's own lines, so this is not first contact)
| | h | o | m | h% | h% on the 79 that need work | h% on the 79 that should stay |
|---|---|---|---|---|---|---|
| juror's grades, engine before this pass | 115 | 34 | 9 | 72.8% | 50.6% | 94.9% |
| my grades, engine after this pass | 152 | 6 | 0 | 96.2% | 92.4% | 100% |

Still o: #1 (long thread header), #21 (second sentence long), #116/#117/#118/#119 (over-280 or one long sentence).
On new lines the calibrated standard gives a much lower first-contact rate: rounds G–J (see rounds.md) measured 77.8–82.5% overall
and 55–75% on the lines that need work. The calibration gap is real and it is mostly coverage: each new set of 40 needs-work lines
brings 10–16 run-up frames the table has never seen.
