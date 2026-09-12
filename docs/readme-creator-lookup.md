# Check this creator, in plain English

This note is for anyone who has **no finance or blockchain background**. It explains what happens when you click **Check this creator** on a campaign page.

The app explainer is [readme-non-technical.md](./readme-non-technical.md). How the whole app flows: [readme-flow.md](./readme-flow.md). The technical README is [README.md](../README.md).

---

## What this button is

**Check this creator** is homework before you send money.

The campaign page is like a Kickstarter listing: a story, a goal, a name. That public brief is free. Anyone can read it without paying.

The check is the second layer. Instead of trusting a screenshot or a nice About page, a robot looks the founder up, writes a short caution note, pays a tiny fee for that work, and stamps a public receipt so nobody can later pretend a check happened if it did not.

Your click does **not** send your pledge. It only asks the server: “run the homework on this person.” The button changes to **Agent running…** while that happens.

The **Pledge** button stays locked until this finishes. **Pledge anyway** is an honest skip — use it only if the tools are down and you still need to show a transfer.

This is a **hackathon prototype** on play money (Hedera testnet). It is not a bank credit check, not identity verification, and not a “safe to invest” stamp.

---

## What the click sends

The page already knows the listing:

- Campaign title
- Founder name
- Optional email (only if they published a public one)
- Location
- The founder’s public **wallet** (think of that as an account number anyone can look up)

The robot uses those facts. It does not use your pocket or your login.

---

## Each step, in order

### 1. Two jobs start at the same time

**Job A — “Are their public money accounts messy, busy, or empty?”**

The robot looks in three big crypto lending pools: **Aave**, **Compound**, and **Spark**. Those are places people deposit and borrow digital money, like three different banks.

It asks two things:

- How healthy is each pool right now? (how much money is sitting there, how much is lent out)
- Does **this founder’s wallet** have loans open there? Have any of those loans ever been seized for non-payment?

Empty is not a gold star. It usually means “we don’t know,” not “they’re safe.” Demo wallets are often empty. That empty result is still a real lookup.

If one of the three books is down, the other two can still answer. The check does not invent missing numbers. If all three fail, the check stops.

**Job B — “Does this name show up on the public web?”**

This is a paid lookup, like buying a background-check pamphlet:

1. The research desk says “that costs a tiny bit of play-money.”
2. The robot pays that fee (play-money on Hedera, not your pledge).
3. Only then does it search the public web for the founder’s name (and email, if they published one).

You then get a short **Founder profile** plus links. Thin or mismatched hits are treated as unknown, not as proof they are the same person. This is not KYC.

If search is not plugged in, or there is no founder name, the app says it skipped. It will not invent a biography.

Name-only search is one query. Name plus email is two, and costs twice as much.

### 2. It pays again for a written risk note

With the lending numbers and the web sketch in hand, the robot buys a second paid product: a short **risk note**.

Same pattern: paywall → tiny play-money payment → a paragraph that uses only the live numbers and snippets. It does not invent pool sizes, jobs, or headlines.

If that payment fails, you still see the lending lookup and the web results. The note just says the paid write-up did not settle.

### 3. It stamps a public receipt

The robot does not post the whole note on a billboard. It posts a **fingerprint** of the note (and of the profile), plus both payment receipt IDs, onto Hedera’s public message board (**HCS**).

That is the “we actually checked, here is the timestamp” stamp. Later, nobody can quietly rewrite the note and claim it was the same check.

If operator keys are missing, this stamp is skipped on purpose. The rest of the homework can still show.

### 4. You get a short summary in English

If an AI key is set, a cautious model rewrites 3–5 sentences a backer can act on (**LLM note**). If not, you still get a plain summary from the numbers (**Heuristic note**). Both use only the live inputs. Neither invents a biography or a TVL figure.

On screen you then see:

- Step badges (`queryLending`, `buyFounderProfile`, `buyRiskReport`, `publishAudit`)
- The summary
- Founder profile and source links
- Lending-book sizes
- This wallet’s open loans / seized-loan counts
- Links to the two tiny payments and the public stamp

The result is saved in this browser tab so a refresh does not make you run it again. **Run check again** does a fresh lookup.

### 5. After that, you may pledge

**Diligence** in the stepper lights up. **Pledge** unlocks. Sending money is a separate click: log in, then send play-money from the pocket the site gives you.

---

## Are those live data?

**Yes — the check uses live lookups, not a canned screenshot.** If a key is missing, the app says it cannot run that part. It does not invent Graph numbers, web hits, or payment receipts.

| What you see | Live? | What that means |
|---|---|---|
| Lending books (Aave, Compound, Spark) | Yes | Fetched **right then** from The Graph’s public indexes. Not cached, not a file in the app. |
| This founder’s wallet | Yes | Same moment, same indexes. Empty still means “we looked and found nothing,” not “we skipped.” |
| Founder profile | Yes, if search is plugged in | Live public-web search, then a short write-up of those hits. |
| Two tiny fees and the HCS stamp | Real on testnet | Play-money transactions you can open on HashScan. Not real dollars, not fake flags. |
| Campaign story, goal, seed pledge totals | No | Demo listings (Harbor Credit, Northwind Farms, or whatever you typed). |
| The risk paragraph / summary | Derived | A write-up of the live numbers above, not a separate live feed. |

---

## Where is the paid due diligence?

**On the campaign page, in the right-hand card**, above Pledge.

The story on the left is the **free** brief. Paid due diligence is the **Check this creator** box on the right. After you click it, the paid part is the result panel under the button:

- **Paid founder search** and **Paid risk note** — links at the bottom (tiny Hedera fees)
- **HCS topic** / **HCS message tx** — the public stamp that those payments and the note fingerprint landed

If those links say **No x402 payment tx**, the homework may have run but the paid layer did not settle.

It is not on the dashboard, not on Operator desk, and not in Your pledges.

---

## Did I pay that 0.001 ℏ?

**No. You did not pay that.**

Those two links are receipts for the **app’s agent pocket**, not your Privy wallet. Each line is typically **0.001 ℏ** of play money:

- **Paid founder search · 0.001 ℏ** — web lookup (name plus email is twice that)
- **Paid risk note · 0.001 ℏ** — written caution note

So the robot usually spends **0.002 ℏ** in total. Click a link to see that payment on HashScan. Your balance only moves later if you click **Pledge**.

### “I thought the backer paid for extra homework?”

That mix-up is easy. **“Paid” here means the research is a real paid service, not that you are billed.**

| Action | Who spends | What it is |
|---|---|---|
| **Check this creator** | The **robot** (the server’s Hedera agent account) | Buys the web search and the risk note |
| **Pledge** | **You** (Privy wallet) | Sends play money to the campaign |

You are the backer. You only **ask** for the extra homework. The robot pays the tiny fees so the check is a real receipt, not a fake “we checked” badge.

The listing (story, name, email) stays free. The extra layer is “paid” because those two desks will not answer without HBAR — like a paywalled article. In this demo the **app** holds the subscription, not the reader.

That is on purpose for the hackathon: show that a software agent can **pay for tools by itself**. A real product might charge the backer a research fee instead. This one does not.

---

## Can backers abuse “Run check again”?

**Yes. In this demo they can.** Each **Run check again** is a new paid lookup. The robot pays again.

What exists today:

- While it is running, the button is disabled (you cannot spam *during* one run).
- A refresh **reuses** the last result in this browser tab, so reload does not charge again.
- **Run check again** always charges again. No login, no cooldown, no daily cap.

A bored visitor (or a script hitting the check) can drain the **agent** pocket until test HBAR runs out. Then checks fail. Your Privy wallet is still untouched.

That is a hackathon shortcut. A real product would typically: require login, cache the same founder for a while, cap how often one person can click, and/or charge the backer so spam costs *them*. None of that is in this app on purpose — the point was “the robot can pay,” not “the research desk is abuse-proof.”

---

## Is it an AI agent? Is it from Hedera?

**It is this app’s own robot, not a Hedera-made AI.** Hedera is the **till and the stamp**, not the investigator.

When you click **Check this creator**, Zikibols runs a fixed checklist on its server. People call that an “agent” because it can **pay for tools by itself**. It is not ChatGPT living on Hedera, and Hedera does not send a detective to look the founder up.

| Step | Who actually does it | Hedera? |
|---|---|---|
| Lending books (Aave, Compound, Spark) | **The Graph** — live public indexes | No |
| Name / email on the public web | **Tavily** search | No (only the tiny fee is on Hedera) |
| Written risk note | This app, from those live facts | Same — fee on Hedera |
| Short English summary | **OpenAI**, if a key is set; otherwise a plain template (**Heuristic note**) | No |
| Pay the two tiny fees | The robot’s Hedera play-money account | **Yes** (x402) |
| Public “we checked” stamp | Hedera message board (HCS) | **Yes** |

So: **lookup = Graph + web search (+ optional AI rewrite). Payment and receipt = Hedera.**

The **LLM note** badge means an AI rewrote the homework. **Heuristic note** means the same live lookups, no AI rewrite. Either way, the detective work is not “from Hedera.”

### Is Tavily free?

**Mostly, for this demo.** Tavily has a **free plan**: 1,000 credits a month, no credit card. This app uses a **basic** search, which is typically **1 credit per query**. Name-only is one search; name plus email is two.

That Tavily bill (if you go past the free credits) belongs to **whoever put the Tavily key on the server**, not to the backer.

The **0.001 ℏ** on **Paid founder search** is a **different** charge: the robot paying this app’s own paywall on Hedera. It is not Tavily’s price, and it is not your Privy wallet.

---

## Words in this flow, in plain English

| App word | What it really means |
|---|---|
| Check this creator | Do homework on the founder before sending money |
| Agent | This app’s robot that does the homework and can pay for tools. Not a Hedera-made AI |
| Wallet | A public account number (here, the founder’s) |
| Privy wallet | Your digital pocket. Used for **Pledge** only, not for the check |
| The Graph | A live lookup of public lending history (not a screenshot) |
| Tavily | The public-web search desk. Often free up to a monthly credit cap |
| Aave / Compound / Spark | Three big crypto lending pools, like three different banks |
| TVL | How much money is sitting in that pool right now |
| Liquidation | A loan that was seized because it could not be paid back |
| x402 | A paywall: “this research costs a tiny fee” |
| HBAR / Hedera | The play-money network this demo uses |
| HashScan | The public receipt website |
| HCS | A public stamp-book so the research receipt cannot be quietly rewritten |
| LLM note | An AI rewrite of the live facts (OpenAI, if a key is set) |
| Heuristic note | The same facts, without an AI rewrite |
| Run check again | A fresh paid lookup. The robot pays again |
| Pledge anyway | Honest skip of this homework |

---

## What this is *not*

- Not a bank credit check
- Not government ID / KYC
- Not “this founder is safe”
- Not your pledge (no money leaves *your* pocket)
- Not a Hedera detective (Hedera is the till and the stamp)
- Not a fake green badge when tools are missing

If the research tools are not plugged in, the app **refuses to fake it**. It says “not ready,” not “all good.”

---

## If you open a campaign as a curious backer

1. Read the story.
2. Click **Check this creator** and wait.
3. Read the summary. Empty on-chain history means unknown, not approved.
4. Open the HashScan links if you want to see the tiny payments and the stamp.
5. Then log in and pledge — or click **Pledge anyway** if you are skipping on purpose.

That is the whole lookup. Sending money is the next page in [readme-non-technical.md](./readme-non-technical.md#if-you-open-the-site-as-a-curious-backer).
