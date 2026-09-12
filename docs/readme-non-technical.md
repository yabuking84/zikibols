# Zikibols in plain English

This note is for anyone who has **no finance or blockchain background**. It explains what the app does without assuming you know tokens, wallets, or investment jargon.

The technical README is in [README.md](../README.md). This file is the simple version.

---

## Forget the tech. Here is the idea.

Someone needs money **now** for something that will pay them **later**.

Example: a shipping company is owed money for a freight job. They will get paid in 90 days. They need cash today to keep working.

This app lets other people chip in a little cash today. When the shipping company finally gets paid, those people are supposed to get a small thank-you payment back.

That is the whole product. Two demo listings ship with the app:

- **Harbor Credit** — “Help us wait for a shipping invoice to be paid.”
- **Northwind Farms** — “Help us grow a greenhouse crop; when we sell it, you get a cut.”

You do not need a crypto wallet app. You log in with email, like a normal website.

This is a **hackathon prototype** on play money (Hedera testnet). It is not a bank and not a real investment product.

---



## The three people

**The founder** puts up a listing: who they are, the story, how much they want.

**The backer** is you: you read the story, decide if they look honest, then send a small amount of play money.

**The operator** is like the office clerk after the fundraiser. They print the official receipt, lock it so it cannot be casually resold, and only then send the thank-you payment.

Two screens, two jobs:

- **Campaign page** = “I want to fund this.”
- **Operator desk** = “Issue the certificate, lock it, pay the coupon.”

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

This is not for backers. It is the page after money came in.

Imagine:

1. Saving **which backer** gets the one official share
2. Printing **one official share certificate**
3. Sending that one share to the backer
4. Stamping **“cannot be freely sold”** on it (a freeze)
5. Waiting until **two people** say “yes, pay them” (founder + office)
6. Sending a **tiny thank-you** to that backer (see below)

That locked certificate is what the app calls an **ATS bond**. Fancy name. Meaning: *this is a restricted IOU, not a joke coin you trade on a meme app.*

Harbor Credit is already finished on the demo network, so its operator desk is a completed example. Northwind Farms (or a new campaign) is where you walk the whole sequence live.

### What the tiny thank-you is

The tiny thank-you **is the payout**, and it goes to **the backer** — the one address saved on the Operator desk (usually the latest person who pledged).

When the operator clicks **Release coupon**, two things happen:

1. A note is written on the bond: “this share is due a coupon.”
2. A speck of play money is sent to that backer.

That second step is the thank-you.

In the **story** the app is telling, you chip in today. Months later the shipping invoice is paid, or the greenhouse crop is sold. Then backers get their cut. That later cut is the payout (the app calls it a coupon).

In **this prototype**, none of that later event happens. There is no real invoice money coming in, no harvest sale, and no formula like “you pledged 50, so you get 53 back.” Nobody will wait 90 days for a demo.

So the Operator desk fakes the *last step of the story* in the smallest way that is still real on the network:

- Two people must click yes.
- Then a speck of play money actually moves to the saved backer (1000 tinybars — **0.00001** of one HBAR).
- Anyone can open the public receipt and see it landed.

**“Prove the payout button works”** means: prove the *machine* works end to end — money in, locked share, two approvals, money out — not prove that backers earned a return.

If this were a real product, that button would send a calculated share of the actual cash. Here the amount is tiny on purpose so nobody confuses it with profit. Only **one** backer gets it, not every person who pledged.

---



## Words that sound scary, in plain English


| App word                                                                                                                    | What it really means                                                           |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Campaign                                                                                                                    | A fundraiser listing                                                           |
| Pledge                                                                                                                      | Sending play money to that listing                                             |
| Check this creator                                                                                                          | Do homework on the founder before sending money                                |
| Agent                                                                                                                       | A robot that does that homework                                                |
| Privy                                                                                                                       | Login with email; the site makes a wallet for you                              |
| Wallet                                                                                                                      | A digital pocket that can send and receive play money                          |
| HBAR / Hedera                                                                                                               | The play-money network this demo uses (like monopoly money on a public ledger) |
| HashScan                                                                                                                    | The public receipt website — anyone can see the payment landed                 |
| The Graph                                                                                                                   | A live lookup of public lending history (not a screenshot)                     |
| Operator desk                                                                                                               | Back office: issue the certificate, lock it, pay the coupon                    |
| ATS                                                                                                                         | Asset Tokenization Studio — Hedera’s toolkit for official, rule-bound shares   |
| ATS bond                                                                                                                    | The official locked share / IOU, not a meme coin                               |
| Coupon / tiny thank-you                                                                                                     | The payout to the saved backer. In the story it is their cut later; in this demo it is a speck of play money to prove money can leave after two approvals |
| 2-of-2                                                                                                                      | Two people must click yes before money goes out                                |
| Pause / freeze                                                                                                              | Stamp the share so it cannot be freely moved                                   |
| HCS                                                                                                                         | A public stamp-book so the research receipt cannot be quietly rewritten        |


---



## What this demo is *not*

- Not a bank
- Not a real investment product
- Not “get rich”
- Not Kickstarter with comments, reward tiers, and a social feed
- Not a joke coin you trade

It is a prototype showing: *a normal person can fund a real-world-style deal without installing crypto software, after a robot actually checked the founder, and the payout cannot go out on one person’s click.*

Honest limits of the demo:

- The thank-you payment is a tiny proof, not calculated profit
- Only **one** share is minted (usually the latest backer), not one per person
- “Approve as founder” is whoever is logged in, not a bank-grade two-key lock
- Diligence can be skipped on purpose (**Pledge anyway**)
- Starting pledged totals on the two demo campaigns are fixtures; only pledges you make in the app have a public receipt

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