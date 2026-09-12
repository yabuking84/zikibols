import Link from "next/link";
import { BookOpen } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DOC_PAGES } from "@/lib/docs";

export default function DocsIndexPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-medium text-muted-foreground">Documentation</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Docs</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          These pages are the same README files in the repo — not a second copy.
          Start with the plain-English note if you just want the story.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {DOC_PAGES.map((page) => (
          <Link key={page.slug} href={`/docs/${page.slug}`} className="group">
            <Card className="h-full transition-colors group-hover:bg-muted/40">
              <CardHeader>
                <CardDescription className="flex items-center gap-1.5">
                  <BookOpen className="size-3.5" />
                  {page.file}
                </CardDescription>
                <CardTitle>{page.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{page.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
