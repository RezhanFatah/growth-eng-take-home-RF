import { NextRequest, NextResponse } from "next/server";
import { sanityClient } from "@/lib/sanity";
import { conventionBySlugQuery } from "@/lib/sanity";
import {
  parseCsvToEntries,
  buildDirectoryIndex,
  searchDirectory,
  groupBySource,
  type DirectoryEntry,
} from "@/lib/directory";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const slug = (await params).slug;
  if (!slug) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }
  if (!sanityClient) {
    return NextResponse.json({ error: "Sanity not configured" }, { status: 503 });
  }
  try {
    const convention = await sanityClient.fetch(conventionBySlugQuery, { slug });
    if (!convention) {
      return NextResponse.json({ error: "Convention not found" }, { status: 404 });
    }
    const targetUrl = convention.targetListUrl;
    const attendeeUrl = convention.attendeeListUrl;
    const searchParam = _req.nextUrl.searchParams.get("q") ?? "";

    let targetEntries: DirectoryEntry[] = [];
    let attendeeEntries: DirectoryEntry[] = [];

    if (targetUrl) {
      const res = await fetch(targetUrl);
      const text = await res.text();
      targetEntries = parseCsvToEntries(text, "target");
    }
    if (attendeeUrl) {
      const res = await fetch(attendeeUrl);
      const text = await res.text();
      attendeeEntries = parseCsvToEntries(text, "attendee");
    }

    const allEntries = buildDirectoryIndex(targetEntries, attendeeEntries);
    const filtered = searchDirectory(allEntries, searchParam);
    const { exhibitors, attendees } = groupBySource(filtered);

    return NextResponse.json({
      convention: {
        _id: convention._id,
        name: convention.name,
        slug: convention.slug,
        dates: convention.dates,
        location: convention.location,
        attendeeCount: convention.attendeeCount,
      },
      exhibitors,
      attendees,
      total: filtered.length,
    });
  } catch (e) {
    console.error("Directory fetch error:", e);
    return NextResponse.json(
      { error: "Failed to load directory" },
      { status: 500 }
    );
  }
}
