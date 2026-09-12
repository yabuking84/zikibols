import type { ShareMint } from "@/lib/types";

export type AssetClass = "invoice-receivable" | "revenue-share";

export type TokenLifecycle =
  | "draft"
  | "issued"
  | "transferred"
  | "frozen"
  | "paid";

export type Campaign = {
  slug: string;
  title: string;
  blurb: string;
  story: string;
  creatorName: string;
  creatorWallet: `0x${string}`;
  creatorEmail: string | null;
  goalHbar: number;
  pledgedHbar: number;
  backers: number;
  daysLeft: number;
  location: string;
  assetClass: AssetClass;
  tokenName: string;
  tokenSymbol: string;
  tokenId: string | null;
  tokenLifecycle: TokenLifecycle;
  issueTxId: string | null;
  transferTxId: string | null;
  freezeTxId: string | null;
  unpauseTxId?: string | null;
  payoutTxId: string | null;
  couponTxId: string | null;
  backerAccountId: string | null;
  mints: ShareMint[];
  treasuryEvm: `0x${string}`;
  imageHue: string;
};

export const campaigns: Campaign[] = [
  {
    slug: "harbor-credit",
    title: "Harbor Credit — invoice bond",
    blurb:
      "A 90-day receivable from a port logistics operator, tokenized as a simple bond.",
    story:
      "Harbor Credit buys verified invoices from a Rotterdam freight desk and issues a short-duration bond to backers. Coupon is paid when the invoice clears. The campaign wallet can only release funds after two operators approve the payout.",
    creatorName: "Harbor Desk BV",
    creatorWallet: "0x1111111254eeb25477b68fb85ed929f73a960582",
    creatorEmail: null,
    goalHbar: 12000,
    pledgedHbar: 4380, // seed book; live Privy pledges add on top
    backers: 27,
    daysLeft: 18,
    location: "Rotterdam",
    assetClass: "invoice-receivable",
    tokenName: "Harbor Invoice Bond 2026-Q3",
    tokenSymbol: "HIB26",
    tokenId: "0.0.10423725",
    tokenLifecycle: "paid",
    issueTxId: "0xc8c03897f547618583ed2fef2d9a8317bcc0f6c0adab523a50107a974a4e9dfc",
    transferTxId: "0x3649110d7566cec1790e7cbc6f28ea93f17b649eced7083c3f5ab0fc11f6dc6a",
    freezeTxId: "0xf57b9661a0e52b6d039f32a2acffdcb87d12fb5b2bc425efbb4de68a0e2c3940",
    payoutTxId: "0.0.10418801@1788882136.867281572",
    couponTxId: "0x35fd434f02a91089f878fa70848c7fa29a87afd63ae9bc52b98733cceb29c1ad",
    backerAccountId: "0x7d5710637321f540b9ee8e1282c598d9b78f4f91",
    mints: [
      {
        wallet: "0x7d5710637321f540b9ee8e1282c598d9b78f4f91",
        accountId: "0x7d5710637321f540b9ee8e1282c598d9b78f4f91",
        txId: "0x3649110d7566cec1790e7cbc6f28ea93f17b649eced7083c3f5ab0fc11f6dc6a",
        at: "",
      },
    ],
    treasuryEvm: "0x7d5710637321f540b9ee8e1282c598d9b78f4f91",
    imageHue: "32 42% 42%",
  },
  {
    slug: "northwind-farms",
    title: "Northwind Farms — harvest share",
    blurb:
      "Revenue-share on a winter greenhouse crop. Backers receive a transfer-restricted share token.",
    story:
      "Northwind is raising working capital for a greenhouse expansion. Backers receive a revenue-share token (not a meme ticker): freezeable, with a coupon once produce is sold. Before you pledge, the agent checks the creator’s public DeFi history on Aave, Compound, and Spark.",
    creatorName: "Northwind Cooperative",
    creatorWallet: "0x47ac0fb4f2d84898e4d9e7b4dab3c24507a6d503",
    creatorEmail: null,
    goalHbar: 8000,
    pledgedHbar: 6120, // seed book; live Privy pledges add on top
    backers: 41,
    daysLeft: 9,
    location: "Friesland",
    assetClass: "revenue-share",
    tokenName: "Northwind Harvest Share 2026",
    tokenSymbol: "NWH26",
    tokenId: null,
    tokenLifecycle: "draft",
    issueTxId: null,
    transferTxId: null,
    freezeTxId: null,
    payoutTxId: null,
    couponTxId: null,
    backerAccountId: null,
    mints: [],
    treasuryEvm: "0x7d5710637321f540b9ee8e1282c598d9b78f4f91",
    imageHue: "152 28% 32%",
  },
];

/** Fixture listings in this file. Flip to true to show Harbor Credit and Northwind Farms again. */
export const SHOW_SEED_CATALOG = false;

/** Seed catalog lookup. Live pledged totals and token ids live in `src/lib/store.ts`. */
export function getCampaign(slug: string) {
  return campaigns.find((campaign) => campaign.slug === slug);
}

export function fundedPercent(campaign: Campaign) {
  return Math.min(100, Math.round((campaign.pledgedHbar / campaign.goalHbar) * 100));
}

export function assetClassLabel(assetClass: AssetClass) {
  return assetClass === "invoice-receivable"
    ? "Invoice receivable bond"
    : "Harvest revenue share";
}

export type CatalogItem = {
  slug: string;
  title: string;
  tokenSymbol: string;
  location: string;
};

export function toCatalogItem(campaign: Pick<Campaign, "slug" | "title" | "tokenSymbol" | "location">): CatalogItem {
  return {
    slug: campaign.slug,
    title: campaign.title,
    tokenSymbol: campaign.tokenSymbol,
    location: campaign.location,
  };
}

export const RESERVED_SLUGS = new Set(["new"]);

/** Harbor Credit and Northwind Farms ship with fixture pledged totals. */
export function isSeedCatalog(slug: string) {
  return campaigns.some((campaign) => campaign.slug === slug);
}

/** Listings the app should render. Seed fixtures stay on disk when this is empty. */
export function listedCampaigns<T extends { slug: string }>(items: T[]): T[] {
  if (SHOW_SEED_CATALOG) return items;
  return items.filter((item) => !isSeedCatalog(item.slug));
}

export function slugifyCampaign(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "campaign";
}

export function isEvmAddress(value: string): value is `0x${string}` {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

export function isPublicEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

