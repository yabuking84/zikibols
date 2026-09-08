# Zikibols — project plan

Crowdfunding for **tokenized real-world cashflows**, with an agent that checks the creator on-chain before anyone pledges.

Repo: [github.com/yabuking84/zikibols](https://github.com/yabuking84/zikibols)  
Event: [ETHOnline 2026](https://ethglobal.com/events/ethonline2026) (4–16 Sep 2026)  
**Submission deadline: Sunday 13 Sep 2026, 12:00 pm EDT (20:00 GST). Late submissions are not accepted.**

Partner prizes are capped at **3 partners** per submission; multiple tracks from one partner count as one. We submit to **Hedera, The Graph, Privy** and write qualification paragraphs for the five tracks in [Prize tracks](#prize-tracks-what-we-are-building-toward).

---

## Vision

A backer should be able to fund an invoice bond or harvest share without a seed phrase, without trusting a screenshot of "DeFi history," and without receiving a meme ticker.

The product is one app with three load-bearing sponsor integrations:

| Sponsor | Role in Zikibols |
|---|---|
| **Privy** | Email/social login → embedded wallet → real HBAR pledge on Hedera testnet |
| **The Graph** | One Messari lending query against **Aave v3, Compound v3, and Spark Lend**, live; the agent reasons over it |
| **Hedera** | Agent **pays x402** for a risk note and for founder research; hashes both onto **HCS**; campaigns issue a bond through **Asset Tokenization Studio** with pause/control-list and a 2-of-2 coupon |

Zikibols is not a general crowdfunding clone. A founder starts a **campaign** — a diligence-gated listing for **invoice receivables** or **revenue-share** assets. After funding, the token lifecycle is an ATS security (issue → mint to backer → pause / control list → coupon record), not a launchpad.

Due diligence has two layers:

| Layer | When | What it is |
|---|---|---|
| **Campaign (free)** | Founder clicks **Start a campaign** | Public brief: story, creator **name**, optional **email**, Ethereum wallet. Anyone can read it without paying. |
| **Paid due diligence** | Backer clicks **Check this creator** | Live Graph books, then two **paid** x402 services: public-web founder search and the risk note. Both hashed onto HCS. |

---

## Problem

Crowdfunding a tokenized cashflow today fails in three places:

1. **Wallets.** Asking a founder or backer to install MetaMask and fund a testnet is a demo killer.
2. **Diligence.** "Check the creator" is usually a blog post or a static risk score. Judges (and backers) cannot tell if the data is live.
3. **The token.** Most hackathon "RWAs" stop at `TokenCreate`. There is no compliance layer, no coupon, no dual control on payout.

Zikibols treats those as the product, not polish.

---

## Product goals

1. **A backer can fund in minutes.** Log in with Privy, send HBAR from an embedded wallet, see the campaign book and HashScan tx update.
2. **Paid diligence is paid compute, not a mock.** The **campaign** is the free layer. "Check this creator" queries live Graph data, then the agent pays x402 twice: once for the public-web founder search, once for the written risk note. The dashboard never invents Graph, x402, or web-search data; Integrations shows Ready vs Needs env.
3. **The campaign becomes an ATS security.** Issue a bond through Asset Tokenization Studio, mint one unit to the backer's Privy address, pause or control-list the holder, record a coupon, then release the HBAR coupon only after founder (Privy) + treasury operator both approve.
4. **One demo path, five prize stories.** A judge can walk Dashboard → campaign → Check creator → Pledge → Issue → Mint → Pause → Coupon without leaving the app.
5. **Honesty over theater.** Missing env fails on purpose. Heuristic notes are labeled when no LLM key is set. Skip-diligence is explicit ("Pledge anyway"), not hidden.

---

## Prize tracks (what we are building toward)

Requirements below are copied from the [prize page](https://ethglobal.com/events/ethonline2026/prizes) on 8 Sep 2026. Status is against the code on `rc/v1.0.1`.

### 1. Hedera — AI & Agentic Payments on Hedera ($6,000, up to 3 × $2,000)

| Requirement | Where we stand |
|---|---|
| Host a live x402-gated service on Hedera testnet or mainnet, settled through the Blocky402 facilitator | **Met.** `POST /api/risk-report` via `withX402` + `ExactHederaServerScheme`, facilitator `https://api.testnet.blocky402.com`, payTo `0.0.10421774` |
| Build a platform or agent that consumes that service and completes at least one real paid request end to end | **Met.** `runDueDiligence` → `buyRiskReport` → `wrapFetchWithPayment` with the agent's Hedera signer; settlement tx shown in UI |
| Public GitHub repo with a README covering setup, architecture, and the payment flow | **Met.** Add a `curl` that shows the 402 challenge so the service reads as standalone |
| Demo video of five minutes or less showing the paid request executing | **Open** |

Extra points we target:

| Extra point | Plan |
|---|---|
| Verifiable payment audit trails on HCS | **Done.** `src/lib/hcs.ts` publishes `noteSha256`, `profileSha256`, and x402 tx ids to topic `0.0.10421775`. Say it in README and video. |
| Pay-per-call metering rather than a flat charge | **Met.** Second service `POST /api/founder-search/{1|2}` wraps Tavily behind x402, priced per query. |
| On-chain agent identity (HCS-14) / agent discovery | Optional, last. See "Hedera Agent Kit decision". |

**Hedera Agent Kit decision.** We do **not** replace Tavily with the Hedera Agent Kit or the Hashgraph Online Standards Agent Kit. Neither does web search (the Agent Kit docs tell you to add Tavily alongside it); both add LangChain and an agent-loop rewrite; and this track is judged on the paid service and the paying agent, not on the framework. What strengthens the track is making founder research itself an x402 service (above). If every other item is done, the Agent Kit can be used for an HCS-14 identity record as decoration; it is not on the critical path.

Work items:

- [x] `src/app/api/founder-search/[queries]/route.ts`: x402-gated, same pattern as `risk-report`; body = campaign name/email/title/location; returns `FounderProfile`; 503 with a labeled reason if `TAVILY_API_KEY` is missing.
- [x] `buyFounderProfile` in `src/lib/x402.ts`; agent pays it in `runDueDiligence` before `buyRiskReport`; both settlement tx ids into `payments[]` and the HCS message.
- [x] Price per query: route config price = `X402_PRICE_TINYBARS × queries` (`/1` vs `/2`).
- [x] README: payment-flow section shows two paid requests; `curl` of the 402 challenge; "HCS audit trail" called out as the extra point.
- [ ] Video (≤5 min): both HashScan payment txs and the HCS topic in frame.

### 2. Hedera — Tokenization of Anything ($6,000, up to 3 × $2,000)

| Requirement | Where we stand |
|---|---|
| Use the Asset Tokenization Studio (SDK, contracts, web application, or a combination) to issue or manage a tokenised asset | **Met.** `src/lib/ats.ts` uses `@hashgraph/asset-tokenization-sdk` v8: `Bond.create`, `Security.issue`, `Security.pause`, plus `ICoupon.setCoupon` on the diamond. Harbor bond [`0.0.10423725`](https://hashscan.io/testnet/contract/0.0.10423725); coupon [`0x35fd434f…`](https://hashscan.io/testnet/transaction/0x35fd434f02a91089f878fa70848c7fa29a87afd63ae9bc52b98733cceb29c1ad). |
| Deploy and demonstrate on Hedera testnet | **Met.** Issue / mint / pause txs on HashScan for Harbor Credit |
| Public GitHub repo, with contracts verified on HashScan where applicable | ATS factory `0.0.9213391` / resolver `0.0.9212226` are Hedera-deployed; our bond is a diamond clone. Link the clone's contract page on HashScan. |
| Demo video ≤5 min showing issuance, configuration, and at least one lifecycle operation (transfer, compliance check, or distribution) | Open |

Extra points we target: compliance controls in use (pause, control list), coupon record.

**Route.** `@hashgraph/asset-tokenization-sdk` v8 from the Next.js server with a private-key signer. The SDK README says "only metamask is compatible right now"; we stub `window` only around `Network.connect` (`debug: true`) and inject an ethers `Wallet`. Testnet factory `0.0.9213391`, resolver `0.0.9212226`, bond config id `…0002`. Operator must be an **ECDSA** account with an EVM alias. Create uses internal KYC on (required for `deployBond` encoding), then `deactivateInternalKyc` so minting does not need a Terminal3 VC.

**Kill criterion.** **Go.** `/tmp/ats-spike` deployed diamond `0.0.10423104` (tx `0x15b7a5cf…`) and applied issuer / control-list / pauser roles.

Lifecycle mapping:

| Zikibols step | ATS |
|---|---|
| Issue | `Bond.create` → diamond address in `Campaign.tokenId` |
| Mint share | `Security.addToControlList` then `Security.issue` 1 unit to the backer's Privy EVM address |
| Pause | `Security.pause` — the "compliance check" op |
| Coupon | ATS `ICoupon.setCoupon` on the diamond (SDK `Coupon.setCoupon` sent empty calldata under Next) **plus** the existing HBAR payout after 2-of-2. ATS coupon is an entitlement record; we do not run Mass Payout. |

Work items:

- [x] Spike (`/tmp` script, not in repo): init SDK, connect with operator key, `Bond.create`, read details. **Go.**
- [x] `src/lib/ats.ts`: `issueBond`, `mintToBacker`, `pauseBond`, `setCouponRecord`; `Campaign.tokenId` holds the diamond address; `hashscanContractUrl`.
- [x] `token` route: `issue` → ATS; `transfer` → mint to backer EVM; `freeze` → pause/control list.
- [x] `payout` route `release`: write `setCoupon` record, then existing `payCoupon`.
- [x] Token panel copy: "ATS bond (ERC-1400/3643)", contract link, lifecycle badges.
- [x] README: ATS section (factory/resolver ids, what the coupon record is and is not).
- [x] `.env.example`: `ATS_FACTORY_ID`, `ATS_RESOLVER_ID`, `ATS_BOND_CONFIG_ID`.

### 3. The Graph — Best Use of Composable or Standardized Graph Products ($5,000: 2,500 / 1,500 / 1,000)

| Requirement | Where we stand |
|---|---|
| Compose two or more Graph products, **or** build meaningfully on a standardized schema (e.g. Messari Standardized Subgraphs) | **Met.** One `LENDING_QUERY` + one `ACCOUNT_QUERY` in `src/lib/graph.ts` run unchanged against Aave v3, Compound v3, Spark Lend |
| Consume live data from a Graph provider; mocked, local-only, or static datasets do not qualify | **Met.** Gateway + `THEGRAPH_API_KEY`; throws if missing; `cache: "no-store"` |
| Simply querying one Subgraph with no composition or standardization does not qualify | **Met.** Three subgraphs, same schema |
| Make the standards leverage clear: show what became easier because a shared schema was used | **Met in code**; must be said in the video: "one query, three books, one book can fail without killing diligence" |
| Public repository and a short demo video (two to four minutes) | **Open** |

Work items:

- [x] Confirm all three subgraph IDs return `lendingProtocols` on the day of recording (Spark Lend first). If one is dead, swap in another Messari lending deployment; the sentence must stay "three". Re-check immediately before recording.
- [x] README: a "Standards leverage" paragraph with the single query shown once.
- [ ] Video: the standards sentence, spoken.

### 4. The Graph — Best AI Tooling or AI Use Case with The Graph, From Scratch ($5,000: 2,500 / 1,500 / 1,000)

| Requirement | Where we stand |
|---|---|
| Use The Graph as a load-bearing part: the agent/app uses The Graph as its source of blockchain data | **Met.** All books failing aborts Check this creator |
| Consume live data with an API key from Subgraph Studio | **Met** |
| Do meaningful work with the data: reasoning, decisions, automation — not just printing a raw query result | **Met with a caveat.** The agent's result gates the Pledge button (decision), pays x402 (automation), and writes a note. Without `OPENAI_API_KEY` the note is a labeled heuristic template. **Record the demo with the LLM path on.** |
| Open-source with a clear README so judges can run it; public repo + 2–4 min video | README met; **video open** |
| Select the pool that matches how you built: Start Fresh for net-new | **Start Fresh.** First commit 8 Sep 2026, inside the event window; no project-specific prior code |

The track text lists "let your agent pay per query autonomously with x402" as an example. We do that for the risk note today and for founder search after item 1 above.

Work items:

- [ ] Set `OPENAI_API_KEY` in the demo env; keep the heuristic fallback and its label.
- [x] README: "From scratch" statement (start date, no prior code) and a sentence on what the agent decides.
- [ ] Video (2–4 min cut is the same video as Hedera's if we keep it to 4 minutes).

### 5. Privy — Best financial flow ($2,500)

| Requirement | Where we stand |
|---|---|
| Integrate Privy as a core part of the product | **Met.** Privy is the only auth; pledge and founder approval need a Privy wallet |
| Create or use at least one Privy wallet | **Met.** `embeddedWallets.ethereum.createOnLogin: "users-without-wallets"` |
| Complete at least one functional financial flow using a generally available Privy feature; transfers are eligible | **Met.** `switchChain(296)` → `sendTransaction` HBAR to the campaign treasury (`src/components/pledge-panel.tsx`); `supportedChains: [hederaTestnet]` |
| Provide a working demo and access to the source | Deploy **open** |
| Clearly explain how Privy improves the user experience | **Met.** README paragraph: no extension, no seed phrase, chain switch and gas hidden, HashScan link after |
| Mocked features do not count as the required integration | Nothing mocked |

Work items:

- [x] Set `NEXT_PUBLIC_CAMPAIGN_TREASURY` to an account we control (ideally the operator's EVM alias so coupons visibly leave the same treasury that received pledges). Pinned to `0x7d5710637321f540b9ee8e1282c598d9b78f4f91`.
- [x] README: "How Privy improves the flow" paragraph.
- [ ] Video: login → pledge → HashScan in under 60 seconds.

### Tracks we do not claim

| Track | Why not |
|---|---|
| Privy — Best B2B financial product | Requires "at least one Privy control: policies, signers, key quorums, or intents." Our 2-of-2 is stored flags. Selecting Privy already covers this track for the partner cap, but we do not write a paragraph for it. |
| The Graph — AI (Continuity), Hedera — Continuity, Hedera — Harness | Net-new project; no prior repo. |

### Cross-cutting submission requirements (ETHGlobal rules)

- [x] **AI tool attribution.** Rules require documenting where and how AI tools were used, and including spec/planning artifacts in the repo. `PLAN.md` is the artifact; README has an "AI tools used" section.
- [x] Submission form copy: partners = Hedera, The Graph, Privy; Graph AI pool = Start Fresh; five track paragraphs drafted below. Paste on Saturday.
- [ ] Public URL live and warm at submission time.

### Submission copy (paste into the Hacker Dashboard)

Partners: **Hedera, The Graph, Privy**. Graph AI pool: **Start Fresh**. Do not select Privy B2B.

**Hedera — AI & Agentic Payments.** Zikibols hosts two live x402 services on Hedera testnet, settled through the Blocky402 facilitator (`api.testnet.blocky402.com`): `POST /api/founder-search/{1|2}` (Tavily public-web research, priced per query) and `POST /api/risk-report` (a written risk note over live Graph books). The diligence agent pays both with `wrapFetchWithPayment` and an ECDSA Hedera signer. Settlement tx ids are shown in the UI and published with `noteSha256` and `profileSha256` to HCS topic `0.0.10421775`. A bare `curl` of either route returns HTTP 402.

**Hedera — Tokenization of Anything.** After funding, the operator desk issues the campaign as an Asset Tokenization Studio bond (`@hashgraph/asset-tokenization-sdk` v8): `Bond.create` clones Hedera's testnet factory `0.0.9213391`, `Security.issue` mints one unit to the backer's Privy EVM address, `Security.pause` is the compliance op, and `ICoupon.setCoupon` records the coupon on-chain before a small HBAR payout. Harbor Credit's diamond is [`0.0.10423725`](https://hashscan.io/testnet/contract/0.0.10423725).

**The Graph — Composable / standardized products.** One Messari standardized `lendingProtocols` query and one `account(id)` query run unchanged against Aave v3, Compound v3, and Spark Lend via the Graph Gateway. Adding a protocol is one subgraph id in `LENDING_SUBGRAPHS`; the note and UI do not change. One book can fail without aborting the other two. There is no mocked Graph fallback.

**The Graph — AI use case, From Scratch.** First commit 8 Sep 2026, inside the event window; no project-specific prior code. The agent uses live Graph books as its only on-chain source. All three books failing aborts Check this creator. The agent then pays x402 for founder research and the risk note and uses that result to enable or block Pledge. Without `OPENAI_API_KEY` the note is a labeled heuristic over the same live inputs.

**Privy — Best financial flow.** Privy is the only auth. Email or social login creates an embedded EVM wallet (`createOnLogin: "users-without-wallets"`). The app registers Hedera testnet as the sole chain, calls `switchChain(296)`, and `sendTransaction` HBAR to the campaign treasury. No browser extension, no seed phrase; the HashScan link is the receipt.

**Partner feedback (short)**

- Hedera: Blocky402 made a real pay-per-call agent path possible on testnet in days. ATS's published SDK is MetaMask-first; headless Node needed a documented connect order and KYC-on-then-deactivate so minting does not require Terminal3 VCs.
- The Graph: Messari's shared lending schema is why three protocols are one query. Gateway keys fail closed, which is the right default for a judged demo.
- Privy: Embedded wallets are the reason a judge can pledge HBAR on Hedera without installing MetaMask or handling a seed phrase.

---

## What is already built

Working demo surface:

- Dashboard with campaign stats, How a backer funds, Integrations (Ready / Needs env), campaign cards, recent pledges
- Campaign workspace: story, progress, Check this creator, Pledge, Hedera asset panel, recent pledges
- Create campaign (`/campaigns/new`): asset class, goal, creator name / optional email / wallet, persisted
- Operator desk (`/campaigns/[slug]/operate`): backer address, issue / mint / pause, 2-of-2 coupon
- Command search (⌘K), theme toggle, Privy login in the shell
- Two seed campaigns: **Harbor Credit** (invoice bond) and **Northwind Farms** (harvest share)

Working backend (file-persisted, not a database):

| Path | Role |
|---|---|
| `POST /api/agent` | Tool loop: Graph + founder search → pay x402 → HCS → summarize |
| `POST /api/risk-report` | **x402-gated.** `writeRiskNote` over the agent's live Graph snapshot |
| `POST /api/founder-search/[queries]` | **x402-gated.** Tavily behind payment, priced per query (`/1` or `/2`) |
| `POST /api/campaigns/[slug]/token` | set-backer / issue / mint / pause (ATS) |
| `GET/POST /api/pledges` | Campaign book after an on-chain pledge; maps Privy `0x` → `0.0.x` via mirror |
| `GET /api/campaigns`, `POST /api/campaigns` | Catalog + create |
| `GET /api/campaigns/[slug]` | Campaign + approvals + operator/backer flags + suggested backer |
| `POST /api/campaigns/[slug]/token` | set-backer / issue / mint / pause (ATS) |
| `POST /api/campaigns/[slug]/payout` | approve-founder / approve-operator / release |
| `GET /api/status` | Env truth for the Integrations row |

Stack: Next.js 16, React 19, Privy, viem, ethers, `@hashgraph/sdk`, `@hashgraph/asset-tokenization-sdk`, `@x402/{core,fetch,hedera,next}`, Tailwind 4.

---

## Architecture (target for submission)

```
Backer UI                    Agent                              Hedera testnet
─────────                    ─────                              ──────────────
Campaign page ──POST /api/agent──► query Aave+Compound+Spark ── Graph Gateway
                                 │  (same Messari query; one book can fail)
                                 ├── buyFounderProfile ──x402──► POST /api/founder-search ──► Tavily
                                 │                              (Blocky402 settle, priced per query)
                                 ├── buyRiskReport ──x402──────► POST /api/risk-report
                                 │                              (Blocky402 settle)
                                 ▼
                              heuristic or LLM note + founder profile
                                 │
                                 ▼
                              publishAudit ──HCS──► topic 0.0.10421775 (note hash, profile hash, both x402 tx ids)

Privy wallet ──HBAR tx──► campaign treasury (EVM 296)
         └──POST /api/pledges──► .data/state.json + pledgedHbar

Operator desk (`/campaigns/[slug]/operate`)
         └──ATS Bond.create ──► diamond clone (factory 0.0.9213391)
         └──Security.issue 1 unit ──► backer Privy EVM address
         └──pause / control list ──► compliance op
         └──2-of-2 ──► Coupon.setCoupon record + payCoupon (HBAR to backer)
```

Seed campaign copy lives in `src/lib/campaigns.ts`. Created campaigns, pledges, token ids, HCS topic, x402 receiver, and payout approvals persist to `.data/state.json` via `src/lib/store.ts`.

---

## Paid founder profile (OSINT)

The **campaign** is the free due-diligence layer. Paid founder research runs only when a backer clicks **Check this creator**. After the x402 change it is a second paid service, not a free server call.

**Inputs** (copied from the campaign, not invented)

| Field | Status |
|---|---|
| `creatorName` | Required on the campaign — search query |
| `creatorWallet` | Required Ethereum `0x…` — Graph only |
| `creatorEmail` | Optional public contact on **Start a campaign**; second search query. Do not invent an email. |

**Agent steps**

1. Live Graph books (free, Graph Gateway) in parallel with paying x402 for `/api/founder-search`.
2. Snippets only (no page scrape). Compile a sourced **Founder profile** (LLM if `OPENAI_API_KEY`, else heuristic).
3. Pay x402 for `/api/risk-report`, folding the profile into the paid risk paragraph.
4. Show the profile + source links; hash `noteSha256` + `profileSha256` + both payment tx ids onto HCS.
5. If `TAVILY_API_KEY` is missing, or every hit is empty: **skip and label it**. Never invent companies, emails, or headlines.

**Guardrails**

- Public web only. No mailbox access, no people-search dumps, no paywalled scrape.
- Treat email as a query string the founder published on the campaign, not as PII to enrich from leaks.
- Missing search env → Founder search **Needs env** / skipped step, not a fake LinkedIn blurb.

---

## Demo script (one video, ≤4 minutes, satisfies Hedera ≤5 and Graph 2–4)

Harbor Credit is already **paid** on testnet (README evidence table). Do not re-issue it on camera.

1. Dashboard. Integrations row: Privy / Graph / Founder search / x402 / ATS all Ready (do not fake a badge).
2. Open **Harbor Credit**. **Check this creator**. Say: "one Messari query, three protocols." Show three books, wallet positions, founder profile with sources, paid note. Click **both** HashScan payment txs and the HCS topic. Say: "the agent paid for the search and the note; the hashes are on HCS." Optionally click the operator-desk HashScan links (issue / mint / pause / coupon) as already-settled proof.
3. **Log in with Privy** (email), pledge 10 ℏ on **Northwind Farms**. Show HashScan + **Your pledges**. Say: "no extension, no seed phrase."
4. **Northwind operator desk**: **Issue** (ATS bond, show contract on HashScan) → **Mint share** to the pledger's address → **Pause / control list**.
5. **Approve as founder** (Privy) → **Co-sign as treasury** → **Release coupon**. Show the coupon record and the HBAR tx.

If ATS had been killed on Wednesday, step 4 would have stayed on HTS and the Tokenization track dropped from the pitch. The spike landed; we are on ATS.

---

## Known gaps (be honest in the README and video)

| Gap | Why it matters |
|---|---|
| Service and consumer are the same app | The agent calls its own `/api/*` over HTTP. The 402 `curl` in the README shows the service exists independently. |
| "Approve as founder" is any logged-in Privy wallet | `payout` route accepts a `wallet` string; no signature, no check against `creatorWallet`. Stored flags, not a second key. |
| One share per campaign | Mint goes to the latest pledger, not every pledger |
| ATS coupon is a record, HBAR payout is ours | ATS distribution is the Mass Payout service; we do not run it. The 1000-tinybar HBAR transfer is lifecycle proof, not yield. |
| HTS path only: airdrop can land as *pending* | `TokenAirdropTransaction` succeeds even if the recipient has no free auto-association; freeze then fails. Rehearse once; ATS path avoids this. |
| Seed totals are fixtures | Harbor Credit's 4,380 ℏ / 27 backers are hard-coded. Dashboard, cards, and campaign pages now label them as a seed book. |
| Diligence can be skipped | Explicit "Pledge anyway"; call it out |
| No tests | Judges run the deployed URL or `npm run dev` |
| File store | Needs a writable disk. Pin `HEDERA_PAY_TO_ACCOUNT` and `HEDERA_HCS_TOPIC_ID` in the host env so a cold start does not create a new receiver account or topic. |

---

## Schedule to the deadline

Deadline **Sun 13 Sep, 12:00 EDT / 20:00 GST**. Code freeze Friday night; Saturday is video and form.

### Wed 9 Sep — decide and build

- [x] 09:00–13:00 **ATS spike** with the kill criterion above. **Go** (diamond `0.0.10423104`).
- [x] `/api/founder-search` behind x402, per-query price; agent pays two services; both tx ids in HCS message.
- [x] `NEXT_PUBLIC_CAMPAIGN_TREASURY`, `HEDERA_HCS_TOPIC_ID=0.0.10421775`, `HEDERA_PAY_TO_ACCOUNT=0.0.10421774` in `.env.local`. (`OPENAI_API_KEY` still optional.)
- [x] Confirm three Graph subgraph IDs live.

### Thu 10 Sep — token layer and deploy

- [x] If go: `src/lib/ats.ts`, token/payout routes, token panel copy, `.env.example`. If no-go: label seed totals, handle pending airdrop (mirror check, fall back to pause).
- [ ] Deploy to a host with a writable disk (`Dockerfile` / `docker-compose.yml`); copy env; add the origin in Privy; smoke test Check → Pledge.
- [x] README: AI tools used; Privy UX paragraph; 402 `curl`; two-payment flow; HCS extra point; standards-leverage paragraph; From-scratch statement; ATS section.

### Fri 11 Sep — rehearsal and freeze

- [ ] Full run on the deployed URL from a fresh `state.json`: Check → Pledge → Issue → Mint/Transfer → Pause/Freeze → 2-of-2 → Coupon. Fix what breaks.
- [x] Draft the five track paragraphs and the partner feedback fields.
- [ ] Tag `v1.0.0`; code freeze.

### Sat 12 Sep — record and submit

- [ ] Record the ≤4 min video against the script; HashScan links in frame; no cuts around a failed env.
- [ ] Submit on the Hacker Dashboard: partners Hedera / The Graph / Privy; Graph AI pool Start Fresh. Do not wait for Sunday.

### Sun 13 Sep — buffer only

- [ ] Re-verify the public URL is up at 11:00 EDT. Nothing else.

---

## After ETHOnline

- [ ] Real dual-control (Privy key quorum or Hedera scheduled tx), not stored approval flags — also unlocks Privy B2B
- [ ] ATS KYC / transfer restrictions beyond pause and control list
- [ ] Coupon sized to pledged principal; maturity actually gates release; ATS Mass Payout for distribution
- [ ] Index pledges from Hedera instead of trusting `POST /api/pledges`
- [ ] HCS-14 agent identity via Hedera Agent Kit; agent discovery directory
- [ ] Production treasury, mainnet flag, brand pass

---

## Success criteria

The project is a **successful hackathon submission** if all of the following are true:

1. A stranger can open the public URL and complete Check → Pledge → Issue → Mint → Pause → Coupon on testnet.
2. Graph calls are live; two x402 payments appear on HashScan; the HCS topic has the hashes; the Privy transfer appears on HashScan; the ATS bond (or HTS token) appears on HashScan.
3. Judges can name the sponsor sentences without a slide: *same query, three protocols*; *the agent paid for the search and the note*; *embedded wallet pledged HBAR*; *the bond is an ATS security with a compliance op*.
4. The video is ≤4 minutes, shows both payments executing, and does not cut away from a failed env.
5. The README documents AI-tool usage and the From-scratch start.

---

## Non-goals (this event)

- Mainnet money or a real securities offering
- A full crowdfunding platform (comments, rewards tiers, social feed)
- Running ATS Mass Payout or a secondary market
- Mock Graph / mock x402 / mock OSINT fallbacks that look "Ready"
- Private people-search, leaked credential dumps, or scraping a founder's inbox
- Replacing Tavily with an agent framework; LangChain in the agent loop
- Mobile apps, chain abstraction, or extra L2s

---

## Seed campaigns

Fixtures shipped in `src/lib/campaigns.ts`; created campaigns are appended in `.data/state.json`.

| Slug | Asset | Story |
|---|---|---|
| `harbor-credit` | Invoice receivable bond (`HIB26`) | 90-day Rotterdam freight invoice; coupon when the invoice clears. Seed catalog is **paid** with HashScan ids so a cold deploy still shows the completed lifecycle. |
| `northwind-farms` | Harvest revenue share (`NWH26`) | Greenhouse working capital; pausable share, coupon after produce sale |

Creator wallets are public Ethereum addresses used as Graph `account(id)` lookups (Aave/Compound/Spark on Ethereum), not Hedera accounts.

---

## How to run (pointer)

See [README.md](./README.md) for env vars and the demo flow. Copy `.env.example` → `.env.local`. Integrations on the dashboard is the source of truth for whether Graph, x402, and ATS will actually run.

---

## Code map

| Area | Where |
|---|---|
| Campaign fixtures | `src/lib/campaigns.ts` |
| Persisted book | `src/lib/store.ts` (`.data/state.json`) |
| Messari lending queries | `src/lib/graph.ts` |
| Agent tool loop | `src/lib/agent.ts`, `src/app/api/agent/route.ts` |
| x402 client/server | `src/lib/x402.ts`, `src/app/api/risk-report/route.ts`, `src/app/api/founder-search/[queries]/route.ts` |
| Risk paragraph | `src/lib/risk-note.ts` |
| Founder web search | `src/lib/founder-search.ts` |
| HCS paid-note hash | `src/lib/hcs.ts` |
| HBAR coupon / x402 receiver | `src/lib/hts.ts` |
| ATS bond lifecycle | `src/lib/ats.ts` |
| 2-of-2 flags | `src/lib/payouts.ts` → `src/lib/store.ts` |
| Privy provider / pledge UI | `src/components/providers.tsx`, `src/components/pledge-panel.tsx` |
| Token + coupon UI | `src/components/token-panel.tsx`, `src/app/campaigns/[slug]/operate/page.tsx` |
| Create campaign | `src/app/campaigns/new/page.tsx`, `POST /api/campaigns` |
| Diligence UI | `src/components/check-creator.tsx` |
| Env badges | `src/lib/status.ts`, `src/components/integration-status.tsx` |
