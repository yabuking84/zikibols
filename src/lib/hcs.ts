import { createHash } from "node:crypto";
import {
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
} from "@hashgraph/sdk";
import { isHederaOperatorConfigured, withHederaClient } from "@/lib/hts";
import { getHcsTopicId, setHcsTopicId } from "@/lib/store";

export type RiskAudit = {
  topicId: string;
  transactionId: string;
};

function noteDigest(note: string) {
  return createHash("sha256").update(note).digest("hex");
}

async function ensureTopicId() {
  const existing = await getHcsTopicId();
  if (existing) return existing;

  const created = await withHederaClient(async (client) => {
    const response = await new TopicCreateTransaction()
      .setTopicMemo("zikibols paid risk notes")
      .execute(client);
    const receipt = await response.getReceipt(client);
    const topicId = receipt.topicId?.toString();
    if (!topicId) throw new Error("Topic create returned no topic id");
    return topicId;
  });

  await setHcsTopicId(created);
  return created;
}

export async function publishRiskAudit(input: {
  campaignTitle: string;
  creatorWallet: string;
  note: string;
  profile: string | null;
  x402Tx: string | null;
  protocols: string[];
}): Promise<RiskAudit | null> {
  if (!isHederaOperatorConfigured()) return null;

  const topicId = await ensureTopicId();
  const message = JSON.stringify({
    kind: "zikibols-risk-note",
    campaignTitle: input.campaignTitle,
    creatorWallet: input.creatorWallet.toLowerCase(),
    protocols: input.protocols,
    noteSha256: noteDigest(input.note),
    profileSha256: input.profile ? noteDigest(input.profile) : null,
    x402: input.x402Tx,
    at: new Date().toISOString(),
  });

  return withHederaClient(async (client) => {
    const response = await new TopicMessageSubmitTransaction()
      .setTopicId(topicId)
      .setMessage(message)
      .execute(client);
    await response.getReceipt(client);
    return {
      topicId,
      transactionId: response.transactionId.toString(),
    };
  });
}
