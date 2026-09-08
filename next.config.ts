import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@x402/hedera",
    "@hiero-ledger/sdk",
    "@hashgraph/sdk",
  ],
};

export default nextConfig;
