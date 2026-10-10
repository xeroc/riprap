# PROBLEMS.md — GP/investor critique vs. proposed answers

Source: GP review of `develop.riprap-pre-seed.pages.dev` (2026-09-18 teardown, attached to the review thread). Each row: the criticism condensed to one sentence, and the answer Riprap proposes to give (or the artifact that must exist before there is an answer). Rows 2, 3, and 6 have no honest answer today — each needs an artifact (legal memo, juror-economics spec, signed organizer LOIs), not better slide copy. This table is the data source for the pitch's problem→solution cards (`ProblemSolutionCard` in `@riprap/ui`); copy changes land here first.

| # | Criticism, condensed | Proposed answer |
|---|---|---|
| 1 | The pitch stacks six businesses into one progression; investors hear no single wedge. | Collapse to one line — **operated event pools → sponsor self-serve → persistent community mutuals** — and label reinsurance/tranching/permissionless as optionality, not plan. |
| 2 | The legal thesis is asserted, not evidenced; no memo, no named counsel. | Commission a written UK-counsel opinion pre-close (discretionary-mutual characterization, non-US participants, money-transmission analysis) and put the cliff map — fee-taking, external capital, permissionless — in the deck as milestones. If it can't be obtained pre-raise, say that plainly; it's cheaper than being caught in diligence. |
| 3 | Adjudication is the actual company risk and juror economics are "not finalized." | Promote it to experiment #1: finalize juror economics **before** the raise, and commit to publishing the metric set (turnout, stake/claim ratio, time-to-verdict, appeal/reversal rate, cost per claim) from Blade Pool onward. Accord on devnet is the machinery; adversarial volume is the missing proof. |
| 4 | Blade Pool stress-tests the hardest possible claims environment as the first production pool. | Own it explicitly: it's a deliberately adversarial burn room — capped payouts ($1k–4k), small stakes ($10–40), bounded lifetime, one venue. Cheapest possible place to discover adjudication failure; and since the founder is the organizer, it doesn't pollute the organizer-demand signal. |
| 5 | Surplus take-rate yields zero revenue at 0% loss and no surplus exists at 100% loss. | Switch the model to **fee-on-flow** (protocol + organizer take on entry), which survives every loss ratio; publish the five-scenario table with gross profit per pool. Pilot stays zero-take to prove member value first — that's a choice, not an oversight. |
| 6 | Organizer distribution is logic, not evidence. | Pre-raise: 3–5 organizer conversations → at least 2 signed LOIs to distribute. Make "pools created without the founder" the headline KPI of the whole raise, not a footnote. |
| 7 | Trusted-community B2B infrastructure and permissionless-anyone mutuals are different businesses presented simultaneously. | Sequence it as four phases (operated → SDK → permissionless → capital providers) and state which phase the raise funds. Permissionless is the end state the data justifies, not the go-to-market. |
| 8 | A token warrant forces a second, harder valuation exercise onto a $700k pre-seed. | Make "business first" literal: equity-only SAFE, warrant dropped or reduced to a one-page standard term (fixed % of any future supply, standard strike) that an IC can waive in five minutes. |
| 9 | Team reads as one engineer plus an AI agent, not a company that can build a regulated financial network. | Add a capability map: what the founder covers, what's missing, and **two named commitments** — insurance/regulatory counsel as advisor (pairs with row 2) and a claims-ops/risk hire post-raise. De-emphasize the AI agent to a footnote. |
| 10 | The moats (jurors, loss data) are future assets presented as current ones. | Present the flywheel — volume → claims data → pricing → more volume → more jurors → better adjudication — as a hypothesis under construction, with Blade Pool as the first turn of the wheel. Current defensibility is being first and instrumented; say exactly that. |
| 11 | The $1.61T mutual figure is validation of the model, not Riprap's TAM. | Reframe: "mutuality works at $1.6T scale in the analog world; our serviceable market today is event-protection attach, and the SAM expands with each phase." |
| 12 | The narrative leads with market size and architecture instead of the risk class. | Adopt the rewrite: too small / too local / too short-lived for insurance → communities pool it themselves → events give bounded risk + distribution → Breakpoint is the first experiment → three things to prove in 12 months (join, adjudicate, organizer-initiated repeat). |

## Appendix slide — "the hard questions"

Deck copy of record (2026-09-18, founder's answers supersede the proposals above for rows 2, 3, 4, 9). Rendered by `AppendixQASlide` (`apps/pitch-seed-raise/src/deck/slides.tsx`) via `ProblemSolutionCard`; questions condensed to under seven words.

| Row | Question on the slide | Answer on the slide |
|---|---|---|
| 2 | Can you legally do this? | The mutual is limited in scope and time to avoid UK insurance regulation. We review regulations step by step as we progress. |
| 3 | Can strangers adjudicate claims? | Adjudication is key; optimal parameters must be set case by case. We've defined them for the pilot. |
| 4 | Why the hardest claims first? | The cheapest place to find adjudication failures: capped payouts ($1k–4k), tiny stakes ($10–40), bounded lifetime, one venue. |
| 9 | Who builds the company? | Started solo, became a real business. None of this would've happened without mtnDAO. On-chain insurance has been on our minds for half a decade. |
