# zikibols — project plan

Kickstarter-style crowdfunding for **tokenized real-world cashflows**, with an agent that checks the creator on-chain before anyone pledges.

Repo: [github.com/yabuking84/zikibols](https://github.com/yabuking84/zikibols)  
Event: [ETHOnline 2026](https://ethglobal.com/events/ethonline2026) (4–16 Sep 2026)

---

## Vision

A backer should be able to fund an invoice bond or harvest share without a seed phrase, without trusting a screenshot of “DeFi history,” and without receiving a meme ticker.

The product is one app with three load-bearing sponsor integrations:

| Sponsor | Role in zikibols |
|---|---|
| **Privy** | Email/social login → embedded wallet → real HBAR pledge on Hedera testnet |
| **The Graph** | One Messari lending query against **Aave v3 and Compound v3**, live |
| **Hedera** | Agent **pays x402** for a risk note; campaigns issue **HTS** bond/share tokens with freeze/pause and a 2-of-2 coupon |

zikibols is not a general Kickstarter clone. It is a diligence-gated raise for **invoice receivables** and **revenue-share** assets, then a token lifecycle that looks like Asset Tokenization Studio (issue → transfer → freeze/pause → coupon), not a launchpad.

---

## Problem

Crowdfunding a tokenized cashflow today fails in three places:

1. **Wallets.** Asking a founder or backer to install MetaMask and fund a testnet is a demo killer.
2. **Diligence.** “Check the creator” is usually a blog post or a static risk score. Judges (and backers) cannot tell if the data is live.
3. **The token.** Most hackathon “RWAs” stop at `TokenCreate`. There is no freeze, no restricted transfer, no coupon, no dual control on payout.

zikibols treats those as the product, not polish.

---

## Product goals

1. **A backer can fund in minutes.** Log in with Privy, send HBAR from an embedded wallet, see the campaign book and HashScan tx update.
2. **Diligence is paid compute, not a mock.** “Check this creator” queries live Graph data, then the agent pays `/api/risk-report` over Hedera x402 (Blocky402 testnet). The dashboard never invents Graph or x402 data; Integrations shows Ready vs Needs env.
3. **The raise becomes a restricted HTS asset.** Issue a bond/share, airdrop one unit, freeze the holder (or pause the token), then release a coupon only after founder (Privy) + treasury operator both approve.
4. **One demo path, three prize stories.** A judge can walk Dashboard → campaign → Check creator → Pledge → Issue/Transfer/Freeze → 2-of-2 coupon without leaving the app.
5. **Honesty over theater.** Missing env fails on purpose. Heuristic notes are labeled when no LLM key is set. Skip-diligence is explicit (“Pledge anyway”), not hidden.

---

## ETHOnline prize mapping

Primary tracks we are building toward. Qualification is judged on **live testnet behavior**, a **public repo**, and a **short demo video**.

### Hedera — AI & Agentic Payments ($6,000)

**Requirement:** live x402-gated service on Hedera, settled via Blocky402; a platform/agent that completes a real paid request.

| Requirement | zikibols |
|---|---|
| x402-gated service | `POST /api/risk-report` (`withX402`, exact HBAR, payTo = `HEDERA_PAY_TO_ACCOUNT`) |
| Consumer | Due-diligence agent in `src/lib/agent.ts` via `buyRiskReport` |
| Facilitator | `https://api.testnet.blocky402.com` |
| Evidence | HashScan link on the campaign page after Check this creator |

Stretch later: metered pricing, HCS audit of the paid note, Scheduled Transactions for coupons.

### Hedera — Tokenization of Anything ($6,000)

**Requirement:** issue/manage a tokenized asset on Hedera testnet; show a lifecycle op (transfer, freeze, or distribution). ATS SDK/contracts/web app is the stated path; we currently implement the **same lifecycle with `@hashgraph/sdk` HTS** (freeze key, pause key, coupon transfer).

| Lifecycle | Status |
|---|---|
| Issue bond/share | Done (`issueCampaignToken`) |
| Airdrop one share | Done (`TokenAirdropTransaction`) |
| Freeze holder / pause token | Done |
| Coupon after 2-of-2 | Done as HBAR transfer; approvals persist in `.data/state.json` |

Gap vs the prize text: **Asset Tokenization Studio SDK is not wired.** The submission pitches an **ATS-shaped HTS lifecycle** (issue → airdrop → freeze/pause → coupon). See README.

### The Graph — Composable / Standardized products ($5,000)

**Requirement:** live Graph provider data; standardized schema (or composition); show what the shared schema made easier.

| Requirement | zikibols |
|---|---|
| Standardized schema | Messari lending: **one** `lendingProtocols` + `account` query |
| Two protocols | Aave v3 + Compound v3 subgraph IDs in `src/lib/graph.ts` |
| Live | Graph Gateway key (`THEGRAPH_API_KEY`); no key → Check this creator fails |
| Leverage | Same query, two books: TVL comparison + creator positions/liquidations |

### The Graph — Best AI use case, from scratch ($5,000)

**Requirement:** Graph is load-bearing; live data; reasoning, not a raw JSON dump.

The agent turns Graph snapshots + the paid risk paragraph into a backer-facing note (LLM if `OPENAI_API_KEY` is set, otherwise a labeled heuristic). That is the AI story: a **risk monitor** over standardized lending, not a chatbot wrapper.

### Privy — Best financial flow ($2,500)

**Requirement:** Privy is core; at least one live wallet financial flow (transfer qualifies).

Pledge: login → embedded wallet → `switchChain(296)` → `sendTransaction` HBAR to treasury.

### Privy — Best B2B financial product ($2,500)

Coupon 2-of-2 (Privy founder + operator) is the B2B sketch: dual control on treasury. **Not yet prize-complete** — Privy policies / key quorums / intents are not used. Stretch: replace the stored operator click with a Privy policy or quorum.

---

## What is already built

Working demo surface:

- Dashboard with campaign stats, How a backer funds, Integrations (Ready / Needs env), campaign cards, recent pledges
- Campaign workspace: story, progress, Check this creator, Pledge, Hedera asset panel, recent pledges
- Command search (⌘K), theme toggle, Privy login in the shell
- Two seed campaigns: **Harbor Credit** (invoice bond) and **Northwind Farms** (harvest share)

Working backend (in-process, not a database):

| Path | Role |
|---|---|
| `POST /api/agent` | Tool loop: Graph → pay x402 → summarize |
| `POST /api/risk-report` | Paid inference: `writeRiskNote` over live Graph numbers |
| `GET/POST /api/pledges` | Campaign book after an on-chain pledge |
| `GET /api/campaigns/[slug]` | Campaign + approvals + operator/backer flags |
| `POST /api/campaigns/[slug]/token` | issue / transfer / freeze |
| `POST /api/campaigns/[slug]/payout` | approve-founder / approve-operator / release |
| `GET /api/status` | Env truth for the Integrations row |

Stack: Next.js 16, React 19, Privy, viem, `@hashgraph/sdk`, `@x402/{core,fetch,hedera,next}`, Tailwind 4.

---

## Architecture (current)

```
Backer UI                    Agent                         Hedera testnet
─────────                    ─────                         ──────────────
Campaign page ──POST /api/agent──► query Aave+Compound     Graph Gateway
                                 │  (same Messari query)
                                 ▼
                              buyRiskReport ──x402──► POST /api/risk-report
                                 │                     (Blocky402 settle)
                                 ▼
                              heuristic or LLM note

Privy wallet ──HBAR tx──► campaign treasury (EVM 296)
         └──POST /api/pledges──► .data/state.json + pledgedHbar

Operator desk (`/campaigns/[slug]/operate`)
         └──issue/airdrop/freeze──► HTS
         └──2-of-2──► payCoupon (HBAR to backer account)
```

Seed campaign copy lives in `src/lib/campaigns.ts`. Pledges, HTS ids, and payout approvals persist to `.data/state.json` via `src/lib/store.ts`.

---

## Demo script (judges)

Target: under five minutes for Hedera; two to four minutes for The Graph.

1. Open the dashboard. Point at Integrations: Privy / Graph / x402 / HTS all **Ready** (or explain any Setup badge — do not fake data).
2. Open **Harbor Credit**. Click **Check this creator**. Show Aave + Compound TVL, wallet positions, paid note, HashScan payment tx.
3. **Log in with Privy**, pledge a small HBAR amount. Show HashScan + Recent pledges + **Your pledges**.
4. Sidebar **Operator desk**: save backer `0.0.x`, then **Issue token → Transfer share → Freeze / pause**.
5. **Approve as founder** (Privy) and **Co-sign as treasury**, then **Release coupon**. Show the coupon tx.

Talking points: one Graph query, two protocols; the risk endpoint is paid, not free; the token has freeze/pause keys; coupon needs two people.

---

## Known gaps (be honest in the README and video)

These are product debt, not secret bugs:

| Gap | Why it matters |
|---|---|
| Single default backer env | Airdrop is one named account per campaign (desk field), not every Privy pledger |
| 2-of-2 is stored flags | Operator approve is a button, not a second key |
| No ATS SDK | Tokenization prize text names Asset Tokenization Studio; we document the HTS equivalent |
| Coupon is 1000 tinybars | Lifecycle proof, not a real yield |
| Diligence can be skipped | Fine for a jammed demo; call it out |
| No tests, no deploy target | Judges must run locally or we host one URL |
| File store on serverless | Vercel-style read-only disks fall back to process memory |

---

## Roadmap

Order is prize-shaped: **keep the three sponsor stories live**, then deepen the weakest prize fit.

### P0 — hackathon must (this week)

- [ ] Fill `.env.local` and keep Integrations green for the recorded demo
- [ ] Deploy a public URL (Vercel or similar) so judges do not have to run locally
- [ ] Record the demo video against the script above; HashScan links in frame
- [x] README: architecture + payment flow; live vs local campaign book
- [x] Decide tokenization story: **wire ATS SDK** *or* explicitly pitch “ATS lifecycle on raw HTS” in the submission

### P1 — make the demo harder to break

- [x] Persist campaigns, pledges, token ids, and approvals (file JSON is enough)
- [x] Split **Backer** vs **Operator** surfaces so freeze/coupon is not on the same pane as Pledge
- [x] After pledge, show the backer’s own tx and running total, not only the global feed
- [x] Map at least one real pledger Hedera account into the airdrop (even if still one demo backer)

### P2 — prize stretch (pick 1–2, do not boil the ocean)

- [ ] **ATS:** issue the campaign token through Asset Tokenization Studio; keep freeze + coupon
- [ ] **Privy B2B:** founder approval via Privy policy / quorum instead of a POST with a wallet string
- [ ] **Graph:** same lending query on a third standardized protocol, or Subgraph MCP as a second client
- [ ] **x402 extra:** HCS memo of the paid note, or price the report by Graph row count
- [x] Create-campaign form (asset class, goal, creator wallet) writing into persisted state

### P3 — after ETHOnline

- [ ] Real dual-control (Hedera scheduled tx or multi-sig), not stored approval flags
- [ ] KYC / transfer restrictions that match ATS compliance, not only freeze
- [ ] Coupon sized to pledged principal; maturity / days-left actually gates release
- [ ] Index pledges from Hedera instead of trusting `POST /api/pledges`
- [ ] Production treasury, mainnet flag, and a non-hackathon brand pass

---

## Success criteria

The project is a **successful hackathon submission** if all of the following are true:

1. A stranger can clone, set env, and complete Check → Pledge → Issue → Freeze → Coupon on testnet.
2. Graph calls are live; x402 payment appears on HashScan; Privy transfer appears on HashScan; HTS token appears on HashScan.
3. Judges can name the three sponsor sentences without a slide: *same query two protocols*, *agent paid for the note*, *embedded wallet pledged HBAR*.
4. The video is ≤5 minutes and does not cut away from a failed env.

The project is a **successful product sketch** (beyond prizes) if a founder could describe Harbor Credit to an invoice desk and a backer could explain why freeze exists.

---

## Non-goals (this event)

- Mainnet money or a real securities offering
- A full Kickstarter (comments, rewards tiers, social feed)
- Replacing ATS with a new tokenization standard
- Mock Graph / mock x402 fallbacks that look “Ready”
- Mobile apps, chain abstraction, or extra L2s

---

## Seed campaigns

Used as fixtures until create-campaign exists.

| Slug | Asset | Story |
|---|---|---|
| `harbor-credit` | Invoice receivable bond (`HIB26`) | 90-day Rotterdam freight invoice; coupon when the invoice clears |
| `northwind-farms` | Harvest revenue share (`NWH26`) | Greenhouse working capital; freezeable share, coupon after produce sale |

Creator wallets are public Ethereum addresses used as Graph `account(id)` lookups (Aave/Compound on Ethereum), not Hedera accounts.

---

## How to run (pointer)

See [README.md](./README.md) for env vars and the demo flow. Copy `.env.example` → `.env.local`. Integrations on the dashboard is the source of truth for whether Graph and x402 will actually run.

---

## Code map

| Area | Where |
|---|---|
| Campaign fixtures | `src/lib/campaigns.ts` |
| Persisted book | `src/lib/store.ts` (`.data/state.json`) |
| Messari lending queries | `src/lib/graph.ts` |
| Agent tool loop | `src/lib/agent.ts`, `src/app/api/agent/route.ts` |
| x402 client/server | `src/lib/x402.ts`, `src/app/api/risk-report/route.ts` |
| Risk paragraph | `src/lib/risk-note.ts` |
| HTS issue/airdrop/freeze/coupon | `src/lib/hts.ts` |
| 2-of-2 flags | `src/lib/payouts.ts` |
| Privy pledge UI | `src/components/pledge-panel.tsx` |
| Token + coupon UI | `src/components/token-panel.tsx`, `src/app/campaigns/[slug]/operate/page.tsx` |
| Diligence UI | `src/components/check-creator.tsx` |
| Env badges | `src/lib/status.ts`, `src/components/integration-status.tsx` |
