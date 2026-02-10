import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(req: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "Chat not configured" },
      { status: 503 }
    );
  }
  try {
    const body = await req.json();
    const { message, context } = body as { message: string; context?: string };
    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Missing message" },
        { status: 400 }
      );
    }
    const anthropic = new Anthropic({ apiKey: key });
    const system = context
      ? `You are a helpful assistant for a sales team at a trade show. Answer only using the provided context. If the answer is not in the context, say "Not in our data" or "Unknown." Do not invent details.\n\nContext:\n${context}`
      : "You are a helpful assistant. You have no context about a company or contact yet. Ask the user to search for a company or contact first.";
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: message }],
    });
    const text =
      response.content
        .filter((c): c is { type: "text"; text: string } => c.type === "text")
        .map((c) => c.text)
        .join("") || "No response.";
    return NextResponse.json({ reply: text });
  } catch (e) {
    console.error("Chat API error:", e);
    return NextResponse.json(
      { error: "Failed to get reply" },
      { status: 500 }
    );
  }
}
