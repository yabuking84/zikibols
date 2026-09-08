import { getCampaign } from "@/lib/campaigns";
import type { Pledge } from "@/lib/types";

export type { Pledge };

const pledges: Pledge[] = [];

export function listPledges(campaignSlug?: string) {
  return campaignSlug
    ? pledges.filter((pledge) => pledge.campaignSlug === campaignSlug)
    : pledges;
}

export function addPledge(input: Omit<Pledge, "id" | "createdAt">) {
  const pledge: Pledge = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  pledges.unshift(pledge);
  const campaign = getCampaign(input.campaignSlug);
  if (campaign) {
    campaign.pledgedHbar += input.amountHbar;
    campaign.backers += 1;
  }
  return pledge;
}
