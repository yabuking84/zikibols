/** Server-only campaign book. Do not import from Client Components. */
import { mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  campaigns as seedCampaigns,
  listedCampaigns,
  RESERVED_SLUGS,
  slugifyCampaign,
  type AssetClass,
  type Campaign,
  type TokenLifecycle,
} from "@/lib/campaigns";
import type { PayoutApprovals, Pledge } from "@/lib/types";

export type CampaignRuntime = {
  tokenId: string | null;
  tokenLifecycle: TokenLifecycle;
  issueTxId: string | null;
  transferTxId: string | null;
  freezeTxId: string | null;
  payoutTxId: string | null;
  couponTxId: string | null;
  backerAccountId: string | null;
};

type StoredState = {
  version: 1;
  runtime: Record<string, CampaignRuntime>;
  created: Campaign[];
  pledges: Pledge[];
  approvals: Record<string, PayoutApprovals>;
  hcsTopicId: string | null;
  x402PayToAccountId: string | null;
};

const RUNTIME_KEYS = [
  "tokenId",
  "tokenLifecycle",
  "issueTxId",
  "transferTxId",
  "freezeTxId",
  "payoutTxId",
  "couponTxId",
  "backerAccountId",
] as const;

const emptyApprovals: PayoutApprovals = { founderWallet: null, operator: false };

let cache: StoredState | null = null;
let cacheMtime = -1;
let writeTail: Promise<void> = Promise.resolve();

function dataFile() {
  return (
    process.env.ZIKIBOLS_DATA_PATH ??
    path.join(process.cwd(), ".data", "state.json")
  );
}

function emptyState(): StoredState {
  return { version: 1, runtime: {}, created: [], pledges: [], approvals: {}, hcsTopicId: null, x402PayToAccountId: null };
}

function allCampaigns(state: StoredState) {
  return [...seedCampaigns, ...state.created];
}

function catalog(state: StoredState) {
  return listedCampaigns(allCampaigns(state));
}

function runtimeFrom(seed: Campaign): CampaignRuntime {
  return {
    tokenId: seed.tokenId,
    tokenLifecycle: seed.tokenLifecycle,
    issueTxId: seed.issueTxId,
    transferTxId: seed.transferTxId,
    freezeTxId: seed.freezeTxId,
    payoutTxId: seed.payoutTxId,
    couponTxId: seed.couponTxId ?? null,
    backerAccountId: seed.backerAccountId,
  };
}

function hydrate(seed: Campaign, state: StoredState): Campaign {
  const runtime = state.runtime[seed.slug];
  const mine = state.pledges.filter((pledge) => pledge.campaignSlug === seed.slug);
  return {
    ...seed,
    ...runtime,
    creatorEmail: seed.creatorEmail ?? null,
    pledgedHbar: seed.pledgedHbar + mine.reduce((sum, pledge) => sum + pledge.amountHbar, 0),
    backers: seed.backers + mine.length,
  };
}

async function load(): Promise<StoredState> {
  try {
    const file = dataFile();
    const info = await stat(/* turbopackIgnore: true */ file);
    if (cache && info.mtimeMs === cacheMtime) return cache;
    const raw = await readFile(/* turbopackIgnore: true */ file, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoredState>;
    cache = {
      version: 1,
      runtime: parsed.runtime ?? {},
      created: Array.isArray(parsed.created)
        ? parsed.created.map((campaign) => ({
            ...campaign,
            creatorEmail: campaign.creatorEmail ?? null,
          }))
        : [],
      pledges: Array.isArray(parsed.pledges)
        ? parsed.pledges.map((pledge) => ({
            ...pledge,
            hederaAccountId: pledge.hederaAccountId ?? null,
          }))
        : [],
      approvals: parsed.approvals ?? {},
      hcsTopicId: parsed.hcsTopicId ?? null,
      x402PayToAccountId: parsed.x402PayToAccountId ?? null,
    };
    cacheMtime = info.mtimeMs;
  } catch {
    if (cache) return cache;
    cache = emptyState();
    cacheMtime = 0;
  }
  return cache;
}

async function persist(state: StoredState) {
  cache = state;
  try {
    const file = dataFile();
    await mkdir(/* turbopackIgnore: true */ path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    await writeFile(/* turbopackIgnore: true */ tmp, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    await rename(/* turbopackIgnore: true */ tmp, file);
    cacheMtime = (await stat(/* turbopackIgnore: true */ file)).mtimeMs;
  } catch {
    cacheMtime = Date.now();
  }
}

async function withState<T>(mutator: (state: StoredState) => T): Promise<T> {
  const run = async () => {
    const state = await load();
    const result = mutator(state);
    await persist(state);
    return result;
  };
  const next = writeTail.then(run, run);
  writeTail = next.then(
    () => undefined,
    () => undefined,
  );
  return next;
}

export async function loadCampaigns(): Promise<Campaign[]> {
  const state = await load();
  return catalog(state).map((campaign) => hydrate(campaign, state));
}

export async function loadCampaign(slug: string): Promise<Campaign | null> {
  const state = await load();
  const seed = catalog(state).find((campaign) => campaign.slug === slug);
  if (!seed) return null;
  return hydrate(seed, state);
}

export async function patchCampaign(slug: string, patch: Partial<Campaign>) {
  return withState((state) => {
    const seed = catalog(state).find((campaign) => campaign.slug === slug);
    if (!seed) return null;
    const current = state.runtime[slug] ?? runtimeFrom(seed);
    const next = { ...current };
    for (const key of RUNTIME_KEYS) {
      if (patch[key] !== undefined) {
        next[key] = patch[key] as never;
      }
    }
    state.runtime[slug] = next;
    return hydrate(seed, state);
  });
}

export type CreateCampaignInput = {
  title: string;
  blurb: string;
  story: string;
  creatorName: string;
  creatorWallet: `0x${string}`;
  creatorEmail: string | null;
  goalHbar: number;
  daysLeft: number;
  location: string;
  assetClass: AssetClass;
  tokenName: string;
  tokenSymbol: string;
};

export async function createCampaign(input: CreateCampaignInput) {
  return withState((state) => {
    const taken = new Set([
      ...RESERVED_SLUGS,
      ...allCampaigns(state).map((campaign) => campaign.slug),
    ]);
    let slug = slugifyCampaign(input.title);
    if (taken.has(slug)) {
      let n = 2;
      while (taken.has(`${slug}-${n}`)) n += 1;
      slug = `${slug}-${n}`;
    }

    const treasury =
      process.env.NEXT_PUBLIC_CAMPAIGN_TREASURY ||
      seedCampaigns[0]?.treasuryEvm ||
      "0x7d5710637321f540b9ee8e1282c598d9b78f4f91";

    const campaign: Campaign = {
      ...input,
      slug,
      pledgedHbar: 0,
      backers: 0,
      tokenId: null,
      tokenLifecycle: "draft",
      issueTxId: null,
      transferTxId: null,
      freezeTxId: null,
      payoutTxId: null,
      couponTxId: null,
      backerAccountId: null,
      treasuryEvm: treasury as `0x${string}`,
      imageHue: input.assetClass === "invoice-receivable" ? "32 42% 42%" : "152 28% 32%",
    };
    state.created.push(campaign);
    return campaign;
  });
}

export async function listPledges(campaignSlug?: string) {
  const state = await load();
  const visible = new Set(catalog(state).map((campaign) => campaign.slug));
  const pledges = campaignSlug
    ? state.pledges.filter((pledge) => pledge.campaignSlug === campaignSlug)
    : state.pledges;
  return pledges.filter((pledge) => visible.has(pledge.campaignSlug));
}

export async function addPledge(input: Omit<Pledge, "id" | "createdAt">) {
  return withState((state) => {
    const pledge: Pledge = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    state.pledges.unshift(pledge);
    return pledge;
  });
}

export async function getPayoutApprovals(slug: string): Promise<PayoutApprovals> {
  const state = await load();
  return state.approvals[slug] ?? emptyApprovals;
}

export async function approveFounder(slug: string, wallet: string) {
  return withState((state) => {
    const current = state.approvals[slug] ?? { ...emptyApprovals };
    const next = { ...current, founderWallet: wallet };
    state.approvals[slug] = next;
    return next;
  });
}

export async function approveOperator(slug: string) {
  return withState((state) => {
    const current = state.approvals[slug] ?? { ...emptyApprovals };
    const next = { ...current, operator: true };
    state.approvals[slug] = next;
    return next;
  });
}

export async function payoutReady(slug: string) {
  const current = await getPayoutApprovals(slug);
  return Boolean(current.founderWallet && current.operator);
}

export async function getHcsTopicId() {
  const fromEnv = process.env.HEDERA_HCS_TOPIC_ID?.trim();
  if (fromEnv) return fromEnv;
  const state = await load();
  return state.hcsTopicId;
}

export async function setHcsTopicId(topicId: string) {
  return withState((state) => {
    state.hcsTopicId = topicId;
    return topicId;
  });
}

export async function getX402PayToAccountId() {
  const state = await load();
  return state.x402PayToAccountId;
}

export async function setX402PayToAccountId(accountId: string) {
  return withState((state) => {
    state.x402PayToAccountId = accountId;
    return accountId;
  });
}
