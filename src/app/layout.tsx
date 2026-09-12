import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Zikibols",
  description: "Crowdfund tokenized campaigns with on-chain due diligence",
  icons: {
    icon: "/zikibols-logo.jpg",
    apple: "/zikibols-logo.jpg",
  },
};

const themeInit = `(function(){try{var t=localStorage.getItem('zikibols-theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full font-sans`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-svh">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
