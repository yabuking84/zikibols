# Zikibols in plain English

This note explains what the app does.

The technical README is in [README.md](../README.md). This file is the simple version. Flow charts of the whole app: [readme-flow.md](./readme-flow.md).

---

## Forget the tech. Here is the idea.

Someone needs money **now** for something that will pay them **later**.

Example: a shipping company is owed money for a freight job. They will get paid in 90 days. They need cash today to keep working.

This app lets other people chip in a little cash today. When the shipping company finally gets paid, those people are supposed to get a small thank-you payment back.

That is the whole product. Two demo listings ship with the app (see [Invoice receivable bond vs harvest revenue share](#invoice-receivable-bond-vs-harvest-revenue-share)):

- **Harbor Credit** — “Help us wait for a shipping invoice to be paid.”
- **Northwind Farms** — “Help us grow a greenhouse crop; when we sell it, you get a cut.”

You do not need a crypto wallet app. You log in with email, like a normal website.

This is a **hackathon prototype** on play money (Hedera testnet). It is not a bank and not a real investment product.

---



## The three people

**The founder** puts up a listing: who they are, the story, how much they want.

**The backer** is you: you read the story, decide if they look honest, then send a small amount of play money.

**The operator** is like the office clerk after the fundraiser. They print the official receipt (the locked share), freeze it so it cannot be casually resold, then empty most of this listing’s coins into the founder’s pocket and split the rest back across everyone who pledged. See [The locked receipt is not the cash](#the-locked-receipt-is-not-the-cash), [Settlement — the founder’s payday](#settlement--the-founders-payday), and [Who is the operator](#who-is-the-operator).

Two screens, two jobs:

- **Campaign page** = “I want to fund this.”
- **Operator desk** = “Issue the certificate, lock it, then send the raise to the founder and a cut back to the backers.”

---

## Invoice receivable bond vs harvest revenue share

When you **Start a campaign**, you pick one of these. They are two kinds of “what are we funding?” — the **story** of the listing, not two different apps.

Both mean: chip in **now**, get a cut **later**. The difference is *what* that later money is.

### Invoice receivable bond (Harbor Credit)

Someone already did the work and is **owed a bill**. They wait 90 days for the customer to pay. They need cash today, so backers front the money.

When the customer finally pays the invoice, backers are supposed to get paid back (plus a small extra — the “coupon”).

**Kitchen example:** A baker delivered a wedding cake. The couple will pay in 90 days. The baker borrows from you today against that unpaid bill. When the couple pays, you get your money back.

A **receivable** = money you are owed.  
A **bond** here = an IOU: “we borrowed from you; we pay you when that bill clears.”

Yes: the baker **already spent his own money** and **already delivered the cake**. The couple still owes him. The bond is how he gets cash **before** those 90 days are up.

**He gets money when backers pledge — today — not when the couple pays.**

1. Baker buys flour, bakes, delivers the cake. His pocket is empty. He is **owed** a bill.
2. He lists the invoice receivable bond: “Lend me against that unpaid bill.”
3. **You chip in.** That pledge is the baker’s cash-now. That is the whole point of the raise.
4. Day 90: the couple pays the cake bill.
5. That later money is meant to **pay you back** (the coupon / thank-you), not to be the baker’s first payday. He already got paid at step 3.

If nobody pledges, he still waits on the couple, same as without the app.

**Harbor Credit** adds a middleman: the freight desk is the baker; Harbor buys the unpaid bill (so the desk may already have gotten cash from Harbor); then Harbor raises from backers. Same idea: the person who did the work wants money **now**; backers wait for the bill to clear.

### Harvest revenue share (Northwind Farms)

Nobody is owed a bill yet. A farm needs money **to grow a crop**. Backers help with seed, heat, greenhouse costs. When produce is **sold**, backers get a **slice of the sales**, not a fixed “the invoice paid.”

**Kitchen example:** You help a neighbor plant tomatoes. When they sell them at market, you get a cut of the stall’s takings — more if the crop does well, less if it doesn’t.

**Revenue share** = “you get a percentage of what we earn,” not “we repay a specific unpaid invoice.”

The farmer has **not** already been paid for a finished job. They need cash **before** the tomatoes exist.

**The farmer gets money when backers pledge — today — to buy seed and heat. You get a cut later, when the stall sells.**

1. Neighbor wants to plant tomatoes. There is no unpaid bill yet. No crop yet.
2. They list the harvest revenue share: “Help us grow; you get a slice of sales.”
3. **You chip in.** That pledge is the farmer’s cash-now (seed, greenhouse, heat). That is the raise.
4. They grow the crop. If the crop fails, there may be little or nothing to share.
5. They sell tomatoes at market.
6. A slice of those sales is meant to **pay you** (the coupon / thank-you). The rest stays with the farmer as their takings after costs.

If nobody pledges, they may not plant — unlike the baker, who already delivered.

The contrast: baker already did the work and is owed a bill; farmer still has to grow something. Both still get the **backers’ money at pledge time**. What happens later is who pays you back (the couple’s bill vs the stall’s sales).

### Side by side

| | Invoice receivable bond | Harvest revenue share |
|---|---|---|
| The deal | An unpaid bill already exists | A future harvest will be sold |
| Demo | Harbor Credit (Rotterdam freight) | Northwind Farms (greenhouse) |
| Founder gets money | When backers pledge (today). Work is already done. | When backers pledge (today). That cash is used to grow the crop. |
| Later event | Customer pays the invoice | Produce is sold |
| Your cut (in the story) | Payback on that IOU | A slice of sales |
| Risk (in the story) | Customer might not pay the bill | Crop / sales might be weak |

### In *this* app

The choice is mostly a **label and a story**. Pledge, Check this creator, Operator desk, ATS bond, pause, and settlement are the **same** for both. The code does not calculate invoice interest vs a % of tomatoes.

Start a campaign → you pick one so the listing reads as “unpaid bill” or “crop share.” Under the hood both still become the same kind of locked ATS bond.

Creating the campaign only prints the story. **Money only moves when someone pledges.** Pledges go to the campaign treasury (the operator’s play-money account), not into the baker/farmer wallet the moment the listing is created. **Pay founder** sends most of *this listing’s* pledges to the wallet on the flyer, and **Pay backers** splits the rest pro-rata. Nothing checks that the couple paid or the stall sold — an operator decides it is time.

---



## What happens, as a story



### 1. You look at the listing

Like a Kickstarter page: story, goal, how much is already in.

A founder can also **Start a campaign**. That public brief (story, name, optional email, wallet, goal) is free for anyone to read. That is the first layer of “do I trust this person?”

### 2. You click “Check this creator”

Instead of trusting a screenshot or a nice About page, a robot does homework:

- Looks up whether this person’s public financial accounts look messy or empty
- Searches the public web for their name (and email if they published one)
- Writes a short risk note
- Pays a tiny fee to do that research, and stamps a receipt so nobody can later claim “we checked” if they did not

If the research tools are not plugged in, the app **refuses to fake it**. It says “not ready,” not “all good.”

The **Pledge** button stays locked until you run this check (or you click **Pledge anyway**, which is an honest skip).

### 3. You send money

Log in with email or a social account. The site gives you a digital pocket. You put play money in it (test coins, not real dollars), then send some to the campaign.

You get a public receipt link so you can see the payment landed. The site also updates **Your pledges**.

### 4. The operator desk (back office)

This is not for backers. It is the page after money came in (`/campaigns/<slug>/operate`).

Two piles. Pledging only fills the cash pile.

| Pile | What it is | Where it sits |
|---|---|---|
| **Cash** | The HBAR people sent | One treasury wallet |
| **Certificate** | A locked ATS receipt / IOU | One bond contract on Hedera |

Imagine:

1. Printing **one official share certificate** (**[Issue bond](./readme-ats.md#issue-bond-and-mint-share)**) — does not give anyone a share or move cash
2. Sending **one copy to each unique pledger** (**[Mint share](./readme-ats.md#issue-bond-and-mint-share)**) — 1 unit each, not one per ℏ pledged; also puts that wallet on the allowed list
3. (Optional) minting to another address that is not on the pledge list
4. Stamping **“cannot be freely sold”** on the **whole** bond (**Pause bond**). Not per backer. After this, minting is closed and the listing stops taking new pledges
5. **Pay founder** — most of what this listing actually raised, to the wallet on the flyer
6. **Pay backers** — the rest, split in proportion to what each sent, but only to the wallets that were handed a copy of the certificate in step 2. If anyone who pledged is still missing theirs, the desk shows a list and pays nobody

The longer map of this desk: [readme-flow.md](./readme-flow.md#operator-desk-and-the-bond).

That locked certificate is what the app calls an **ATS bond**. Fancy name. Meaning: *this is a restricted IOU, not a joke coin you trade on a meme app.*

Harbor Credit is already finished on the demo network, so its operator desk is a completed example. Northwind Farms (or a new campaign) is where you walk the whole sequence live.

### The locked receipt is not the cash

Two objects are easy to mix up:

| Thing | What it is |
|---|---|
| Official receipt / certificate | The **ATS bond** — an IOU that says “this backer funded this deal.” |
| The raise | The HBAR sitting in the treasury — **Pay founder** / **Pay backers** move this |

The operator prints the share, **then** freezes it, **then** sends the raise. The freeze is on the share, not on the HBAR.

**Why it cannot be casually resold.** In the story this is not a joke coin. It is a restricted IOU, like a private loan note.

The later cut is tied to **who holds the IOU**, not to a moral rule that only the first pledger is allowed to profit.

This share is a **private IOU**, not a public bond. The founder took money from Alice after Alice (and the robot) looked at the deal. The operator is supposed to know who that claim belongs to. If Alice dumps it on a marketplace five minutes later, Bob never went through that, and the office no longer knows who they owe.

If this were a normal listed bond, Bob **would** get the later cut. He bought the claim; the payment follows the current holder. That is a secondary market. This demo is deliberately **not** that. Pause means: no casual flip to a stranger. A later transfer could still happen if the operator checks Bob and allows him — that is “approved holder,” not “free trading.”

So “people who funded” here means **the approved holder of the locked share**, which in the demo is the original backer. It does not mean Alice is the only human who could ever deserve a cut.

The **Pause / freeze** stamp is that rule on the network: the share cannot be freely moved.

The cash is separate. That is [Settlement](#settlement--the-founders-payday).

In the **story** the app is telling, you chip in today. Months later the shipping invoice is paid, or the greenhouse crop is sold. Then backers get their cut.

In **this prototype**, none of that later event happens. There is no real invoice money coming in, no harvest sale, and no formula like “you pledged 50, so you get 53 back.” An operator clicks **Pay founder** / **Pay backers** when they decide it is time.

### Settlement — the founder’s payday

Pledges sit in **one office jar** (the campaign treasury). Hedera does not know which coins were for which flyer; the website clipboard does.

The Operator desk can empty **this listing’s** share of the jar:

| Button | What leaves the jar | Where it goes |
|---|---|---|
| **Pay founder** | 90% of what this campaign actually raised | The Ethereum wallet printed on the listing. If that wallet has no Hedera pocket yet, the transfer creates one the same key controls. |
| **Pay backers** | The other 10% | Every wallet that pledged **and holds a certificate**, split by how much each sent, as **one** public receipt |

That is the baker getting cash-now and the neighbors getting a cut back. It is still play money, still an operator click — nothing checks that the couple paid or the tomatoes sold. A cap (100 ℏ per send) and a reserve (50 ℏ left in the jar for robot fees and printing the bond) stop a fat-finger from emptying the whole office.

**Everyone needs their certificate first.** The office pays the cut to certificate holders, so if someone who pledged was never handed one, **Pay backers** shows their name and pays nobody. Hand out every copy **before** stamping the bond as locked — that stamp closes the handing-out step for good.

The two demo campaigns’ starting totals are **fixtures**. Only pledges you make in the app are counted. The desk will not pay the same pot twice.

### Who is the operator

The operator exists because pledges are just play money sitting in a pot. Someone has to turn that into the locked share, then empty this listing’s coins to the founder and the backers.

**In a real product** it would be a named office: the campaign’s treasury, a lawyer, a platform admin — someone with the keys to the company wallet, not a random backer.

**In this demo, almost anyone who can open the Operator desk.**

| Button | Who can press it |
|---|---|
| Issue / Mint / Pause / **Pay founder** / **Pay backers** | Anyone who opens the Operator desk page. There is **no operator login**. |

The **actual** issue / mint / pause / payout on the network is signed by a play-money account stored on the server (`HEDERA_OPERATOR_*` keys, or the agent keys if those are missing). Clicking the buttons uses *that* account, not the clicker’s personal pocket. If those keys are missing, Issue stays disabled. You can still look at the page.

**Short example.** Alice pledges from her email login. She is a **backer**. She cannot (in the story) print the bond or pay herself. Bob, who deployed the demo and funded the operator account, opens Operator desk and runs Issue → Mint → Pause, then **Pay founder** and **Pay backers**. Bob is the **operator**. In the demo, if you know the URL and the server has keys, *you* can be Bob. That is a shortcut, not bank-grade access control.

---



## Words that sound scary, in plain English


| App word                                                                                                                    | What it really means                                                           |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Asset class                                                                                                                 | The kind of deal: unpaid bill (invoice receivable bond) or crop sales slice (harvest revenue share). Story/label in this demo; same buttons underneath |
| Invoice receivable bond                                                                                                     | “Help us wait for an unpaid bill.” Harbor Credit. Baker already delivered the cake; couple pays in 90 days |
| Harvest revenue share                                                                                                       | “Help us grow a crop; you get a cut of sales.” Northwind Farms. Neighbor’s tomatoes at market |
| Pledge                                                                                                                      | Sending play money to that listing                                             |
| Check this creator                                                                                                          | Do homework on the founder before sending money                                |
| Agent                                                                                                                       | A robot that does that homework                                                |
| Privy                                                                                                                       | Login with email; the site makes a wallet for you                              |
| Wallet                                                                                                                      | A digital pocket that can send and receive play money                          |
| HBAR / Hedera                                                                                                               | The play-money network this demo uses (like monopoly money on a public ledger) |
| HashScan                                                                                                                    | The public receipt website — anyone can see the payment landed                 |
| The Graph                                                                                                                   | A live lookup of public lending history (not a screenshot)                     |
| Operator / Operator desk                                                                                                    | The back-office person and their page after money came in. In a real product, a named treasury; in this demo, whoever opens the page while the server has operator keys |
| ATS                                                                                                                         | Asset Tokenization Studio — Hedera’s toolkit for official, rule-bound shares   |
| Official receipt / certificate                                                                                              | The locked share (the ATS bond). Not the HBAR in the treasury                  |
| ATS bond                                                                                                                    | The official locked share / IOU, not a meme coin                               |
| Settlement / Pay founder / Pay backers                                                                                      | Most of this listing’s real pledges go to the founder’s wallet; the rest is split back across everyone who pledged |
| Pause / freeze                                                                                                              | Stamp the share so it cannot be freely moved. The payout follows the **approved holder**, not a stranger who bought it on a marketplace |
| HCS                                                                                                                         | A public stamp-book so the research receipt cannot be quietly rewritten        |


---



## What this demo is *not*

- Not a bank
- Not a real investment product
- Not “get rich”
- Not Kickstarter with comments, reward tiers, and a social feed
- Not a joke coin you trade

It is a prototype showing: *a normal person can fund a real-world-style deal without installing crypto software, after a robot actually checked the founder — including sending the raise to the founder.*

Honest limits of the demo:

- **Pay founder** / **Pay backers** are a fixed 90 / 10 split of live pledges, on an operator click — no invoice, harvest, or goal check
- Each unique pledger can get **one** share (not sized to how much they sent) — [how mint and pledge proof work](./readme-ats.md#one-bond-many-holders--what-ats-can-do-vs-what-we-do)
- The Operator desk has **no operator login**; Issue / Mint / Pause / Pay founder / Pay backers are open to anyone who can open the URL (the server keys still do the on-chain work; a cap and a reserve limit how much can leave)
- Diligence can be skipped on purpose (**Pledge anyway**)
- The two listing types (invoice bond vs harvest share) are a **story label**; both still become the same locked ATS bond
- Starting pledged totals on the two demo campaigns are fixtures; only pledges you make in the app have a public receipt or count toward settlement

---



## If you open the site as a curious backer

1. Open the dashboard.
2. Click **Harbor Credit** or **Northwind Farms**.
3. Read the story.
4. Click **Check this creator** and wait.
5. Log in with email.
6. Pledge a small amount of play money if the wallet is funded.
7. Leave **Operator desk** for whoever is running the demo.

That is the whole backer path. Everything else is back-office and receipts.