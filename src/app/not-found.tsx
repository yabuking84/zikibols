import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-3 py-16">
      <p className="text-sm text-muted-foreground">404</p>
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="text-muted-foreground">
        That route is not a campaign, docs, or dashboard page.
      </p>
      <Link href="/" className={`${buttonVariants()} w-fit`}>
        Back to dashboard
      </Link>
    </div>
  );
}
