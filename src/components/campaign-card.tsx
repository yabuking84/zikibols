import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  assetClassLabel,
  fundedPercent,
  isSeedCatalog,
  type Campaign,
} from "@/lib/campaigns";
import { hbar } from "@/lib/money";

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const funded = fundedPercent(campaign);

  return (
    <Link href={`/campaigns/${campaign.slug}`} className="block h-full">
      <Card className="h-full transition-colors hover:bg-muted/40">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle>{campaign.title}</CardTitle>
            <Badge variant="secondary">{campaign.tokenSymbol}</Badge>
          </div>
          <CardDescription>{campaign.blurb}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex text-sm">
            <span className="font-medium">
              {hbar(campaign.pledgedHbar)} pledged
              {isSeedCatalog(campaign.slug) ? (
                <span className="font-normal text-muted-foreground"> (includes seed book)</span>
              ) : null}
            </span>
            <span className="ml-auto text-muted-foreground tabular-nums">{funded}%</span>
          </div>
          <Progress value={funded} />
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          {assetClassLabel(campaign.assetClass)} · {campaign.backers} backers ·{" "}
          {campaign.daysLeft}d left
        </CardFooter>
      </Card>
    </Link>
  );
}
