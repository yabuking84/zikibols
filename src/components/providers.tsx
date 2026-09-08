"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { hederaTestnet } from "@/lib/hedera";

export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          theme: "light",
          accentColor: "#0f172a",
          logo: undefined,
        },
        defaultChain: hederaTestnet,
        supportedChains: [hederaTestnet],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
