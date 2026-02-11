import Anthropic from "@anthropic-ai/sdk";
import type { EngagementItem } from "./engagement-cache";

function engagementToText(e: EngagementItem, index: number): string {
  const parts = [
    `[${index + 1}] Type: ${e.type}`,
    `Date: ${e.timestamp}`,
    e.title ? `Title: ${e.title}` : "",
    e.direction ? `Direction: ${e.direction}` : "",
    e.duration ? `Duration: ${e.duration}` : "",
    e.contactName ? `Contact: ${e.contactName}` : "",
    e.body ? `Content: ${e.body.slice(0, 3000)}` : "",
  ].filter(Boolean);
  return parts.join("\n");
}

export type SummaryResult = {
  displaySummaries: string[];
  contextSummary: string;
};

const DISPLAY_SUMMARY_MAX_TOKENS = 1024;

const SYSTEM_PROMPT = `You are a sales assistant. Given a list of CRM engagements (calls, emails, meetings, notes), produce two outputs in valid JSON only:

1. "displaySummaries": an array of strings, one per engagement in the same order. Each string is a brief, readable summary for a UI card (who, what, outcome). Maximum ~${DISPLAY_SUMMARY_MAX_TOKENS} tokens per summary. No markdown.

2. "contextSummary": a single comprehensive summary of all engagements for an AI to use as context when answering questions about this contact/company. Include dates, participants, key topics, outcomes, next steps, and any notable details. Be thorough so the AI can answer follow-up questions accurately.

Return ONLY valid JSON in this exact shape (no code block):
{"displaySummaries":["...","..."], "contextSummary":"..."}`;

export async function generateEngagementSummaries(
  engagements: EngagementItem[],
  apiKey: string
): Promise<SummaryResult | null> {
  if (engagements.length === 0) {
    return { displaySummaries: [], contextSummary: "No engagement history." };
  }

  const inputText = engagements.map((e, i) => engagementToText(e, i)).join("\n\n---\n\n");

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: inputText }],
    });

    const content = message.content[0];
    if (content.type !== "text") return null;
    let text = content.text.trim();
    if (text.startsWith("```json")) text = text.replace(/^```json\n?/, "").replace(/\n?```$/, "");
    else if (text.startsWith("```")) text = text.replace(/^```\n?/, "").replace(/\n?```$/, "");

    const parsed = JSON.parse(text) as { displaySummaries?: string[]; contextSummary?: string };
    const displaySummaries = Array.isArray(parsed.displaySummaries)
      ? parsed.displaySummaries
      : [];
    const contextSummary =
      typeof parsed.contextSummary === "string" ? parsed.contextSummary : "No summary available.";
    return { displaySummaries, contextSummary };
  } catch (e) {
    console.error("Engagement summary error:", e);
    return null;
  }
}
