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
          theme: "dark",
          accentColor: "#c3001a",
          logo: "/zikibols-logo.jpg",
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
