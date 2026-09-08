# zikibols

A backer should be able to fund an invoice bond or harvest share without a seed phrase, without trusting a screenshot of “DeFi history,” and without receiving a meme ticker.

zikibols is that product: a Kickstarter-style app for **tokenized real-world cashflows**, built for [ETHOnline 2026](https://ethglobal.com/events/ethonline2026). One app, three load-bearing sponsor integrations — Privy for login and the pledge, The Graph for live diligence, Hedera for paid risk notes, HCS audit, and the HTS token lifecycle.

It is not a general crowdfunding clone. A founder starts a **campaign** — a diligence-gated listing for **invoice receivables** or **revenue-share** assets. After funding, the token lifecycle looks like Asset Tokenization Studio (issue → transfer → freeze/pause → coupon), not a launchpad.

Due diligence has two layers:

1. **The campaign (free).** When a founder starts a campaign they publish the story, creator **name**, optional **email**, and Ethereum wallet. That is the public brief anyone can read without paying.
2. **Paid due diligence.** Before pledging, a backer can **Check this creator**. The agent queries live DeFi books, then **pays** for independent public-web research on that name and email, folds a sourced profile into an x402 risk note, and hashes it onto HCS.

A backer can:

1. Read the **campaign**, then **Check the creator** (paid Graph + founder research) before sending money
2. **Pledge HBAR** after logging in with email or social (no seed phrase)
3. See the campaign turn into a **restricted Hedera token**, then a **coupon** that needs two people to release

Two demo campaigns ship with the app; you can also **Start a campaign**. Paid diligence settles on-chain, and the token can be frozen. Missing keys fail on purpose — the dashboard never invents Graph, payment, or founder-search data.

Hackathon prize mapping and remaining work: [PLAN.md](./PLAN.md).

---

## What you get

| Piece | In plain words |
|---|---|
| **Privy** | Log in with email or social. You get an embedded wallet and pledge real HBAR on Hedera testnet. |
| **The Graph** | One lending query against **Aave v3**, **Compound v3**, and **Spark Lend**. Same schema, three books. |
| **Founder search** | Paid public-web profile from the **campaign’s** founder **name** and optional **email** (Tavily). Missing key skips the profile; it does not invent one. |
| **Hedera** | The agent **pays** for a written risk note (x402), then hashes it onto **HCS**. Operators issue an HTS bond/share, freeze it, then pay a coupon after a 2-of-2 sign-off. |

Two seed campaigns ship with the app:

| Campaign | What it is |
|---|---|
| **Harbor Credit** (`/campaigns/harbor-credit`) | 90-day Rotterdam freight invoice, tokenized as bond `HIB26` |
| **Northwind Farms** (`/campaigns/northwind-farms`) | Greenhouse working capital, freezeable harvest share `NWH26` |

---

## Quick start

You need **Node.js 20+** and npm.

```bash
git clone https://github.com/yabuking84/zikibols.git
cd zikibols
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The dashboard **Integrations** row is the source of truth. Each card is **Ready** or **Needs env**. Fill `.env.local` until the pieces you want to demo are Ready, then restart `npm run dev`.

### Public URL for judges

Host `npm run build && npm run start` on a VM with a **writable disk** so `.data/state.json` survives. Vercel-style read-only filesystems keep the UI but lose the campaign book on restart (on-chain HashScan txs still stand). Copy the same env vars as `.env.local` into the host. Do not commit secrets.

P0 still includes recording the ≤5 min demo with HashScan links in frame (see [PLAN.md](./PLAN.md)).

---

## Fill in `.env.local`

Copy from `.env.example`. You do not need every key to click around, but each missing group turns that integration off.

### 1. Privy — login and pledges

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | [Privy dashboard](https://dashboard.privy.io). Create an app, enable **Hedera testnet** (chain id **296**). |
| `NEXT_PUBLIC_CAMPAIGN_TREASURY` | Optional. EVM address that receives pledges. If empty, each campaign uses its built-in treasury address. |

Without Privy, you can still browse campaigns. You cannot log in or pledge.

### 2. The Graph — “Check this creator”

| Variable | Where to get it |
|---|---|
| `THEGRAPH_API_KEY` | [The Graph Subgraph Studio](https://thegraph.com/studio/) gateway key. |

Without this key, **Check this creator** fails on purpose. There is no fake Graph fallback. The same Messari query hits Aave v3, Compound v3, and Spark Lend; one book failing still returns the others.

### 3. Founder search — public-web profile (optional)

| Variable | Where to get it |
|---|---|
| `TAVILY_API_KEY` | [Tavily](https://tavily.com) search key. |

The agent searches the public web for the campaign’s founder **name** and optional **email**, then compiles a sourced profile. No key (or zero hits) → the Check this creator step is labeled skipped. There is no fake biography.

### 4. Hedera x402 — the agent pays for the risk note

Create a funded Hedera **testnet** account at the [Hedera portal](https://portal.hedera.com/) (use the faucet).

| Variable | What it is |
|---|---|
| `HEDERA_PAY_TO_ACCOUNT` | Account that **receives** the small x402 fee. Prefer a **different** id from the agent. If they match, the first Check this creator creates a dedicated receiver (costs a little testnet HBAR) and stores it in `.data/state.json`. |
| `HEDERA_AGENT_ACCOUNT_ID` | Account the agent **pays from**. Must have testnet HBAR. |
| `HEDERA_AGENT_PRIVATE_KEY` | Private key for that agent account. |
| `X402_FACILITATOR_URL` | Defaults to `https://api.testnet.blocky402.com`. Leave it unless you know you need another facilitator. |

The agent calls `POST /api/risk-report`. That endpoint is paywalled: no payment, no note. After a successful check you get a HashScan link.

### 5. Hedera HTS — issue, airdrop, freeze, coupon

These power the **Operator desk**.

| Variable | What it is |
|---|---|
| `HEDERA_OPERATOR_ACCOUNT_ID` + `HEDERA_OPERATOR_PRIVATE_KEY` | Optional. If unset, the app uses the **agent** pair above to issue tokens. |
| `HEDERA_BACKER_ACCOUNT_ID` | Optional default. Hedera account that receives **one share** if the operator desk has no backer saved. If neither is set, Freeze **pauses the whole token** instead of freezing one account. |

Fund the operator (or agent) account on testnet. Issuing a token and paying a coupon spends HBAR.

### 6. Optional

| Variable | What it does |
|---|---|
| `OPENAI_API_KEY` | Rewrites the risk note and founder profile with an LLM. If missing, the agent still queries Graph, still pays x402, and writes a **heuristic** note (labeled in the UI). |
| `OPENAI_MODEL` | Defaults to `gpt-4o-mini` if you set a key. |
| `ZIKIBOLS_DATA_PATH` | Where pledges, token ids, HCS topic id, and 2-of-2 approvals are saved. Default: `.data/state.json`. |
| `HEDERA_HCS_TOPIC_ID` | Optional. Reuse an existing consensus topic for paid-note hashes. If unset, the first Check this creator with operator keys creates one. |

Never commit `.env.local`.

---

## Manual

Two roles share the same app:

- **Backer** — dashboard and campaign page. Check the creator, then pledge.
- **Operator** — Operator desk. Issue the token, freeze it, release the coupon.

### Dashboard (`/`)

You will see:

- Campaign stats (how many raises, total pledged)
- **How a backer funds** (three steps)
- **Integrations** — Privy / The Graph / Founder search / Hedera x402 / Hedera HTS, each Ready or Needs env
- The two campaign cards, plus **Start a campaign**
- Recent pledges

Use **⌘K** (or **Ctrl+K**) to search campaigns. Log in from the sidebar. Theme toggle is in the shell.

### As a backer

1. Open a campaign, e.g. Harbor Credit, from the dashboard or the sidebar.
2. Read the story and the progress bar.
3. Click **Check this creator**. Wait while the agent:
   - queries Aave v3, Compound v3, and Spark Lend (one Messari schema)
   - searches the public web for the founder name (and email if the campaign has one)
   - pays for a risk note on Hedera
   - hashes that note onto HCS when operator keys are set
   - shows TVL, positions, a founder profile with source links (or a skipped label), HashScan payment, and HCS links
4. Log in with Privy (email or social). An embedded wallet is created for you.
5. Fund that wallet with **Hedera testnet HBAR** if it is empty (Privy + [Hedera faucet](https://portal.hedera.com/)).
6. Choose an amount (10 / 50 / 100 ℏ, or type your own) and click **Pledge with Privy wallet**.
7. Confirm the transfer. You should see:
   - a HashScan link for the pledge
   - **Recent pledges** updated
   - **Your pledges** with your running total

**Check the creator first** is the intended path. **Pledge anyway** skips diligence on purpose — use it only if Graph/x402 is down and you still need to show a transfer.

Token issue / freeze / coupon are **not** on this page. Those live on the Operator desk.

### As an operator

1. Open **Operator desk** in the sidebar, or go to `/campaigns/<slug>/operate`.
2. **Save backer** — Hedera account `0.0.xxxxx` that should receive one share. After a Privy pledge, the desk offers **Use this account** by mapping that wallet through the Hedera mirror node. You can still type an account, or fall back to `HEDERA_BACKER_ACCOUNT_ID`.
3. **Issue token** — creates the HTS bond or share on Hedera testnet. You get a token id and HashScan link.
4. **Transfer share** — airdrops **one** unit to that backer account.
5. **Freeze / pause** — freezes that holder, or pauses the token if there is no backer account.
6. **Approve as founder** — log in with Privy and click once. This is founder 1.
7. **Co-sign as treasury** — operator click. This is founder 2.
8. **Release coupon** — enabled only after both approvals **and** the token is frozen. Sends a small HBAR coupon to the backer account. HashScan link appears.

Coupon size is a lifecycle proof (tinybars), not a real yield calculation.

---

## What is live vs stored locally

| Layer | Survives restart? | What it is |
|---|---|---|
| **On-chain (Hedera testnet)** | Yes | Privy HBAR pledges, x402 risk-note payment, HCS topic messages, HTS issue / airdrop / freeze / coupon. [HashScan](https://hashscan.io/testnet) is the source of truth. |
| **The Graph** | Live query | Aave v3 + Compound v3 + Spark Lend via the Graph Gateway. One book failing does not kill Check this creator. No key → Check this creator fails. |
| **Founder search** | Live query | Tavily public-web snippets for founder name + optional email. No key → profile step skipped, Check this creator still runs. |
| **HCS audit** | Yes, on disk + chain | Topic id in `.data/state.json` or `HEDERA_HCS_TOPIC_ID`. Message is SHA-256 of the paid note and founder profile, not the full paragraph. Skip if operator keys are missing. |
| **Campaign book** | Yes, on disk | Pledges, created campaigns, token ids, backer account, and 2-of-2 approvals in `.data/state.json` (or `ZIKIBOLS_DATA_PATH`). Lost only if you delete that file. On a read-only host this falls back to process memory. |
| **Seed copy** | In git | Harbor Credit and Northwind Farms text, goals, and starting pledged totals in `src/lib/campaigns.ts`. |

---

## If something looks broken

Check **Integrations** on the dashboard first.

| Symptom | Likely cause |
|---|---|
| Pledge says add `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app id missing. Restart after editing `.env.local`. |
| **Check this creator** errors | `THEGRAPH_API_KEY` missing or invalid, or every lending book failed. |
| Check runs but founder profile is skipped | Expected without `TAVILY_API_KEY`, or no public-web hits. Diligence still succeeds. |
| Check runs Graph but HCS link is missing | Expected without operator/agent Hedera keys. Diligence still succeeds. |
| Check runs Graph but fails on the paid note | x402 env incomplete, or the agent account has no testnet HBAR. Same payTo and agent is OK: the app creates a dedicated receiver on first check. |
| **Issue token** stays disabled | Operator/agent Hedera keys missing, or the token is already issued. |
| **Transfer share** stays disabled | Issue the token, then save a backer `0.0.x`. After a Privy pledge, use **Use this account** on the Operator desk (or set `HEDERA_BACKER_ACCOUNT_ID`). |
| **Release coupon** stays disabled | Freeze first, then both **Approve as founder** and **Co-sign as treasury**. |
| Pledge sent but “campaign book could not be updated” | On-chain transfer succeeded; local `.data/state.json` write failed. HashScan still has the tx. |
| Heuristic note instead of LLM note | Expected without `OPENAI_API_KEY`. |

This is **Hedera testnet** only. Do not use mainnet keys or real money.

---

## Architecture

```
Backer UI                    Agent                         Hedera testnet
─────────                    ─────                         ──────────────
Campaign page ──POST /api/agent──► query Aave+Compound+Spark Graph Gateway
                                 │  (same Messari query; one book can fail)
                                 ├── searchFounder ──Tavily──► public-web snippets
                                 ▼
                              buyRiskReport ──x402──► POST /api/risk-report
                                 │                     (Blocky402 settle)
                                 ▼
                              heuristic or LLM note + founder profile
                                 │
                                 ▼
                              publishAudit ──HCS──► topic message (note + profile hash)

Privy wallet ──HBAR tx──► campaign treasury (EVM 296)
         └──POST /api/pledges──► .data/state.json + pledgedHbar

Operator desk (`/campaigns/[slug]/operate`)
         └──issue/airdrop/freeze──► HTS
         └──2-of-2──► payCoupon (HBAR to backer account)
```

| Area | File |
|---|---|
| Campaign fixtures | `src/lib/campaigns.ts` |
| Persisted book | `src/lib/store.ts` |
| Graph lending query | `src/lib/graph.ts` |
| Founder web search | `src/lib/founder-search.ts` |
| Agent tool loop | `src/lib/agent.ts`, `src/app/api/agent/route.ts` |
| HCS paid-note hash | `src/lib/hcs.ts` |
| Paid risk note | `src/app/api/risk-report/route.ts` |
| Privy pledge UI | `src/components/pledge-panel.tsx` |
| Operator desk | `src/app/campaigns/[slug]/operate/page.tsx` |
| Create campaign | `src/app/campaigns/new/page.tsx` |
| HTS issue / freeze / coupon | `src/lib/hts.ts` |

## Tokenization (ATS-shaped HTS)

Hedera’s prize text names [Asset Tokenization Studio](https://github.com/hashgraph/asset-tokenization-studio). This app implements the **same lifecycle on Hedera Token Service**, not the ATS SDK:

1. **Issue** a freezeable, pausable share/bond (`TokenCreateTransaction` with freeze + pause keys).
2. **Transfer** one unit to a named backer account (Operator desk field, or `HEDERA_BACKER_ACCOUNT_ID`).
3. **Freeze** that holder (or pause the token if there is no backer).
4. **Coupon** as an HBAR payout after founder (Privy) + treasury operator both approve.

That is the corporate-action shape ATS already documents (issuance, transfer restriction, distribution). Wiring the ATS SDK is a stretch goal; HashScan is what judges can verify today.

Stack: Next.js 16, React 19, Privy, viem, `@hashgraph/sdk`, `@x402/*`, Tailwind 4.
