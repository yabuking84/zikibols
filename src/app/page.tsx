import { connection } from "next/server";
import { Command, Landmark, Shield, Wallet } from "lucide-react";
import { CampaignCard } from "@/components/campaign-card";
import { IntegrationStatus } from "@/components/integration-status";
import { RecentPledges } from "@/components/recent-pledges";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { campaigns } from "@/lib/campaigns";
import { hbar } from "@/lib/money";

const steps = [
  {
    title: "Check the creator",
    body: "The agent reads live Aave v3 and Compound v3 with the same Messari lending query, then pays Hedera x402 for a written risk note.",
  },
  {
    title: "Pledge with Privy",
    body: "Log in, get an embedded wallet, and send real HBAR on Hedera testnet to the campaign treasury.",
  },
  {
    title: "Tokenize and pay out",
    body: "Issue an HTS bond/share, airdrop, freeze, then release a coupon after a 2-of-2 founder + operator sign-off.",
  },
];

export default async function Home() {
  await connection();
  const pledged = campaigns.reduce((sum, campaign) => sum + campaign.pledgedHbar, 0);
  const backers = campaigns.reduce((sum, campaign) => sum + campaign.backers, 0);
  const stats = [
    {
      label: "Campaigns",
      value: String(campaigns.length),
      hint: "Live tokenized raises",
      icon: Landmark,
    },
    {
      label: "Pledged",
      value: hbar(pledged),
      hint: `${backers} backers across the book`,
      icon: Wallet,
    },
    {
      label: "The Graph",
      value: "Aave + Compound",
      hint: "Same Messari lending schema",
      icon: Command,
    },
    {
      label: "Hedera",
      value: "x402 + HTS",
      hint: "Paid diligence and tokens",
      icon: Shield,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Back tokenized campaigns. An agent checks the creator on-chain first.
        </p>
      </div>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} size="sm">
            <CardHeader>
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-2xl font-bold tabular-nums">
                {stat.value}
              </CardTitle>
              <CardAction>
                <stat.icon className="size-4 text-muted-foreground" />
              </CardAction>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{stat.hint}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">How a backer funds</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, index) => (
            <Card key={step.title} size="sm">
              <CardHeader>
                <CardDescription>Step {index + 1}</CardDescription>
                <CardTitle>{step.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{step.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Integrations</h2>
        <IntegrationStatus />
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Campaigns</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.slug} campaign={campaign} />
          ))}
        </div>
      </section>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Recent pledges</h2>
        <Card>
          <CardContent>
            <RecentPledges />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
