import { NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity";
import { conventionsQuery } from "@/lib/sanity";
import type { ConventionListItem } from "@/lib/sanity";

export async function GET() {
  try {
    if (!sanityClient) {
      return NextResponse.json(
        { error: "Sanity project not configured" },
        { status: 503 }
      );
    }
    const list = await sanityClient.fetch<ConventionListItem[]>(conventionsQuery);
    return NextResponse.json(list);
  } catch (e) {
    console.error("Conventions fetch error:", e);
    return NextResponse.json(
      { error: "Failed to fetch conventions" },
      { status: 500 }
    );
  }
}
