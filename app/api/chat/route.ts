import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

async function searchWeb(query: string): Promise<string> {
  const tavilyKey = process.env.TAVILY_API_KEY;
  const serperKey = process.env.SERPER_API_KEY;

  // Try Tavily first (better for AI)
  if (tavilyKey) {
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyKey,
          query,
          search_depth: "advanced",
          max_results: 10,
          include_answer: true,
          include_raw_content: false,
        }),
      });
      if (!res.ok) throw new Error("Tavily search failed");
      const data = await res.json();

      let results = "";
      if (data.answer) {
        results += `Answer Summary: ${data.answer}\n\n`;
      }

      const sources = (data.results ?? []).map((r: { title?: string; content?: string; url?: string }) =>
        `Title: ${r.title}\nContent: ${r.content}\nURL: ${r.url}`
      ).join("\n\n");

      results += sources;
      return results || "No search results found.";
    } catch (e) {
      console.error("Tavily error:", e);
      // Fall through to Serper if Tavily fails
    }
  }

  // Fallback to Serper
  if (serperKey) {
    try {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
        body: JSON.stringify({ q: query, num: 10 }),
      });
      if (!res.ok) throw new Error("Serper search failed");
      const data = await res.json();
      const results = (data.organic ?? []).slice(0, 10).map((o: { title?: string; snippet?: string; link?: string }) =>
        `Title: ${o.title}\nSnippet: ${o.snippet}\nURL: ${o.link}`
      ).join("\n\n");
      return results || "No search results found.";
    } catch (e) {
      console.error("Serper error:", e);
      return "Web search failed.";
    }
  }

  return "Web search is not configured. Please add TAVILY_API_KEY or SERPER_API_KEY to your environment variables.";
}

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
      ? `You are a sales and customer acquisition assistant. Your focus is helping with sales research, lead qualification, customer outreach, and business development.

SCOPE: Only answer questions related to:
- Sales and acquisition strategies
- Company information, products, services, and business details
- Contact information and engagement history
- Lead qualification and prospect research
- Competitive analysis and market research
- Pricing, deals, and sales opportunities
- Customer relationship management

OUT OF SCOPE: Politely decline questions about:
- Personal topics (weather, trips, hobbies, general knowledge)
- Non-business related queries
- Technical support unrelated to sales

INFORMATION SOURCES:
- Use the provided context data first
- When you need current information not in the context (recent news, company updates, products, pricing, LinkedIn profiles), immediately use the search_web tool
- IMPORTANT: Always cite your sources. When you use information from web search, explicitly tell the user "According to [source]..." or "Based on web search results..." and mention the source URL when relevant

Context:\n${context}.`
      : "You are a sales and customer acquisition assistant. You have no context about a company or contact yet. Ask the user to search for a company or contact first to get started.";

    const tools: Anthropic.Tool[] = [
      {
        name: "search_web",
        description: "Search the web for current sales-relevant information. Use this immediately when the user asks about: company details, products, services, recent news, pricing, LinkedIn profiles, employee information, competitive analysis, market research, or anything not in the provided context. Do not ask permission - just use this tool and provide the answer. IMPORTANT: Always cite the sources in your response by mentioning 'According to [source URL]...' or 'Based on web search results from [source]...'",
        input_schema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query focused on sales/business topics - be specific and include company name when relevant"
            }
          },
          required: ["query"]
        }
      }
    ];

    let messages: Anthropic.MessageParam[] = [{ role: "user", content: message }];
    let response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      system,
      tools,
      messages,
    });

    // Handle tool use
    while (response.stop_reason === "tool_use") {
      const toolUse = response.content.find((block): block is Anthropic.ToolUseBlock => block.type === "tool_use");
      if (!toolUse) break;

      let toolResult: string;
      if (toolUse.name === "search_web") {
        const { query } = toolUse.input as { query: string };
        toolResult = await searchWeb(query);
      } else {
        toolResult = "Unknown tool";
      }

      messages = [
        ...messages,
        { role: "assistant", content: response.content },
        {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: toolUse.id,
              content: toolResult,
            },
          ],
        },
      ];

      response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system,
        tools,
        messages,
      });
    }

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
