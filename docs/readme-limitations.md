# What this app can and cannot do

This note states the prototype honestly: the **story** vs the **machine**.

The app explainer is [readme-non-technical.md](./readme-non-technical.md). How the whole app flows: [readme-flow.md](./readme-flow.md). Check this creator: [readme-creator-lookup.md](./readme-creator-lookup.md). ATS workshop: [readme-ats.md](./readme-ats.md). Technical README: [README.md](../README.md).

This is a **hackathon prototype** on Hedera **testnet** (play money). It is not a bank and not a finished crowdfunding product.

---

## The story vs the machine

**The story:** Someone needs money now. Backers chip in. The founder gets that cash to do the work. Later, backers get a cut (invoice paid, crop sold).

**The machine:** A listing goes on a website clipboard. Backers can look the founder up, then send play money into **one office jar**. The office can print a locked certificate, send a **crumb** back to one backer, and — after two clicks — empty most of that campaign’s share of the jar into the founder’s wallet and split the rest back across everyone who pledged.

What the machine still does **not** have is a reason to do it. Nothing checks that the invoice cleared or the crop sold; an operator decides. So the demo proves login, live lookup, paid agent receipts, an ATS bond lifecycle, and “Justin got paid” — but not “Justin got paid *because* the work was done.”

---

## What it *can* do

End to end, with play money:

| Step | What actually happens |
|---|---|
| **Start a campaign** | Creates a **listing** (flyer) in `.data/state.json`. Title, location, creator name, story, goal. No Hedera tx. No ATS bond yet (`draft`). |
| **Check this creator** | Live look-up of three lending books (The Graph), optional public-web search (Tavily), paid risk note. The **app’s robot** pays two tiny Hedera fees, not the backer. A public **fingerprint** can land on HCS. |
| **Log in** | Email / social via Privy. An embedded wallet is created. No seed phrase. |
| **Pledge** | Real HBAR transfer on Hedera testnet from that wallet to the **campaign treasury**. A labeled row is written in `state.json` (`pledges`) so the progress bar knows which flyer it was for. |
| **Operator desk** | [Issue bond](./readme-ats.md#issue-bond-and-mint-share) prints the ATS contract; [Mint share](./readme-ats.md#issue-bond-and-mint-share) hands **one** unit **per unique pledger** (a 13 ℏ pledge still mints 1, not 13); then pause, and after two clicks send a **tiny** coupon to the first minted address. |
| **Settlement** | After the same two clicks: **Pay founder** sends 90% of what this campaign actually raised to the wallet on the listing, and **Pay backers** splits the other 10% pro-rata across every wallet that pledged, in one transfer. Real HBAR, real HashScan txs, capped and refused if the treasury would drop below its gas reserve. |

Missing keys fail on purpose. The dashboard does not invent Graph numbers, web hits, or payment receipts.

Play-money receipts (pledges, x402 fees, HCS stamps, issued bonds) stay on [HashScan](https://hashscan.io/testnet) even if the website notebook is deleted.

---

## What it *cannot* do

### Money

- **Decide *when* the founder gets paid.** **Pay founder** exists now, but it fires when an operator clicks it. No invoice clearing, no harvest sale, no 90-day maturity gate, no goal check.
- **Calculate a real coupon.** The backer split is a flat 10% of the raise handed back pro-rata, plus the separate 0.00001 ℏ lifecycle crumb to one address. Neither is yield.
- **Pay out more than the cap.** Each payout refuses above `PAYOUT_MAX_HBAR` (100 ℏ) and refuses to take the treasury below `PAYOUT_RESERVE_HBAR` (50 ℏ), because that same jar pays the robot’s x402 fees and ATS gas. A 12,000 ℏ raise cannot actually be settled here.
- **One jar per campaign.** All listings share `NEXT_PUBLIC_CAMPAIGN_TREASURY`. Hedera does not know “this 50 ℏ was for the bike frame.” The `campaignSlug` on the clipboard does — so if you delete the clipboard before settling, the split is gone even though the coins are not.
- **Stop the same person approving twice.** Both signatures are stored flags, so settlement is only as strong as the desk that clicks them.
- **Mint one share per HBAR pledged.** A 13 ℏ pledge still mints **1** unit, not 13. Each unique pledger can get one certificate of the same bond; Alice who sent 13 ℏ and Bob who sent 50 ℏ both hold 1. How much they sent stays on the HashScan pledge tx and in `pledges`, not on the share balance. ATS can mint *N* units for *N* ℏ; we do not. See [One bond, many holders](./readme-ats.md#one-bond-many-holders--what-ats-can-do-vs-what-we-do).

### ATS (the bond workshop)

ATS **can** do more than this app uses. This prototype is not “ATS cannot pay.” It is “we did not wire the full payout tools.”

| ATS can do | This app |
|---|---|
| Coupon to **bond holders** | Writes “coupon due,” then a **normal** tiny HBAR send — not ATS Mass Payout |
| **Mass Payout** (many holders at once) | **Not used** |
| Dividend, voting, redemption, escrow, country lists, full KYC website | **Not used** |
| Store the Kickstarter page (story, city, who pledged) | **No.** ATS holds the **certificate**, not the flyer |
| Empty the pledge jar into the **founder’s** pocket | **Not an ATS job.** We do it ourselves: a plain treasury → founder HBAR transfer on **Pay founder** |

**Start a campaign does not create an ATS bond.** [Issue bond](./readme-ats.md#issue-bond-and-mint-share) on the Operator desk does. [Mint share](./readme-ats.md#issue-bond-and-mint-share) is the later click that hands **one** unit to a pledger — the same size whether they sent 13 ℏ or 50 ℏ, repeat per unique wallet.

If you delete `.data/state.json` after a bond was issued, HashScan still has the contract. The website forgets the name, city, and story unless those ids are saved again. There is no “retrieve the listing from ATS” button.

### Diligence (Check this creator)

- **Not KYC / not a bank credit check / not “safe to invest.”**
- The **readable** report lives in **this browser tab** (`sessionStorage`). Close the tab → the essay is gone from the app. The next visitor does not see your check.
- The **HCS stamp** is a fingerprint + payment ids, not the full note.
- **Run check again** always pays again from the **agent** pocket. No login, no cap. Spam can drain test HBAR.
- **Pledge anyway** skips the check on purpose.
- The backer is **not billed** for the check. “Paid” means the research desks are real paywalls the robot pays.

### The office notebook (`.data/state.json`)

This file **is** the store for:

- Campaigns you started (title, location, creator name, …)
- Live pledge rows (who, how much, which slug, tx hash)
- Operator progress (token id, pause, 2-of-2 clicks, which payouts already went out)

Delete it and **those** are gone from the website. Harbor Credit / Northwind Farms live in **code** (`src/lib/campaigns.ts`) instead. Hedera receipts remain.

It is a local JSON clipboard, not a database, not ATS, not a per-campaign on-chain ledger.

### Access and shares

- **No operator login.** Anyone who can open `/campaigns/<slug>/operate` can click Issue / Mint / Pause / Coupon — and now **Pay founder** / **Pay backers** — if the server has keys. The cap and the reserve are what limit the damage, not a password.
- **Approve as founder** is whoever is logged in with Privy — not checked against the listing’s real founder.
- **One unit per unique pledger, not per HBAR.** A 13 ℏ pledge does not mint 13 shares. The coupon crumb still goes to the first minted address.

---

## Where each thing lives

| Thing | Where |
|---|---|
| Listing (title, location, name, story) | `.data/state.json` (created campaigns) or `src/lib/campaigns.ts` (seed) |
| Pledge **coins** | One Hedera treasury |
| Pledge **scorekeeping** | `state.json` → `pledges[]` filtered by `campaignSlug` |
| Diligence essay | This tab (`sessionStorage`) |
| “We checked” stamp | Hedera HCS (hash + payment ids) |
| Official locked share | ATS on Hedera, **after** Issue bond; who got a unit is `runtime[slug].mints` |
| Tiny thank-you | Hedera HBAR from treasury → **backer** |
| Founder’s payday | Hedera HBAR from treasury → **creator wallet** on **Pay founder** (90% of the raise) |
| Backers’ cut | One Hedera transfer from treasury → **every pledger**, pro-rata (the other 10%) |
| Who has been paid already | `.data/state.json` → `payouts[slug]`, so the desk will not pay twice |

---

## Kitchen picture

1. You pin a **flyer** on the noticeboard (`state.json`).
2. A robot does **homework** (Graph + web). The shop pays for the pamphlet. A notary **stamps a fingerprint** (HCS).
3. Customers put coins in **one office tin** (treasury). Someone writes names on a **clipboard** (which flyer).
4. The office **prints one locked IOU** (ATS), hands **one** copy to each named customer (not one sheet per coin they put in), freezes it, gives a **crumb** back to the first one.
5. Two people sign, and the office **counts this flyer’s coins**: most go to the baker’s pocket, the rest go back to the customers in proportion to what each put in.
6. Nobody checks whether the bread was ever baked. The office just decides it is time.

---

## What a finished product would still need

Not an exhaustive product spec — the holes this demo leaves obvious:

- A **reason** to settle: goal reached, invoice cleared, harvest sold — not an operator clicking **Pay founder**
- One treasury (or sub-account) **per** campaign, or an on-chain memo that Hedera can score without the clipboard
- Persist listings and diligence somewhere that survives deleting `state.json` and closing the tab
- Cap / charge **Check this creator** so the agent pocket cannot be drained
- Shares **sized to the pledge** (13 ℏ → 13 units); calculated coupon instead of a flat percentage; optional ATS **Mass Payout**
- Real operator login; founder approval that is actually the founder
- Refunds if a campaign never funds

Until then: treat Zikibols as **Invest & Relax on testnet** — a path you can walk end to end, including the founder’s payday, but on play money and on an operator’s word rather than a real cash event.
