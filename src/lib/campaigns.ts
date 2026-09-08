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
  payoutTxId: string | null;
  backerAccountId: string | null;
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
    pledgedHbar: 4380,
    backers: 27,
    daysLeft: 18,
    location: "Rotterdam",
    assetClass: "invoice-receivable",
    tokenName: "Harbor Invoice Bond 2026-Q3",
    tokenSymbol: "HIB26",
    tokenId: null,
    tokenLifecycle: "draft",
    issueTxId: null,
    transferTxId: null,
    freezeTxId: null,
    payoutTxId: null,
    backerAccountId: null,
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
    pledgedHbar: 6120,
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
    backerAccountId: null,
    treasuryEvm: "0x7d5710637321f540b9ee8e1282c598d9b78f4f91",
    imageHue: "152 28% 32%",
  },
];

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

