import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@x402/hedera",
    "@hiero-ledger/sdk",
    "@hashgraph/sdk",
    "@hashgraph/asset-tokenization-sdk",
    "@hashgraph/asset-tokenization-contracts",
    "ethers",
  ],
};

export default nextConfig;
