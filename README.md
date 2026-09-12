# Zikibols

## Invest & Relax

A backer should be able to fund an invoice bond or harvest share without a seed phrase, without trusting a screenshot of "DeFi history," and without receiving a meme ticker.

Zikibols is that product: a crowdfunding app for **tokenized real-world cashflows**, built from scratch for [ETHOnline 2026](https://ethglobal.com/events/ethonline2026). One app, three load-bearing sponsor integrations — Privy for login and the pledge, The Graph for live diligence, Hedera for paid risk notes, an HCS audit trail, and the token lifecycle.

It is not a general crowdfunding clone. A founder starts a **campaign** — a diligence-gated listing for **invoice receivables** or **revenue-share** assets. After funding, the campaign becomes a restricted token. The operator desk then empties the raise: most of it to the founder, the rest split pro-rata across every pledger.

Due diligence has two layers:

1. **The campaign (free).** When a founder starts a campaign they publish the story, creator **name**, optional **email**, and Ethereum wallet. That is the public brief anyone can read without paying.
2. **Paid due diligence.** Before pledging, a backer can **Check this creator**. The agent queries live DeFi books, searches the public web for that name and email, **pays** Hedera x402 for a written risk note, and hashes the result onto HCS.

A backer can:

1. Read the **campaign**, then **Check the creator** (live Graph + founder research + paid note) before sending money
2. **Pledge HBAR** after logging in with email or social (no seed phrase)
3. See the campaign turn into a **restricted Hedera token**, then **Pay founder** / **Pay backers** move the raise out of the treasury

Two demo campaigns ship with the app; you can also **Start a campaign**. Missing keys fail on purpose — the dashboard never invents Graph, payment, or founder-search data.

How the app works: [README-non-technical.md](./README-non-technical.md). How the whole app flows (diagrams): [README-flow.md](./README-flow.md). What **Check this creator** does, step by step: [README-creator-lookup.md](./README-creator-lookup.md). What ATS is and can do: [README-ats.md](./README-ats.md). What this prototype **can and cannot** do: [README-limitations.md](./README-limitations.md). Plan, prize mapping, schedule, and known gaps: [PLAN.md](./PLAN.md). The same notes are in the app at [`/docs`](/docs).

---

## Hackathon tracks

Submitted to three partners (the ETHGlobal cap): **Hedera**, **The Graph**, **Privy**. What each judge can verify on testnet:

| Track | The sentence | Verify |
|---|---|---|
| Hedera — AI & Agentic Payments | The agent **pays x402 twice** (founder search per query + risk note) through Blocky402; both tx ids and hashes land on **HCS**. | Two HashScan payment txs + HCS topic after **Check this creator** |
| Hedera — Tokenization of Anything | ATS bond: issue → mint one unit per unique pledger → pause the whole bond → settle the raise. | HashScan contract + pause tx + founder / backer payout txs from the Operator desk |
| The Graph — Composable / Standardized | **One Messari query, three protocols** (Aave v3, Compound v3, Spark Lend). One book can fail without killing diligence. | Lending books in the check result; `src/lib/graph.ts` |
| The Graph — AI Use Case (From Scratch) | The agent reasons over live Graph data, **gates the Pledge button** on the result, and pays for the note autonomously. | Check → Pledge flow; LLM note badge when `OPENAI_API_KEY` is set |
| Privy — Best financial flow | Email login → embedded wallet → **HBAR transfer on Hedera** (chain 296). No extension, no seed phrase. | HashScan pledge tx + **Your pledges** |

**From scratch.** First commit 8 Sep 2026, inside the event window. No project-specific prior code; open-source starter conventions only (Next.js, shadcn-style UI primitives).

### Testnet evidence (Harbor Credit)

These already landed on Hedera testnet. Harbor’s operator desk is **paid**; walk Issue → Settlement live on **Northwind Farms** (or a new campaign).

| What | HashScan |
|---|---|
| ATS bond diamond | [`0.0.10423725`](https://hashscan.io/testnet/contract/0.0.10423725) |
| Issue | [`0xc8c03897…`](https://hashscan.io/testnet/transaction/0xc8c03897f547618583ed2fef2d9a8317bcc0f6c0adab523a50107a974a4e9dfc) |
| Mint 1 unit | [`0x3649110d…`](https://hashscan.io/testnet/transaction/0x3649110d7566cec1790e7cbc6f28ea93f17b649eced7083c3f5ab0fc11f6dc6a) |
| Pause (compliance) | [`0xf57b9661…`](https://hashscan.io/testnet/transaction/0xf57b9661a0e52b6d039f32a2acffdcb87d12fb5b2bc425efbb4de68a0e2c3940) |
| Coupon record | [`0x35fd434f…`](https://hashscan.io/testnet/transaction/0x35fd434f02a91089f878fa70848c7fa29a87afd63ae9bc52b98733cceb29c1ad) |
| Coupon HBAR | [`0.0.10418801@1788882136.867281572`](https://hashscan.io/testnet/transaction/0.0.10418801-1788882136-867281572) |
| HCS audit topic | [`0.0.10421775`](https://hashscan.io/testnet/topic/0.0.10421775) |
| x402 payTo | [`0.0.10421774`](https://hashscan.io/testnet/account/0.0.10421774) |
| ATS factory / resolver | [`0.0.9213391`](https://hashscan.io/testnet/contract/0.0.9213391) / [`0.0.9212226`](https://hashscan.io/testnet/contract/0.0.9212226) |

### Settlement evidence (MTB Full Suspension Bike Frame)

Live raise of 13 ℏ from one Privy wallet. **Pay founder** sent 11.7 ℏ to the listing’s `creatorWallet` (HIP-583 created Hedera account `0.0.10502915`); **Pay backers** sent the remaining 1.3 ℏ in one transfer.

| What | HashScan |
|---|---|
| Founder payout (11.7 ℏ) | [`0x756673af…`](https://hashscan.io/testnet/transaction/0x756673af86afb5def6170a9f747f10364b97bbfa5cf18f122ef49571b374b60b) |
| Founder Hedera account | [`0.0.10502915`](https://hashscan.io/testnet/account/0.0.10502915) |
| Backer payout (1.3 ℏ) | [`0.0.10418801@1789223023.415706643`](https://hashscan.io/testnet/transaction/0.0.10418801-1789223023-415706643) |

---

## What you get

| Piece | In plain words |
|---|---|
| **Privy** | Log in with email or social. You get an embedded wallet and pledge real HBAR on Hedera testnet. |
| **The Graph** | One lending query against **Aave v3**, **Compound v3**, and **Spark Lend**. Same schema, three books. |
| **Founder search** | Public-web profile from the **campaign's** founder **name** and optional **email** (Tavily). Missing key skips the profile; it does not invent one. |
| **Hedera** | The agent **pays** for founder research and a written risk note (x402), then hashes both onto **HCS**. Operators issue an **ATS bond**, mint a share, pause it, then **settle the raise** (founder share + pro-rata backer pool). |

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
HEDERA_PAY_TO_ACCOUNT=0.0.10421774
HEDERA_HCS_TOPIC_ID=0.0.10421775
NEXT_PUBLIC_CAMPAIGN_TREASURY=0x7d5710637321f540b9ee8e1282c598d9b78f4f91
```

Copy the rest of `.env.local` as-is. Do not commit secrets.

In the [Privy dashboard](https://dashboard.privy.io) add the public origin to **Allowed origins** (and the `localhost:3000` origin you already use).

On a VPS with Docker:

```bash
docker compose --env-file .env.local up --build -d
```

On [Fly.io](https://fly.io) (this repo’s `fly.toml` pins a 1 GB volume at `/data` and keeps one machine running):

```bash
fly launch --copy-config --no-deploy
fly volumes create zikibols_data --size 1
fly secrets import < .env.local
set -a && source .env.local && set +a
fly deploy \
  --build-arg NEXT_PUBLIC_PRIVY_APP_ID="$NEXT_PUBLIC_PRIVY_APP_ID" \
  --build-arg NEXT_PUBLIC_CAMPAIGN_TREASURY="$NEXT_PUBLIC_CAMPAIGN_TREASURY"
```

That mounts a named volume at `/data` for `state.json`. Harbor Credit ships with its HashScan lifecycle already in the seed catalog, so a cold start still shows the paid bond. Walk Issue → Settlement live on Northwind Farms. Add the public origin in Privy **Allowed origins**.

---

## Fill in `.env.local`

Copy from `.env.example`. You do not need every key to click around, but each missing group turns that integration off.

### 1. Privy — login and pledges

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_PRIVY_APP_ID` | [Privy dashboard](https://dashboard.privy.io). Create an app, enable **Hedera testnet** (chain id **296**). |
| `NEXT_PUBLIC_CAMPAIGN_TREASURY` | EVM address that receives pledges. **Set this** to an account you control — ideally the operator account's EVM alias, so settlement leaves the same treasury that received pledges. If empty, campaigns fall back to a built-in placeholder address. |

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

### 4. Hedera x402 — the agent pays for founder search and the risk note

Create a funded Hedera **testnet** account at the [Hedera portal](https://portal.hedera.com/) (use the faucet).

| Variable | What it is |
|---|---|
| `HEDERA_PAY_TO_ACCOUNT` | Account that **receives** the x402 fee. Prefer a **different** id from the agent. If they match, the first Check this creator creates a dedicated receiver (costs a little testnet HBAR) and stores it in `.data/state.json`. |
| `HEDERA_AGENT_ACCOUNT_ID` | Account the agent **pays from**. Must have testnet HBAR. |
| `HEDERA_AGENT_PRIVATE_KEY` | Private key for that agent account. |
| `X402_FACILITATOR_URL` | Defaults to `https://api.testnet.blocky402.com` (Blocky402 testnet facilitator). |
| `X402_PRICE_TINYBARS` | Optional. Price **per query** (founder search) and per risk note. Default `100000` (0.001 ℏ). Name-only search is 1×; name+email is 2×. |

#### Payment flow

1. `POST /api/agent` runs the diligence agent (`src/lib/agent.ts`).
2. The agent pays **two** x402 services, both `exact` on `hedera:testnet` via Blocky402:
   - `POST /api/founder-search/1` or `/2` — Tavily public-web research, priced per query.
   - `POST /api/risk-report` — written risk note over the live Graph snapshot and founder profile.
3. Each route answers **402** with `PAYMENT-REQUIRED`. `wrapFetchWithPayment` (`@x402/fetch` + `@x402/hedera`) signs HBAR from `HEDERA_AGENT_PRIVATE_KEY` and retries with `PAYMENT-SIGNATURE`.
4. Both settlement tx ids are shown in the UI and written to HCS with `noteSha256` and `profileSha256` — a verifiable payment audit trail.

The services are real paywalls, not flags. Without a payment header they refuse:

```bash
curl -i -X POST http://localhost:3000/api/founder-search/1 \
  -H 'content-type: application/json' \
  -d '{"creatorName":"Harbor Desk BV","campaignTitle":"Harbor Credit","location":"Rotterdam"}'
# HTTP/1.1 402 Payment Required

curl -i -X POST http://localhost:3000/api/risk-report \
  -H 'content-type: application/json' \
  -d '{"campaignTitle":"Harbor Credit","creatorWallet":"0x1111111254eeb25477b68fb85ed929f73a960582","lending":[],"accounts":[]}'
# HTTP/1.1 402 Payment Required
# payment-required: <base64url JSON with scheme, network, payTo, amount>
```

The header is base64url; decode it with `echo '<value>' | tr '_-' '/+' | base64 -d` to see the scheme, price, and receiver.

### 5. Hedera ATS — issue, mint, pause

These power the **Operator desk**. The operator (or agent) key must be an **ECDSA** Hedera account with an EVM alias.

| Variable | What it is |
|---|---|
| `HEDERA_OPERATOR_ACCOUNT_ID` + `HEDERA_OPERATOR_PRIVATE_KEY` | Optional. If unset, the app uses the **agent** pair above to issue ATS bonds and settle the raise. |
| `HEDERA_BACKER_ACCOUNT_ID` | Optional default. Privy `0x` or Hedera `0.0.x` used by **Mint to another address** if you type nothing. Each unique pledger still has their own Mint button. Pause still pauses the whole bond with or without this. |
| `ATS_FACTORY_ID` / `ATS_RESOLVER_ID` | Optional. Defaults to the public testnet factory `0.0.9213391` and resolver `0.0.9212226` from Asset Tokenization Studio. |

Fund the operator (or agent) account on testnet. Issuing a token and settling the raise spends HBAR.

### 6. Optional

| Variable | What it does |
|---|---|
| `OPENAI_API_KEY` | Rewrites the risk note and founder profile with an LLM. If missing, the agent still queries Graph, still pays x402, and writes a **heuristic** note (labeled in the UI). Set it for demos of the AI track. |
| `OPENAI_MODEL` | Defaults to `gpt-4o-mini` if you set a key. |
| `ZIKIBOLS_DATA_PATH` | Where pledges, token ids, HCS topic id, x402 receiver, and settlement receipts are saved. Default: `.data/state.json`. |
| `HEDERA_HCS_TOPIC_ID` | Reuse an existing consensus topic for paid-note hashes. If unset, the first Check this creator with operator keys creates one and stores it. |

Never commit `.env.local`.

---

## Manual

Two roles share the same app:

- **Backer** — dashboard and campaign page. Check the creator, then pledge.
- **Operator** — back office after money is in. Issue the token, freeze it, then settle the raise. Pledges sit in the treasury until this role runs the ATS lifecycle.

### Dashboard (`/`)

You will see:

- Campaign stats (how many raises, total pledged)
- **How a backer funds** (three steps)
- **Integrations** — Privy / The Graph / Founder search / Hedera x402 / Hedera ATS, each Ready or Needs env
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

Token issue / pause / settlement are **not** on this page. Those live on the Operator desk.

### As an operator

The desk is the office after money is in. Two piles: **cash** (pledged HBAR in the treasury) and **certificate** (one ATS bond on Hedera). Pledging only fills the cash pile. Longer walk: [README-flow.md](./README-flow.md#operator-desk-and-the-bond).

1. Open **Operator desk** in the sidebar, or go to `/campaigns/<slug>/operate`.
2. **Issue bond** — deploys an ATS diamond clone on Hedera testnet (factory `0.0.9213391`). You get a contract id and HashScan link. Does not give anyone a share or move HBAR. Once only.
3. **Mint share** — only after **Issue bond**. One unit per unique pledger (whitelist first). A 13 ℏ pledge still mints **1**, not 13. Repeat for each wallet; the same wallet cannot be minted twice. Clicking mint before Issue opens a modal. After Pause, minting is closed. **Mint to another address** covers a `0x` / `0.0.x` that is not on the pledge list.
4. **Pause bond** — one stamp on the **whole** bond (compliance control), not per backer. Each mint already put that holder on the whitelist. The desk refuses to pause while any pledger is unminted. After this, minting is closed **and the campaign stops accepting pledges**.
5. **Unpause bond** — lifts that stamp. Transfers resume, minting reopens, and the listing takes new pledges again; settlement goes back to waiting for a pause. Only offered while the bond is paused, and refused once **Pay founder** or **Pay backers** has run — reopening a settled raise would take pledges no payout covers.
6. **Pay founder** — 90% of this campaign’s live pledges from the treasury to the wallet on the listing. The desk refuses until the bond is paused.
7. **Pay backers** — the other 10%, pro-rata by pledge amount, to backers who **hold a minted share**. Pause first; every pledger must also be minted. If either is missing, a modal explains and nothing is paid.

The **Settlement** block is the part that moves the raise.

**On HashScan:** pledge txs, the bond, each mint, pause, payouts. **Only in `state.json`:** the story, goal, progress bar, which pledge belongs to which campaign, and who already got a unit.

### Settlement — the raise leaves the treasury

Pledges land in one treasury (`NEXT_PUBLIC_CAMPAIGN_TREASURY`, the operator account's EVM alias). The Settlement block on the operator desk splits what a campaign actually raised and sends it out:

| Action | Amount | Where it goes |
|---|---|---|
| **Pay founder** | `PAYOUT_FOUNDER_PERCENT` of the raise (default 90%) | The campaign's `creatorWallet`. If that address has no Hedera account yet, the transfer lazy-creates one (HIP-583) that the same Ethereum key controls. |
| **Pay backers** | The remainder | Every pledger **holding a minted share**, pro-rata by pledge amount, as **one** atomic `TransferTransaction` — a single HashScan tx for the whole distribution. Blocked until every pledger has been minted. |

The raise is computed from real pledge rows in `state.json` only, never from `pledgedHbar` (which carries the Harbor / Northwind seed fixtures). Both actions refuse to run twice, refuse amounts over `PAYOUT_MAX_HBAR`, and refuse to take the treasury below `PAYOUT_RESERVE_HBAR` — that balance still has to pay x402 and ATS gas. Math is in `src/lib/settlement.ts`; the transfers are `payHbarMany` / `payHbarTo`.

**Mint every backer before paying them.** The backer pool follows the ATS bond: only a pledger holding a minted unit is paid. `settlementQuote` marks each backer `minted` from `runtime[slug].mints`, and `release-backers` returns `409` with the unminted wallets if any pledger is still without a share — so a partial distribution can never go out. Pledge amounts still set the split (one share each, but a 15 ℏ backer gets more than a 7 ℏ backer). **Pay founder** is unaffected; it pays the listing's wallet and ignores shares.

| Variable | Default | Meaning |
|---|---|---|
| `PAYOUT_FOUNDER_PERCENT` | `90` | Founder's share of the raise; the rest is the backer pool. |
| `PAYOUT_MAX_HBAR` | `100` | Cap per payout action. |
| `PAYOUT_RESERVE_HBAR` | `50` | HBAR the treasury must keep for x402 and ATS gas. |

### Who is the operator

In a real product this would be a named treasury: the campaign office, a lawyer, or a platform admin with the company wallet — not a random backer.

In this demo it is whoever runs the app and put Hedera keys in `.env.local`. On-chain issue / mint / pause / settlement are signed by `HEDERA_OPERATOR_ACCOUNT_ID` + `HEDERA_OPERATOR_PRIVATE_KEY`, or the `HEDERA_AGENT_*` pair if the operator pair is unset. The clicker’s Privy wallet is **not** what signs those txs. Missing keys → Issue stays disabled.

| Button | Who can press it |
|---|---|
| Issue / Mint / Pause / **Pay founder** / **Pay backers** | Anyone who opens `/campaigns/<slug>/operate`. There is **no operator login**. |

That access model is a known gap (see [Known gaps](#known-gaps)).

---

## Tokenization

Hedera's Tokenization track requires [Asset Tokenization Studio](https://github.com/hashgraph/asset-tokenization-studio). **Status: wired.**

The operator desk issues a bond through `@hashgraph/asset-tokenization-sdk` v8 against the public testnet factory `0.0.9213391` and resolver `0.0.9212226` (bond config id `…0002`, version queried on-chain). The SDK is browser/MetaMask-first; zikibols registers the RPC adapter headlessly and signs with the operator ECDSA key.

| Step | ATS call | What judges see |
|---|---|---|
| Issue | `Bond.create` | Diamond contract on HashScan (`0.0.x`) |
| Mint share | `Security.addToControlList` then `Security.issue` 1 unit to each unique pledger | Mint tx per backer |
| Pause | `Security.pause` | Pause tx (the required lifecycle / compliance op) |
| Unpause | `unpause` on the diamond's pause facet | Unpause tx lifting that stamp |

Internal KYC is **on** at create (required for `deployBond` encoding), then deactivated so minting does not need a Terminal3 verifiable credential.

Bond issuance no longer uses `TokenCreateTransaction`.

### ATS features used

ATS can do much more (equity, dividends, voting, snapshots, lock, escrow, country lists, Mass Payout). Plain-language catalog: [README-ats.md](./README-ats.md). This app uses the slice below (`src/lib/ats.ts`).

| Feature | What it means here | Where |
|---|---|---|
| **Bond** (not equity) | The campaign becomes a debt-style security (an IOU), not company shares. | `Bond.create` |
| **Issue** | Clone an ATS diamond from the public testnet factory. | Operator desk → Issue bond |
| **Roles** | After create, the operator gets issuer / pauser / control-list roles. | `Role.applyRoles` |
| **Internal KYC on, then off** | KYC must be on for `deployBond` encoding; we deactivate it so minting does not need a Terminal3 credential. | `Kyc.deactivateInternalKyc` |
| **Whitelist / control list** | Each minted pledger is put on the allowed list. | `isWhiteList: true` + `Security.addToControlList` |
| **Mint** | Hand out **one** unit per unique pledger (`0x` or `0.0.x`). | `Security.issue` amount `1` |
| **Pause** | Freeze all transfers — the compliance / lifecycle op. | `Security.pause` |
| **Unpause** | Lift the freeze and reopen the raise, until the payouts run. | `IPause` facet `unpause` |

**Not used:** equity, dividends, voting (`erc20VotesActivated: false`), partitions, clearing, lock, snapshots, stock splits, redemption, country control lists, Terminal3 KYC, ATS Mass Payout.

---

## What is live vs stored locally

| Layer | Survives restart? | What it is |
|---|---|---|
| **On-chain (Hedera testnet)** | Yes | Privy HBAR pledges, two x402 payments, HCS topic messages, ATS bond issue / mint / pause, and settlement transfers (founder share + pro-rata backer pool). [HashScan](https://hashscan.io/testnet) is the source of truth. |
| **The Graph** | Live query | Aave v3 + Compound v3 + Spark Lend via the Graph Gateway. One book failing does not kill Check this creator. No key → Check this creator fails. |
| **Founder search** | Live query | Tavily public-web snippets for founder name + optional email. No key → profile step skipped, Check this creator still runs. |
| **HCS audit** | Yes, on disk + chain | Topic id in `.data/state.json` or `HEDERA_HCS_TOPIC_ID`. Message is SHA-256 of the paid note and founder profile plus **both** x402 tx ids, not the full paragraph. Skipped if operator keys are missing. |
| **Campaign book** | Yes, on disk | Pledges, created campaigns, token ids, backer account, x402 receiver, and settlement receipts (`payouts[slug]`) in `.data/state.json` (or `ZIKIBOLS_DATA_PATH`). On a read-only host this falls back to process memory. |
| **Seed copy** | In git | Harbor Credit and Northwind Farms text, goals, and starting pledged totals in `src/lib/campaigns.ts`. |

---

## Known gaps

Product debt we state up front, not hidden behavior. Plain-English walkthrough: [README-limitations.md](./README-limitations.md).

| Gap | Detail |
|---|---|
| Service and consumer are the same app | The agent calls its own `/api/risk-report` over HTTP. The `curl` above shows the paywall exists independently of the agent. |
| Shares are not 1:1 with HBAR | Each unique pledger can receive **one** ATS unit. A 13 ℏ pledge does not mint 13 shares. Amounts live on the pledge tx / `pledges` rows. |
| Settlement is a fixed percentage split | 90 / 10 out of the raise, on an operator click. No real-world event (invoice cleared, harvest sold) gates it, and the pool is not calculated yield. |
| One treasury for every campaign | Hedera sees one account; which pledge belonged to which campaign is `campaignSlug` in `state.json`. Delete that file before settling and the split is lost. |
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
| **Issue bond** stays disabled | Operator/agent Hedera keys missing, or the bond is already issued. |
| **Mint share** says issue first | The bond is still a draft. Click **Issue bond**, then mint. The route also refuses this. |
| **Mint share** stays disabled | After pause, minting is closed. Each unique pledger has their own Mint button. |
| **Pause bond** opens a modal | Some pledgers have no minted share. Mint them first — pause also closes new pledges. |
| **Pledge** says the campaign is paused | Expected after **Pause bond**. The listing is not taking new backers until you **Unpause bond**. |
| **Unpause bond** is not on the desk | It only appears while the bond is paused. Issue and pause it first. |
| **Unpause bond** stays disabled | The raise is already settled, or operator keys are missing. A paid-out campaign cannot reopen. |
| **Pay founder** / **Pay backers** stay disabled | Already paid, or the campaign has no live pledges. |
| **Pay founder** / **Pay backers** say pause first | The bond is not paused yet. Mint every backer, then **Pause bond**. |
| **Pay backers** opens a modal instead of paying | Some pledgers have no minted share. Mint each wallet listed in the modal, then click again. The route also refuses this with a `409`. |
| Payout refused with a cap or reserve message | Raise `PAYOUT_MAX_HBAR`, lower `PAYOUT_RESERVE_HBAR`, or fund the treasury. |
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
                                 ├── buyFounderProfile ──x402──► POST /api/founder-search/{1|2}
                                 │                              (Tavily, priced per query)
                                 ▼
                              buyRiskReport ──x402──► POST /api/risk-report
                                 │                     (Blocky402 settle)
                                 ▼
                              heuristic or LLM note + founder profile
                                 │
                                 ▼
                              publishAudit ──HCS──► topic message (note hash, profile hash, both x402 txs)

Privy wallet ──HBAR tx──► campaign treasury (EVM 296)
         └──POST /api/pledges──► .data/state.json + pledgedHbar

Operator desk (`/campaigns/[slug]/operate`)
         └──Bond.create / issue / pause──► ATS factory 0.0.9213391
         └──settle the raise: founder share ──► creatorWallet
                              remainder ──► every pledger, pro-rata
```

| Area | File |
|---|---|
| Campaign fixtures | `src/lib/campaigns.ts` |
| Persisted book | `src/lib/store.ts` |
| Graph lending query | `src/lib/graph.ts` |
| Founder web search | `src/lib/founder-search.ts` |
| Agent tool loop | `src/lib/agent.ts`, `src/app/api/agent/route.ts` |
| x402 client + server config | `src/lib/x402.ts` |
| Paid risk note | `src/app/api/risk-report/route.ts`, `src/lib/risk-note.ts` |
| Paid founder search | `src/app/api/founder-search/[queries]/route.ts` |
| HCS paid-note hash | `src/lib/hcs.ts` |
| Privy provider / pledge UI | `src/components/providers.tsx`, `src/components/pledge-panel.tsx` |
| Operator desk | `src/app/campaigns/[slug]/operate/page.tsx`, `src/components/token-panel.tsx` |
| Create campaign | `src/app/campaigns/new/page.tsx`, `src/app/api/campaigns/route.ts` |
| ATS bond lifecycle | `src/lib/ats.ts` |
| HBAR transfers / x402 receiver | `src/lib/hts.ts` |
| Settlement split | `src/lib/settlement.ts`, `src/app/api/campaigns/[slug]/payout/route.ts` |
| Env badges | `src/lib/status.ts`, `src/components/integration-status.tsx` |

Stack: Next.js 16, React 19, Privy, viem, ethers, `@hashgraph/sdk`, `@hashgraph/asset-tokenization-sdk`, `@x402/*`, Tailwind 4.

---

## AI tools used

Per ETHGlobal's AI-usage rules, this is where AI assisted the build:

- **Cursor (agent mode)** was used throughout for scaffolding Next.js routes and components, drafting and reviewing `PLAN.md` and this README, and cross-checking the prize qualification requirements against the code.
- Sponsor integrations (Privy config, Graph queries and subgraph IDs, x402 server/client wiring, ATS and HCS transactions) were written with AI assistance and verified by hand against Hedera testnet and the Graph Gateway; HashScan links in the app are the evidence.
- No AI-generated data is shown in the product: Graph numbers, x402 settlements, and founder-search snippets are live or labeled skipped. The optional LLM (`OPENAI_API_KEY`) only rewrites the risk note and founder profile from provided inputs and is labeled **LLM note** in the UI; without it the note is a labeled heuristic.

Planning artifacts are in the repo: [PLAN.md](./PLAN.md).
