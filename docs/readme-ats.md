# Asset Tokenization Studio (ATS), in plain English

This note explains what ATS is, why it is called a “studio,” and what it can do.

The app explainer is [readme-non-technical.md](./readme-non-technical.md). How the whole app flows: [readme-flow.md](./readme-flow.md). The technical README is [README.md](../README.md).

---

## Is it a studio?

**It is not a film studio or an art studio.** “Studio” here is a **product name**, like a workshop: a place with tools to *make* something.

Same idea as:

- A **recording studio** — mics, mixing desk, rooms. You walk in with a song; you walk out with a finished track.
- **Android Studio** — Google’s workshop for making phone apps. You do not film anything.
- A **photo studio** — lights and backdrops, not a random phone snapshot.

**Asset Tokenization Studio** is Hedera’s workshop for turning a **real thing that has value** into an **official digital share** with rules (who can hold it, can it be sold, when is interest paid).

Break the name down:

| Word | Meaning |
|---|---|
| **Asset** | Something valuable in the real world |
| **Tokenization** | Giving it a digital certificate on a public ledger |
| **Studio** | The toolkit (website + code + ready-made contracts) to do that |

Hedera built it so a bank or a company does not have to invent “how do we issue a legal-ish digital bond?” from scratch.

A **token** here means a **digital certificate of ownership** (like a share certificate on a computer), not a joke coin.

---

## Everyday examples of what you would “make”

**An apartment building.** Instead of one person owning the whole building, you issue 1,000 digital shares. Only checked investors can hold them. Rent can be paid out as a coupon.

**A company.** Like paper stock certificates, but digital. Voting and dividends go through the studio’s tools.

**A government or company bond.** “Lend us money, we pay you interest on a schedule.” ATS has a **bond** type for that.

**This app.** Harbor Credit’s invoice and Northwind’s harvest share. The Operator desk uses ATS to print one locked certificate, mint **one unit per unique pledger**, and freeze it — instead of inventing a joke coin. Sending the raise to the founder and splitting a cut back to every pledger is a **plain treasury transfer**, not an ATS Mass Payout. See [Settlement](./readme-non-technical.md#settlement--the-founders-payday). Units are **one each**, not sized to the pledge — [One bond, many holders](#one-bond-many-holders--what-ats-can-do-vs-what-we-do).

---

## Two things you can *make*

**Equity (a share)**  
You own a slice of something. Example: 100 digital shares in an apartment building. If the building pays profit, you may get a slice. You might also vote.

**Bond (an IOU / loan)**  
You lent money; they promise to pay you back, often with a small extra on a schedule. Example: “We owe you for that freight invoice; when the customer pays us, we pay you.” Harbor Credit in this app is this kind.

---

## Features, in plain language

This is Hedera’s **full** ATS product, not only what Zikibols uses.

**Issue (create)**  
Print the official digital certificates.  
Example: “Create 1,000 shares of this greenhouse.”

**Mint (hand out)**  
Give some of those certificates to a person.  
Example: “Give Alice 1 share because she chipped in.”

**Cap the supply**  
Set a max so nobody secretly prints extra.  
Example: “Never more than 1,000 shares, like a limited print run of concert tickets.”

**Whitelist / control list (allowed list)**  
Only approved wallets can hold or receive the share.  
Example: a members-only club — the door person checks the list before you enter.

**Blocklist**  
Ban specific people from holding it.  
Example: “This address is not allowed,” like a barred customer.

**KYC / AML (identity and anti-crime checks)**  
KYC = “know who this person is” (ID check). AML = “this money should not look like crime proceeds.”  
Example: a bank asking for a passport before you open an account.

**Roles (who is allowed to press which button)**  
Different jobs: issuer, pauser, compliance officer. Not everyone is the boss.  
Example: only the cashier can open the till; only the manager can void a sale.

**Pause**  
Freeze *all* movement of the shares for a while.  
Example: “Stop trading during an investigation,” like locking the stadium gates.

**Lock**  
Freeze *one person’s* shares, or hold them until a date.  
Example: “Bob’s shares stay frozen for 6 months” (a vesting / waiting period), or “hold them in escrow until the house sale completes.”

**Forced transfer (controller move)**  
A super-user can move shares without the holder’s click, if the law requires it.  
Example: a court says “give those shares to the rightful owner.”

**Transfer restrictions**  
You cannot just send the share to anyone, unlike a normal coin.  
Example: you can gift a bookstore gift card to a friend; you usually cannot freely gift a private company share without rules.

**Coupon (bond interest / scheduled extra)**  
A planned extra payment to bond holders.  
Example: “Every 90 days, pay the invoice backers a little extra.” Zikibols does not use this ATS tool. **Pay founder** / **Pay backers** send HBAR from the treasury instead. See [Settlement](./readme-non-technical.md#settlement--the-founders-payday).

**Dividend (profit share for equity)**  
If the company/building made money, send holders a cut.  
Example: apartment rent profit split among the 1,000 share holders.

**Voting**  
Share holders vote on a decision.  
Example: “Should we sell the building? Yes/No.”

**Snapshots**  
A frozen photo of “who owned how much on Tuesday at 5pm.”  
Example: only people on the list *that day* get the dividend or the vote, so nobody buys a share 1 minute before payout just to grab the cash.

**Stock split**  
Cut each share into smaller pieces, same total value.  
Example: 1 pizza → 2 halves. You still own the same amount of pizza.

**Redemption**  
Turn the digital share back in and get cash (or the asset) out.  
Example: “The bond matured; we buy your certificate back.”

**Holds / escrow**  
Park shares or money in the middle until a condition is met.  
Example: a lawyer holding house-sale money until both sides sign.

**Link legal documents**  
Attach the real PDF (prospectus, contract) to the digital share.  
Example: the share on the computer points to “here is the actual loan agreement.”

**Wallets**  
People connect a digital pocket (MetaMask, HashPack, and similar) to hold and manage the share.  
Example: the app you use to tap-pay, but for these certificates.

**Custody (a professional vault)**  
Big institutions can store keys in a vault (Dfns, Fireblocks, AWS) instead of on someone’s laptop.  
Example: a bank safe instead of cash under the mattress.

**A website and a code kit**  
Non-coders can click through a web UI. Coders can call the same workshop from an app (the **SDK** — a box of ready-made functions). Zikibols uses the code kit from the Operator desk, not Hedera’s full website.

---

## What *this app* actually uses

A small slice:

| ATS can do | Zikibols does |
|---|---|
| Issue a bond | Yes — **[Issue bond](#issue-bond-and-mint-share)** |
| Mint to someone | Yes — **[Mint share](#issue-bond-and-mint-share)** — **one** unit **per unique pledger** |
| Allowed list | Yes — backer is put on the list before mint |
| Pause | Yes — **Pause bond** (whole bond). Allowed list is per mint. |
| Coupon | **Not used** on the desk. **Pay founder** / **Pay backers** are the payout |
| Mass Payout (many holders at once) | **Not used.** **Pay founder** / **Pay backers** are ordinary HBAR sends from the treasury (`src/lib/settlement.ts`) |
| Dividends, voting, splits, KYC website, escrow, full cap… | No, not in this demo |

So ATS is a **full workshop**. Zikibols is one short job in that workshop: print a locked IOU, freeze it, then send the raise from the same office jar. The founder’s payday is that jar, not another ATS tool.

---

## Issue bond and Mint share

These are the two Operator desk buttons that create the IOU. They are **not** the same job, and neither one pays anyone.

Think of a paper share certificate.

**Issue bond** = print the official blank form and register it.  
**Mint share** = write a person’s name on a copy and hand it to them. You can do this **once per unique pledger**.

Starting a campaign only pins the flyer. **Issue bond** is what actually creates the certificate on Hedera.

### Issue bond

Creates the campaign’s ATS bond on Hedera testnet — one contract (a “diamond”) cloned from Hedera’s public factory. After this click you get a contract id (`0.0.…`) and a HashScan link. The listing status becomes **Issued**.

That write is stored on the campaign as `tokenId` and `issueTxId` in `.data/state.json` (`runtime[slug]`). It is how the website later knows “this flyer’s IOU is that contract.”

What the bond holds: a name, a ticker, a short memo like `zikibols:mtb-full-suspension-bike-frame`, plus dummy bond paperwork. Not the pledged amount. Not the story. Not who funded.

What it does **not** do:

- Give anyone a share. The form exists; nobody holds a copy yet.
- Need a pledger first. You can issue with an empty list, then mint as pledges come in.
- Move the raise. Coins stay in the treasury.

You can only issue once. If the bond is already issued, the button stays off.

### Mint share

Hands **one** unit of that already-issued bond to **one** wallet. The Operator desk lists each unique pledger (same wallet, summed pledges). Click **Mint share** on that row. The desk first puts that wallet on the allowed list, then mints.

You can mint again to a **different** pledger. The same wallet cannot be minted twice. After the first successful mint the listing status becomes **Transferred**. Each mint is stored in `.data/state.json` (`runtime[slug].mints`) with a HashScan tx.

Mint stays off until the bond is issued, and it closes after **Pause**.

What it does **not** do:

- Create the bond. That was **Issue bond**.
- Pay HBAR. **Pay founder** / **Pay backers** are later buttons.
- Size the share to the pledge. A 13 ℏ pledge still mints **1** unit, not 13. Alice who sent 13 ℏ and Bob who sent 50 ℏ each get **1** unit.

**Mint to another address** is for a wallet that is not on the pledge list (or for `HEDERA_BACKER_ACCOUNT_ID`).

### Order on the desk

```
Issue bond  →  Mint share (each unique pledger)  →  Pause bond
        →  Pay founder  and/or  Pay backers
```

1. **Issue bond** — print the official form on Hedera. No share handed out. No cash moved. Once only.
2. **Mint share** — one click per unique pledger (or an extra address). Puts them on the allowed list, then hands **1** unit. Same wallet cannot be minted twice. Closes after Pause.
3. **Pause bond** — stamp “cannot be freely sold” on the **whole** bond. Not per backer. Each **Mint share** already put that holder on the allowed list.
4. **Pay founder** / **Pay backers** — 90 / 10 of the live raise from the treasury. Reads `pledges`, not ATS balances, so an unminted pledger can still get their cut.

The cash pile and the certificate pile are different. Full walk: [readme-flow.md](./readme-flow.md#operator-desk-and-the-bond).

---

## One bond, many holders — what ATS can do vs what we do

You do **not** print a separate bond per person. You print **one** campaign bond (one ATS contract), then hand units to many wallets.

ATS can mint *N* units sized to the pledge (13 ℏ → 13 units), take a snapshot of “who held what,” then pay a coupon or Mass Payout by that balance. A finished product would treat that balance as the public proof they funded.

**This app mints one unit per unique pledger.** The Operator desk lists everyone who pledged. Each **Mint share** click adds that wallet to the allowed list and issues **1** unit of the same bond. HashScan then shows each minted wallet holding 1 of that IOU.

What is still **off** the bond:

| Proof | Where it lives |
|---|---|
| They sent play money | HashScan tx to the treasury |
| Which flyer, and how much | `.data/state.json` → `pledges` |
| Which wallets already got a unit | `.data/state.json` → `runtime[slug].mints` |

**Pay backers** still reads pledge rows, not ATS balances — so the cash split can include someone you have not minted yet. Amounts are not proportional (13 ℏ and 50 ℏ both get 1 unit).

Honest list of other holes: [readme-limitations.md](./readme-limitations.md).

Hedera’s own docs: [Asset Tokenization Studio](https://docs.hedera.com/solutions/tokenization/ats).
