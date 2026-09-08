import { NextRequest, NextResponse } from "next/server";
import { runDueDiligence } from "@/lib/agent";

function originFrom(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return "http://localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      campaignTitle?: string;
      creatorWallet?: string;
      creatorName?: string;
      creatorEmail?: string | null;
      location?: string;
    };

    if (!body.campaignTitle || !body.creatorWallet) {
      return NextResponse.json(
        { error: "campaignTitle and creatorWallet are required" },
        { status: 400 },
      );
    }

    const result = await runDueDiligence({
      origin: originFrom(request),
      campaignTitle: body.campaignTitle,
      creatorWallet: body.creatorWallet,
      creatorName: body.creatorName?.trim() || "Unknown creator",
      creatorEmail: body.creatorEmail?.trim() || null,
      location: body.location?.trim() || "",
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
