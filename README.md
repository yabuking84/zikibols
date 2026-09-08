# zikibols

A backer should be able to fund an invoice bond or harvest share without a seed phrase, without trusting a screenshot of "DeFi history," and without receiving a meme ticker.

zikibols is that product: a crowdfunding app for **tokenized real-world cashflows**, built from scratch for [ETHOnline 2026](https://ethglobal.com/events/ethonline2026). One app, three load-bearing sponsor integrations — Privy for login and the pledge, The Graph for live diligence, Hedera for paid risk notes, an HCS audit trail, and the token lifecycle.

It is not a general crowdfunding clone. A founder starts a **campaign** — a diligence-gated listing for **invoice receivables** or **revenue-share** assets. After funding, the campaign becomes a restricted token with a coupon that needs two people to release.

Due diligence has two layers:

1. **The campaign (free).** When a founder starts a campaign they publish the story, creator **name**, optional **email**, and Ethereum wallet. That is the public brief anyone can read without paying.
2. **Paid due diligence.** Before pledging, a backer can **Check this creator**. The agent queries live DeFi books, searches the public web for that name and email, **pays** Hedera x402 for a written risk note, and hashes the result onto HCS.

A backer can:

1. Read the **campaign**, then **Check the creator** (live Graph + founder research + paid note) before sending money
2. **Pledge HBAR** after logging in with email or social (no seed phrase)
3. See the campaign turn into a **restricted Hedera token**, then a **coupon** that needs two people to release

Two demo campaigns ship with the app; you can also **Start a campaign**. Missing keys fail on purpose — the dashboard never invents Graph, payment, or founder-search data.

Plan, prize mapping, schedule, and known gaps: [PLAN.md](./PLAN.md).

---

## Hackathon tracks

Submitted to three partners (the ETHGlobal cap): **Hedera**, **The Graph**, **Privy**. What each judge can verify on testnet:

| Track | The sentence | Verify |
|---|---|---|
| Hedera — AI & Agentic Payments | The agent **pays x402** for the risk note through Blocky402, and the note hash lands on **HCS**. | HashScan payment tx + HCS topic link after **Check this creator** |
| Hedera — Tokenization of Anything | Bond/share with a real lifecycle: issue → transfer → freeze/pause → 2-of-2 coupon. **Today on HTS; ATS issuance is in progress** (see [Tokenization](#tokenization)). | HashScan token, freeze tx, coupon tx from the Operator desk |
| The Graph — Composable / Standardized | **One Messari query, three protocols** (Aave v3, Compound v3, Spark Lend). One book can fail without killing diligence. | Lending books in the check result; `src/lib/graph.ts` |
| The Graph — AI Use Case (From Scratch) | The agent reasons over live Graph data, **gates the Pledge button** on the result, and pays for the note autonomously. | Check → Pledge flow; LLM note badge when `OPENAI_API_KEY` is set |
| Privy — Best financial flow | Email login → embedded wallet → **HBAR transfer on Hedera** (chain 296). No extension, no seed phrase. | HashScan pledge tx + **Your pledges** |

**From scratch.** First commit 8 Sep 2026, inside the event window. No project-specific prior code; open-source starter conventions only (Next.js, shadcn-style UI primitives).

---

## What you get

| Piece | In plain words |
|---|---|
| **Privy** | Log in with email or social. You get an embedded wallet and pledge real HBAR on Hedera testnet. |
| **The Graph** | One lending query against **Aave v3**, **Compound v3**, and **Spark Lend**. Same schema, three books. |
| **Founder search** | Public-web profile from the **campaign's** founder **name** and optional **email** (Tavily). Missing key skips the profile; it does not invent one. |
| **Hedera** | The agent **pays** for a written risk note (x402), then hashes it onto **HCS**. Operators issue a bond/share, freeze it, then pay a coupon after a 2-of-2 sign-off. |

Two seed campaigns ship with the app:

| Campaign | What it is |
|---|---|
| **Harbor Credit** (`/campaigns/harbor-credit`) | 90-day Rotterdam freight invoice, tokenized as bond `HIB26` |
| **Northwind Farms** (`/campaigns/northwind-farms`) | Greenhouse working capital, freezeable harvest share `NWH26` |

Seed pledged totals and backer counts are **fixtures** in `src/lib/campaigns.ts`; only pledges made through the app have HashScan txs.

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

Host `npm run build && npm run start` on a machine with a **writable disk** so `.data/state.json` survives. Read-only or ephemeral filesystems keep the UI but lose the campaign book on restart (on-chain HashScan txs still stand).

Pin these in the host env so a cold start does not create a new x402 receiver account or a new HCS topic:

```bash
HEDERA_PAY_TO_ACCOUNT=<the receiver already stored in .data/state.json>
HEDERA_HCS_TOPIC_ID=<the topic already stored in .data/state.json>
NEXT_PUBLIC_CAMPAIGN_TREASURY=<an EVM address you control>
```

Copy the rest of `.env.local` as-is. Do not commit secrets.

---

## Fill in `.env.local`

Copy from `.env.example`. You do not need every key to click around, but each missing group turns that integration off.

### 1. Privy — login and pledges

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | [Privy dashboard](https://dashboard.privy.io). Create an app, enable **Hedera testnet** (chain id **296**). |
| `NEXT_PUBLIC_CAMPAIGN_TREASURY` | EVM address that receives pledges. **Set this** to an account you control — ideally the operator account's EVM alias, so coupons visibly leave the same treasury that received pledges. If empty, campaigns fall back to a built-in placeholder address. |

Without Privy, you can still browse campaigns. You cannot log in or pledge.

**How Privy improves the flow.** A backer never installs an extension or writes down a seed phrase. Login is email or social; Privy creates an embedded EVM wallet on first login (`createOnLogin: "users-without-wallets"`). The app registers Hedera testnet as the only supported chain, calls `switchChain(296)` and `sendTransaction` through the wallet's EIP-1193 provider, and shows the HashScan link when the transfer lands. Gas, chain ids, and RPC endpoints are hidden from the backer; the only decision is the amount.

### 2. The Graph — "Check this creator"

| Variable | Where to get it |
|---|---|
| `THEGRAPH_API_KEY` | [The Graph Subgraph Studio](https://thegraph.com/studio/) gateway key. |

Without this key, **Check this creator** fails on purpose. There is no fake Graph fallback.

**Standards leverage.** The agent writes one GraphQL query against the Messari standardized lending schema and runs it, unchanged, against three subgraph deployments:

```graphql
query LendingSnapshot {
  lendingProtocols {
    name slug
    totalValueLockedUSD totalDepositBalanceUSD totalBorrowBalanceUSD
    cumulativeDepositUSD cumulativeBorrowUSD cumulativeLiquidateUSD
  }
}
```

The same `account(id)` query returns the creator wallet's positions and liquidation count from each book. Because the schema is shared, adding a protocol is one line in `LENDING_SUBGRAPHS`; the note, the comparison, and the UI need no changes. One deployment failing is reported as an unavailable book and the other two still return. See `src/lib/graph.ts`.

### 3. Founder search — public-web profile (optional)

| Variable | Where to get it |
|---|---|
| `TAVILY_API_KEY` | [Tavily](https://tavily.com) search key. |

The agent searches the public web for the campaign's founder **name** and optional **email**, then compiles a sourced profile. No key (or zero hits) → the step is labeled skipped. There is no fake biography.

### 4. Hedera x402 — the agent pays for the risk note

Create a funded Hedera **testnet** account at the [Hedera portal](https://portal.hedera.com/) (use the faucet).

| Variable | What it is |
|---|---|
| `HEDERA_PAY_TO_ACCOUNT` | Account that **receives** the x402 fee. Prefer a **different** id from the agent. If they match, the first Check this creator creates a dedicated receiver (costs a little testnet HBAR) and stores it in `.data/state.json`. |
| `HEDERA_AGENT_ACCOUNT_ID` | Account the agent **pays from**. Must have testnet HBAR. |
| `HEDERA_AGENT_PRIVATE_KEY` | Private key for that agent account. |
| `X402_FACILITATOR_URL` | Defaults to `https://api.testnet.blocky402.com` (Blocky402 testnet facilitator). |
| `X402_PRICE_TINYBARS` | Optional. Price per risk note. Default `100000` (0.001 ℏ). |

#### Payment flow

1. `POST /api/agent` runs the diligence agent (`src/lib/agent.ts`).
2. The agent calls `POST /api/risk-report` with the live Graph snapshot and founder profile. That route is wrapped in `withX402` (`@x402/next`) with the `exact` scheme on `hedera:testnet`, asset HBAR, `payTo` = the receiver account.
3. The route answers **402** with a `PAYMENT-REQUIRED` header. The agent's `wrapFetchWithPayment` client (`@x402/fetch` + `@x402/hedera`) signs an HBAR transfer with `HEDERA_AGENT_PRIVATE_KEY`, retries with `PAYMENT-SIGNATURE`, and Blocky402 settles it.
4. The route runs `writeRiskNote` and returns the paragraph; the settlement tx id comes back in `PAYMENT-RESPONSE` and is shown as **Hedera payment tx**.
5. `publishRiskAudit` writes `{ noteSha256, profileSha256, x402 tx id, protocols }` to the HCS topic — a verifiable payment audit trail on HCS.

The service is a real paywall, not a flag. Without a payment header it refuses:

```bash
curl -i -X POST http://localhost:3000/api/risk-report \
  -H 'content-type: application/json' \
  -d '{"campaignTitle":"Harbor Credit","creatorWallet":"0x1111111254eeb25477b68fb85ed929f73a960582","lending":[],"accounts":[]}'
# HTTP/1.1 402 Payment Required
# payment-required: <base64url JSON with scheme, network, payTo, amount>
```

The header is base64url; decode it with `echo '<value>' | tr '_-' '/+' | base64 -d` to see the scheme, price, and receiver.

### 5. Hedera HTS — issue, airdrop, freeze, coupon

These power the **Operator desk**.

| Variable | What it is |
|---|---|
| `HEDERA_OPERATOR_ACCOUNT_ID` + `HEDERA_OPERATOR_PRIVATE_KEY` | Optional. If unset, the app uses the **agent** pair above to issue tokens and pay coupons. |
| `HEDERA_BACKER_ACCOUNT_ID` | Optional default. Hedera account that receives **one share** if the operator desk has no backer saved. If neither is set, Freeze **pauses the whole token** instead of freezing one account. |

Fund the operator (or agent) account on testnet. Issuing a token and paying a coupon spends HBAR.

### 6. Optional

| Variable | What it does |
|---|---|
| `OPENAI_API_KEY` | Rewrites the risk note and founder profile with an LLM. If missing, the agent still queries Graph, still pays x402, and writes a **heuristic** note (labeled in the UI). Set it for demos of the AI track. |
| `OPENAI_MODEL` | Defaults to `gpt-4o-mini` if you set a key. |
| `ZIKIBOLS_DATA_PATH` | Where pledges, token ids, HCS topic id, x402 receiver, and 2-of-2 approvals are saved. Default: `.data/state.json`. |
| `HEDERA_HCS_TOPIC_ID` | Reuse an existing consensus topic for paid-note hashes. If unset, the first Check this creator with operator keys creates one and stores it. |

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
- The campaign cards, plus **Start a campaign**
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
5. Fund that wallet with **Hedera testnet HBAR** if it is empty ([Hedera faucet](https://portal.hedera.com/)).
6. Choose an amount (10 / 50 / 100 ℏ, or type your own) and click **Pledge with Privy wallet**.
7. Confirm the transfer. You should see:
   - a HashScan link for the pledge
   - **Recent pledges** updated
   - **Your pledges** with your running total

**Check the creator first** is the intended path; the Pledge button is disabled until the agent has run. **Pledge anyway** skips diligence on purpose — use it only if Graph/x402 is down and you still need to show a transfer.

Token issue / freeze / coupon are **not** on this page. Those live on the Operator desk.

### As an operator

1. Open **Operator desk** in the sidebar, or go to `/campaigns/<slug>/operate`.
2. **Save backer** — Hedera account `0.0.xxxxx` that should receive one share. After a Privy pledge, the desk offers **Use this account** by mapping that wallet through the Hedera mirror node. You can still type an account, or fall back to `HEDERA_BACKER_ACCOUNT_ID`.
3. **Issue token** — creates the HTS bond or share on Hedera testnet with freeze and pause keys. You get a token id and HashScan link.
4. **Transfer share** — airdrops **one** unit to that backer account.
5. **Freeze / pause** — freezes that holder, or pauses the token if there is no backer account.
6. **Approve as founder** — log in with Privy and click once. This is founder 1.
7. **Co-sign as treasury** — operator click. This is founder 2.
8. **Release coupon** — enabled only after both approvals **and** the token is frozen. Sends a small HBAR coupon to the backer account. HashScan link appears.

Coupon size is a lifecycle proof (tinybars), not a real yield calculation.

---

## Tokenization

Hedera's Tokenization track requires [Asset Tokenization Studio](https://github.com/hashgraph/asset-tokenization-studio). **Status:**

- **Today:** the lifecycle runs on Hedera Token Service via `@hashgraph/sdk` (`src/lib/hts.ts`): issue a freezeable, pausable token → airdrop one unit → freeze the holder or pause the token → HBAR coupon after 2-of-2. Everything is verifiable on HashScan.
- **In progress:** issuing the bond through the ATS SDK (`@hashgraph/asset-tokenization-sdk`, testnet factory/resolver), minting one unit to the backer's Privy EVM address, pause / control list as the compliance op, and an on-chain coupon record before the HBAR payout. Route, kill criterion, and lifecycle mapping are in [PLAN.md](./PLAN.md).

If the ATS integration is not merged by submission, this section will say so and the Tokenization track is not claimed. The HTS lifecycle stays as the token layer either way.

---

## What is live vs stored locally

| Layer | Survives restart? | What it is |
|---|---|---|
| **On-chain (Hedera testnet)** | Yes | Privy HBAR pledges, x402 risk-note payment, HCS topic messages, HTS issue / airdrop / freeze / coupon. [HashScan](https://hashscan.io/testnet) is the source of truth. |
| **The Graph** | Live query | Aave v3 + Compound v3 + Spark Lend via the Graph Gateway. One book failing does not kill Check this creator. No key → Check this creator fails. |
| **Founder search** | Live query | Tavily public-web snippets for founder name + optional email. No key → profile step skipped, Check this creator still runs. |
| **HCS audit** | Yes, on disk + chain | Topic id in `.data/state.json` or `HEDERA_HCS_TOPIC_ID`. Message is SHA-256 of the paid note and founder profile plus the x402 tx id, not the full paragraph. Skipped if operator keys are missing. |
| **Campaign book** | Yes, on disk | Pledges, created campaigns, token ids, backer account, x402 receiver, and 2-of-2 approvals in `.data/state.json` (or `ZIKIBOLS_DATA_PATH`). On a read-only host this falls back to process memory. |
| **Seed copy** | In git | Harbor Credit and Northwind Farms text, goals, and starting pledged totals in `src/lib/campaigns.ts`. |

---

## Known gaps

Product debt we state up front, not hidden behavior:

| Gap | Detail |
|---|---|
| Service and consumer are the same app | The agent calls its own `/api/risk-report` over HTTP. The `curl` above shows the paywall exists independently of the agent. |
| "Approve as founder" is any logged-in Privy wallet | The payout route stores the wallet string; there is no signature and no check against the campaign's creator wallet. The 2-of-2 is stored flags, not a second key. |
| One share per campaign | The airdrop goes to one saved account (latest pledger via mirror mapping, or env), not every pledger. |
| Airdrop can land as pending | If the recipient has no free auto-association slots, `TokenAirdropTransaction` succeeds but the share is pending and Freeze fails. Privy-funded accounts normally have unlimited auto-associations. |
| Coupon is tinybars | Lifecycle proof, not yield. Maturity does not gate release. |
| Seed totals are fixtures | Only in-app pledges have HashScan txs. |
| Diligence can be skipped | Explicit **Pledge anyway** button. |
| No automated tests | Verify on the deployed URL or `npm run dev`. |

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
| **Freeze** fails with `TOKEN_NOT_ASSOCIATED_TO_ACCOUNT` | The airdrop is pending on the recipient. Have the backer claim it, or use an account with auto-associations. |
| **Release coupon** stays disabled | Freeze first, then both **Approve as founder** and **Co-sign as treasury**. |
| Pledge sent but "campaign book could not be updated" | On-chain transfer succeeded; local `.data/state.json` write failed. HashScan still has the tx. |
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
                              publishAudit ──HCS──► topic message (note hash, profile hash, x402 tx)

Privy wallet ──HBAR tx──► campaign treasury (EVM 296)
         └──POST /api/pledges──► .data/state.json + pledgedHbar (+ mirror 0x → 0.0.x)

Operator desk (`/campaigns/[slug]/operate`)
         └──issue/airdrop/freeze──► HTS (ATS in progress, see PLAN.md)
         └──2-of-2──► payCoupon (HBAR to backer account)
```

Planned before submission (tracked in [PLAN.md](./PLAN.md)): founder search behind a second x402 service priced per query, and ATS bond issuance.

| Area | File |
|---|---|
| Campaign fixtures | `src/lib/campaigns.ts` |
| Persisted book | `src/lib/store.ts` |
| Graph lending query | `src/lib/graph.ts` |
| Founder web search | `src/lib/founder-search.ts` |
| Agent tool loop | `src/lib/agent.ts`, `src/app/api/agent/route.ts` |
| x402 client + server config | `src/lib/x402.ts` |
| Paid risk note | `src/app/api/risk-report/route.ts`, `src/lib/risk-note.ts` |
| HCS paid-note hash | `src/lib/hcs.ts` |
| Privy provider / pledge UI | `src/components/providers.tsx`, `src/components/pledge-panel.tsx` |
| Operator desk | `src/app/campaigns/[slug]/operate/page.tsx`, `src/components/token-panel.tsx` |
| Create campaign | `src/app/campaigns/new/page.tsx`, `src/app/api/campaigns/route.ts` |
| HTS issue / freeze / coupon | `src/lib/hts.ts` |
| Env badges | `src/lib/status.ts`, `src/components/integration-status.tsx` |

Stack: Next.js 16, React 19, Privy, viem, `@hashgraph/sdk`, `@x402/*`, Tailwind 4.

---

## AI tools used

Per ETHGlobal's AI-usage rules, this is where AI assisted the build:

- **Cursor (agent mode)** was used throughout for scaffolding Next.js routes and components, drafting and reviewing `PLAN.md` and this README, and cross-checking the prize qualification requirements against the code.
- Sponsor integrations (Privy config, Graph queries and subgraph IDs, x402 server/client wiring, HTS and HCS transactions) were written with AI assistance and verified by hand against Hedera testnet and the Graph Gateway; HashScan links in the app are the evidence.
- No AI-generated data is shown in the product: Graph numbers, x402 settlements, and founder-search snippets are live or labeled skipped. The optional LLM (`OPENAI_API_KEY`) only rewrites the risk note and founder profile from provided inputs and is labeled **LLM note** in the UI; without it the note is a labeled heuristic.

Planning artifacts are in the repo: [PLAN.md](./PLAN.md).
