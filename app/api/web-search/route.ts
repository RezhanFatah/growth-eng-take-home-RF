import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ error: "Missing q" }, { status: 400 });
  }
  const key = process.env.SERPER_API_KEY || process.env.TAVILY_API_KEY;
  if (key && process.env.SERPER_API_KEY) {
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": key, "Content-Type": "application/json" },
        body: JSON.stringify({ q, num: 5 }),
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      const snippets = (data.organic ?? []).slice(0, 5).map((o: { title?: string; snippet?: string; link?: string }) => ({
        title: o.title,
        snippet: o.snippet,
        link: o.link,
      }));
      return NextResponse.json({ query: q, snippets });
    } catch (e) {
      console.error("Serper error:", e);
    }
  }
  return NextResponse.json({
    query: q,
    snippets: [
      { title: "No web search configured", snippet: "Add SERPER_API_KEY or TAVILY_API_KEY for real results. This is a placeholder.", link: "" },
    ],
  });
}
