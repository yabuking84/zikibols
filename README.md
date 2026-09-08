# zikibols

Kickstarter-style crowdfunding for ETHOnline 2026. One app, three sponsors:

| Sponsor | What this app does |
|---|---|
| **Privy** | Email/social login → embedded wallet → pledge HBAR on Hedera testnet |
| **The Graph** | Agent queries the same Messari lending schema on Aave v3 and Compound v3, live |
| **Hedera** | Agent **pays x402** (Blocky402 testnet) for a risk note; campaigns issue HTS bond/share tokens with freeze/pause and a 2-of-2 coupon |

## Run

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Env

- `NEXT_PUBLIC_PRIVY_APP_ID` — from [Privy dashboard](https://dashboard.privy.io). Enable Hedera testnet (chain id 296) for pledges.
- `NEXT_PUBLIC_CAMPAIGN_TREASURY` — optional EVM treasury override for pledges.
- `THEGRAPH_API_KEY` — Graph Gateway key. Without it, **Check this creator** fails on purpose.
- `HEDERA_PAY_TO_ACCOUNT` — testnet account that receives the x402 fee.
- `HEDERA_AGENT_ACCOUNT_ID` + `HEDERA_AGENT_PRIVATE_KEY` — funded testnet account the agent pays with ([portal faucet](https://portal.hedera.com/)).
- `HEDERA_OPERATOR_ACCOUNT_ID` + `HEDERA_OPERATOR_PRIVATE_KEY` — optional; falls back to the agent pair for HTS issue/airdrop/freeze/coupon.
- `HEDERA_BACKER_ACCOUNT_ID` — Hedera account that receives one share, then can be frozen.
- `X402_FACILITATOR_URL` — defaults to `https://api.testnet.blocky402.com`.
- `OPENAI_API_KEY` — optional. If missing, the agent still calls both tools and writes a heuristic note.

The dashboard **Integrations** row shows Ready vs Needs env. It never invents Graph or x402 data.

## Demo flow

1. Open a campaign (or search with ⌘K).
2. Click **Check this creator**. The agent queries Aave + Compound, then pays `/api/risk-report` on Hedera.
3. Log in with Privy and **Pledge**. Progress and the backer list update.
4. As operator: **Issue token → Transfer share → Freeze / pause**.
5. **Approve as founder** (Privy) and **Co-sign as treasury**, then **Release coupon**.

## Architecture

- `src/lib/graph.ts` — one GraphQL query against two standardized lending subgraphs
- `src/app/api/agent/route.ts` — tool loop
- `src/app/api/risk-report/route.ts` — x402-paywalled inference (`withX402`)
- `src/components/pledge-panel.tsx` — Privy wallet transfer
- `src/lib/hts.ts` — HTS issue / airdrop / freeze / pause / coupon
