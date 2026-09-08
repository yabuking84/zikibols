import { defineChain } from "viem";

export const HEDERA_TESTNET_CAIP2 = "hedera:testnet";
export const HBAR_ASSET_ID = "0.0.0";
export const X402_PRICE_TINYBARS = "100000"; // 0.001 HBAR
export const BLOCKY402_TESTNET_URL = "https://api.testnet.blocky402.com";

export const hederaTestnet = defineChain({
  id: 296,
  name: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet.hashio.io/api"] },
  },
  blockExplorers: {
    default: { name: "HashScan", url: "https://hashscan.io/testnet" },
  },
});

export function hashscanAccountUrl(accountId: string) {
  return `https://hashscan.io/testnet/account/${accountId}`;
}

export function hashscanTokenUrl(tokenId: string) {
  return `https://hashscan.io/testnet/token/${tokenId}`;
}

export function hashscanTxUrl(txId: string) {
  return `https://hashscan.io/testnet/transaction/${encodeURIComponent(txId)}`;
}

export function hashscanTopicUrl(topicId: string) {
  return `https://hashscan.io/testnet/topic/${topicId}`;
}

export function isHederaAccountId(value: string) {
  return /^\d+\.\d+\.\d+$/.test(value.trim());
}

export function isEvmAddress(value: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim());
}

/** Privy wallets are EVM 0x…; HTS airdrop needs 0.0.x. Mirror node is public. */
export async function hederaAccountFromEvm(evmAddress: string) {
  const address = evmAddress.trim().toLowerCase();
  if (!isEvmAddress(address)) return null;
  try {
    const response = await fetch(
      `https://testnet.mirrornode.hedera.com/api/v1/accounts/${address}`,
      { cache: "no-store", signal: AbortSignal.timeout(8_000) },
    );
    if (!response.ok) return null;
    const json = (await response.json()) as { account?: string };
    const account = json.account?.trim() ?? "";
    return isHederaAccountId(account) ? account : null;
  } catch {
    return null;
  }
}
