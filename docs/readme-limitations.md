# What this app can and cannot do

This note is for anyone who has **no finance or blockchain background**. It states the prototype honestly: the **story** vs the **machine**.

The app explainer is [readme-non-technical.md](./readme-non-technical.md). Check this creator: [readme-creator-lookup.md](./readme-creator-lookup.md). ATS workshop: [readme-ats.md](./readme-ats.md). Technical README: [README.md](../README.md).

This is a **hackathon prototype** on Hedera **testnet** (play money). It is not a bank and not a finished crowdfunding product.

---

## The story vs the machine

**The story:** Someone needs money now. Backers chip in. The founder gets that cash to do the work. Later, backers get a cut (invoice paid, crop sold).

**The machine:** A listing goes on a website clipboard. Backers can look the founder up, then send play money into **one office jar**. The office can print a locked certificate and send a **crumb** back to one backer. The founder’s pocket is **not** filled by a button in this app.

If those two feel like different products, that is the limitation. The demo proves login, live lookup, paid agent receipts, and an ATS bond lifecycle — not “Justin got paid for the bike frame.”

---

## What it *can* do

End to end, with play money:

| Step | What actually happens |
|---|---|
| **Start a campaign** | Creates a **listing** (flyer) in `.data/state.json`. Title, location, creator name, story, goal. No Hedera tx. No ATS bond yet (`draft`). |
| **Check this creator** | Live look-up of three lending books (The Graph), optional public-web search (Tavily), paid risk note. The **app’s robot** pays two tiny Hedera fees, not the backer. A public **fingerprint** can land on HCS. |
| **Log in** | Email / social via Privy. An embedded wallet is created. No seed phrase. |
| **Pledge** | Real HBAR transfer on Hedera testnet from that wallet to the **campaign treasury**. A labeled row is written in `state.json` (`pledges`) so the progress bar knows which flyer it was for. |
| **Operator desk** | Issue an **ATS bond**, mint **one** share to one backer, pause it, then after two clicks send a **tiny** coupon to that backer. |

Missing keys fail on purpose. The dashboard does not invent Graph numbers, web hits, or payment receipts.

Play-money receipts (pledges, x402 fees, HCS stamps, issued bonds) stay on [HashScan](https://hashscan.io/testnet) even if the website notebook is deleted.

---

## What it *cannot* do

### Money

- **Pay the founder the pledged pot.** Pledges sit in the operator treasury. There is no “send the raise to Justin” button.
- **Pay every backer fairly.** Coupon is **0.00001 ℏ** to **one** saved address (usually the latest pledger), not calculated yield, not one payout per person.
- **One jar per campaign.** All listings share `NEXT_PUBLIC_CAMPAIGN_TREASURY`. Hedera does not know “this 50 ℏ was for the bike frame.” The `campaignSlug` on the clipboard does.
- **Wait for the real-world event.** No invoice clearing, no harvest sale, no 90-day maturity gate.

### ATS (the bond workshop)

ATS **can** do more than this app uses. This prototype is not “ATS cannot pay.” It is “we did not wire the full payout tools.”

| ATS can do | This app |
|---|---|
| Coupon to **bond holders** | Writes “coupon due,” then a **normal** tiny HBAR send — not ATS Mass Payout |
| **Mass Payout** (many holders at once) | **Not used** |
| Dividend, voting, redemption, escrow, country lists, full KYC website | **Not used** |
| Store the Kickstarter page (story, city, who pledged) | **No.** ATS holds the **certificate**, not the flyer |
| Empty the pledge jar into the **founder’s** pocket | **Not an ATS job.** That would be a treasury → founder transfer we never built |

**Start a campaign does not create an ATS bond.** Issue bond on the Operator desk does.

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
- Operator progress (token id, pause, 2-of-2 clicks)

Delete it and **those** are gone from the website. Harbor Credit / Northwind Farms live in **code** (`src/lib/campaigns.ts`) instead. Hedera receipts remain.

It is a local JSON clipboard, not a database, not ATS, not a per-campaign on-chain ledger.

### Access and shares

- **No operator login.** Anyone who can open `/campaigns/<slug>/operate` can click Issue / Mint / Pause / Coupon if the server has keys.
- **Approve as founder** is whoever is logged in with Privy — not checked against the listing’s real founder.
- **One share** per campaign, not one per backer.

---

## Where each thing lives

| Thing | Where |
|---|---|
| Listing (title, location, name, story) | `.data/state.json` (created campaigns) or `src/lib/campaigns.ts` (seed) |
| Pledge **coins** | One Hedera treasury |
| Pledge **scorekeeping** | `state.json` → `pledges[]` filtered by `campaignSlug` |
| Diligence essay | This tab (`sessionStorage`) |
| “We checked” stamp | Hedera HCS (hash + payment ids) |
| Official locked share | ATS on Hedera, **after** Issue bond |
| Tiny thank-you | Hedera HBAR from treasury → **backer** |
| Founder’s payday | **Not implemented** |

---

## Kitchen picture

1. You pin a **flyer** on the noticeboard (`state.json`).
2. A robot does **homework** (Graph + web). The shop pays for the pamphlet. A notary **stamps a fingerprint** (HCS).
3. Customers put coins in **one office tin** (treasury). Someone writes names on a **clipboard** (which flyer).
4. The office **prints one locked IOU** (ATS), freezes it, gives a **crumb** back to one customer.
5. The baker **does not** get the tin emptied into his pocket. That step was never built.

---

## What a finished product would still need

Not an exhaustive product spec — the holes this demo leaves obvious:

- Send the raise to the **founder** (or a per-campaign escrow)
- One treasury (or sub-account) **per** campaign, or an on-chain memo that Hedera can score without the clipboard
- Persist listings and diligence somewhere that survives deleting `state.json` and closing the tab
- Cap / charge **Check this creator** so the agent pocket cannot be drained
- One share and a fair coupon **per** backer; optional ATS **Mass Payout**
- Real operator login; founder approval that is actually the founder
- Calculated yield, maturity, the real-world cash event

Until then: treat Zikibols as **Invest & Relax on testnet** — a path you can walk, not a company that owes Justin a payout.
