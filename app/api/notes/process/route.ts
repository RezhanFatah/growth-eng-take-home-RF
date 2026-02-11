import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are an expert at extracting structured information from natural language notes about business interactions.

Your task is to analyze the user's note and extract the following information in valid JSON format:

{
  "contactName": "Full name of the person (if mentioned)",
  "contactTitle": "Job title or role (if mentioned)",
  "companyName": "Company name (if mentioned)",
  "interactionType": "meeting" | "booth_visit" | "follow_up" | "phone_call" | "other",
  "summary": "A clear, concise 1-2 sentence summary of the interaction",
  "keyPoints": ["Array of important points discussed or noted"],
  "interactionDate": "ISO date string (YYYY-MM-DD) - convert relative dates like 'yesterday', 'last Tuesday' to actual dates based on today's date",
  "location": "Physical location or venue (if mentioned)",
  "conventionSlug": "Convention name in lowercase-kebab-case if it's a known event (e.g., 'ces-2024', 'nrf-2025')",
  "nextSteps": ["Array of action items or follow-up tasks"],
  "followUpDate": "ISO date string for when to follow up (if mentioned or implied)",
  "priority": "high" | "medium" | "low" - infer from urgency language,
  "tags": ["Array of relevant CRM tags like 'enterprise', 'hot-lead', 'product-demo', etc."],
  "sentiment": "positive" | "neutral" | "negative" - overall tone of the interaction
}

Rules:
- Only include fields that can be reliably extracted from the note
- For dates: Today is ${new Date().toISOString().split("T")[0]}
- Convert relative dates (yesterday, last week, next Monday, etc.) to ISO date strings
- If urgency words like "urgent", "ASAP", "critical" appear, set priority to "high"
- If casual or exploratory language, set priority to "low"
- Default priority is "medium"
- Infer sentiment from language tone (enthusiastic = positive, problematic = negative)
- Generate practical CRM tags based on content (industry, deal stage, product interest, etc.)
- Return ONLY valid JSON, no markdown code blocks or extra text`;

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await req.json();
    const { rawText, noteId } = body;

    if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
      return NextResponse.json(
        { error: "Invalid or missing rawText" },
        { status: 400 }
      );
    }

    if (!noteId || typeof noteId !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing noteId" },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: rawText.trim(),
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    let responseText = content.text.trim();

    // Handle markdown code blocks if present
    if (responseText.startsWith("```json")) {
      responseText = responseText.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (responseText.startsWith("```")) {
      responseText = responseText.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    // Parse JSON response
    const structured = JSON.parse(responseText);

    return NextResponse.json({ structured });
  } catch (error) {
    console.error("Error processing note:", error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process note" },
      { status: 500 }
    );
  }
}
