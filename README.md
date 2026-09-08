# zikibols

zikibols is a Kickstarter-style app for **tokenized cashflows** — things like an invoice bond or a harvest revenue share — built for [ETHOnline 2026](https://ethglobal.com/events/ethonline2026).

A backer can:

1. **Check the creator** against live DeFi data before sending money
2. **Pledge HBAR** after logging in with email or social (no seed phrase)
3. See the raise turn into a **restricted Hedera token**, then a **coupon** that needs two people to release

It is not a general crowdfunding clone. Two demo campaigns ship with the app; you can also **Start a campaign**. Diligence is paid on-chain, and the token can be frozen. Missing keys fail on purpose — the dashboard never invents Graph or payment data.

Hackathon prize mapping and remaining work: [PLAN.md](./PLAN.md).

---

## What you get

| Piece | In plain words |
|---|---|
| **Privy** | Log in with email or social. You get an embedded wallet and pledge real HBAR on Hedera testnet. |
| **The Graph** | One lending query against **Aave v3**, **Compound v3**, and **Spark Lend**. Same schema, three books. |
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

### 3. Hedera x402 — the agent pays for the risk note

Create a funded Hedera **testnet** account at the [Hedera portal](https://portal.hedera.com/) (use the faucet).

| Variable | What it is |
|---|---|
| `HEDERA_PAY_TO_ACCOUNT` | Account that **receives** the small x402 fee (e.g. `0.0.xxxxx`). |
| `HEDERA_AGENT_ACCOUNT_ID` | Account the agent **pays from**. Must have testnet HBAR. |
| `HEDERA_AGENT_PRIVATE_KEY` | Private key for that agent account. |
| `X402_FACILITATOR_URL` | Defaults to `https://api.testnet.blocky402.com`. Leave it unless you know you need another facilitator. |

The agent calls `POST /api/risk-report`. That endpoint is paywalled: no payment, no note. After a successful check you get a HashScan link.

### 4. Hedera HTS — issue, airdrop, freeze, coupon

These power the **Operator desk**.

| Variable | What it is |
|---|---|
| `HEDERA_OPERATOR_ACCOUNT_ID` + `HEDERA_OPERATOR_PRIVATE_KEY` | Optional. If unset, the app uses the **agent** pair above to issue tokens. |
| `HEDERA_BACKER_ACCOUNT_ID` | Optional default. Hedera account that receives **one share** if the operator desk has no backer saved. If neither is set, Freeze **pauses the whole token** instead of freezing one account. |

Fund the operator (or agent) account on testnet. Issuing a token and paying a coupon spends HBAR.

### 5. Optional

| Variable | What it does |
|---|---|
| `OPENAI_API_KEY` | Rewrites the risk note with an LLM. If missing, the agent still queries Graph, still pays x402, and writes a **heuristic** note (labeled in the UI). |
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
- **Integrations** — Privy / The Graph / Hedera x402 / Hedera HTS, each Ready or Needs env
- The two campaign cards, plus **Start a campaign**
- Recent pledges

Use **⌘K** (or **Ctrl+K**) to search campaigns. Log in from the sidebar. Theme toggle is in the shell.

### As a backer

1. Open a campaign, e.g. Harbor Credit, from the dashboard or the sidebar.
2. Read the story and the progress bar.
3. Click **Check this creator**. Wait while the agent:
   - queries Aave v3, Compound v3, and Spark Lend (one Messari schema)
   - pays for a risk note on Hedera
   - hashes that note onto HCS when operator keys are set
   - shows TVL, positions, a written summary, HashScan payment, and HCS links
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
2. **Save backer** — Hedera account `0.0.xxxxx` that should receive one share. You can still fall back to `HEDERA_BACKER_ACCOUNT_ID` in env.
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
| **HCS audit** | Yes, on disk + chain | Topic id in `.data/state.json` or `HEDERA_HCS_TOPIC_ID`. Message is a SHA-256 of the paid note, not the full paragraph. Skip if operator keys are missing. |
| **Campaign book** | Yes, on disk | Pledges, created campaigns, token ids, backer account, and 2-of-2 approvals in `.data/state.json` (or `ZIKIBOLS_DATA_PATH`). Lost only if you delete that file. On a read-only host this falls back to process memory. |
| **Seed copy** | In git | Harbor Credit and Northwind Farms text, goals, and starting pledged totals in `src/lib/campaigns.ts`. |

---

## If something looks broken

Check **Integrations** on the dashboard first.

| Symptom | Likely cause |
|---|---|
| Pledge says add `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app id missing. Restart after editing `.env.local`. |
| **Check this creator** errors | `THEGRAPH_API_KEY` missing or invalid, or every lending book failed. |
| Check runs Graph but HCS link is missing | Expected without operator/agent Hedera keys. Diligence still succeeds. |
| Check runs Graph but fails on the paid note | x402 env incomplete, or the agent account has no testnet HBAR. |
| **Issue token** stays disabled | Operator/agent Hedera keys missing, or the token is already issued. |
| **Transfer share** stays disabled | Save a backer account `0.0.x` on the Operator desk (or set `HEDERA_BACKER_ACCOUNT_ID`), and issue the token first. |
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
                                 ▼
                              buyRiskReport ──x402──► POST /api/risk-report
                                 │                     (Blocky402 settle)
                                 ▼
                              heuristic or LLM note
                                 │
                                 ▼
                              publishAudit ──HCS──► topic message (note hash)

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
