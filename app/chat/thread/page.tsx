"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const RECENT_KEY = "chat-recent";
const RECENT_MAX = 10;

function getThreadKey(type: string, id: string, slug: string): string {
  return type === "directory" ? `chat-thread-${type}-${id}-${slug}` : `chat-thread-${type}-${id}`;
}

function loadThreadMessages(type: string, id: string, slug: string): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getThreadKey(type, id, slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const list = Array.isArray(parsed?.messages) ? parsed.messages : [];
    return list.every((m: unknown) => m && typeof m === "object" && "role" in m && "content" in m)
      ? list as Message[]
      : [];
  } catch {
    return [];
  }
}

function saveThreadMessages(type: string, id: string, slug: string, messages: Message[]) {
  try {
    localStorage.setItem(getThreadKey(type, id, slug), JSON.stringify({ messages }));
  } catch {}
}

function addRecent(item: { id: string; type: string; name: string; snippet: string }) {
  const date = new Date().toISOString();
  let list: Array<{ id: string; type: string; name: string; snippet: string; date: string }> = [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    list = raw ? JSON.parse(raw) : [];
  } catch {}
  list = [{ ...item, date }, ...list.filter((r) => !(r.id === item.id && r.type === item.type))].slice(0, RECENT_MAX);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {}
}

type Message = { role: "user" | "assistant"; content: string };

function ChatThreadContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get("type");
  const id = searchParams.get("id");
  const slug = searchParams.get("slug") ?? "";
  const [name, setName] = useState("");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (!type || !id) {
      setError("Missing type or id");
      setLoading(false);
      return;
    }
    const params = new URLSearchParams({ type, id });
    if (type === "directory" && slug) params.set("slug", slug);
    fetch(`/api/chat/context?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then((data) => {
        setName(data.name ?? "Contact");
        setContext(data.context ?? "");
        const stored = loadThreadMessages(type!, id!, slug);
        if (stored.length > 0) setMessages(stored);
        hasHydratedRef.current = true; // allow persist from now on
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [type, id, slug]);

  useEffect(() => {
    if (type && id && hasHydratedRef.current) saveThreadMessages(type, id, slug, messages);
  }, [type, id, slug, messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!loading && messages.length === 0) {
      // Auto-focus input for new chats
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading, messages.length]);

  const send = useCallback(() => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setSending(true);
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, context }),
    })
      .then((r) => r.json())
      .then((data) => {
        const reply = data.reply ?? "No response.";
        setMessages((m) => [...m, { role: "assistant", content: reply }]);
        addRecent({
          id: id!,
          type: type!,
          name,
          snippet: reply.slice(0, 60) + (reply.length > 60 ? "…" : ""),
        });
      })
      .catch(() => {
        setMessages((m) => [...m, { role: "assistant", content: "Sorry, I couldn’t get a reply." }]);
      })
      .finally(() => setSending(false));
  }, [input, sending, context, id, type, name]);

  if (loading) {
    return (
      <main className="p-4">
        <div className="text-zinc-500">Loading…</div>
      </main>
    );
  }
  if (error) {
    return (
      <main className="p-4">
        <p className="text-red-400">{error}</p>
        <Link href="/chat" className="text-orange-500 underline mt-2 inline-block">
          Back to Chat
        </Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col h-screen">
      <div className="flex items-center gap-2 p-4 pb-2 shrink-0">
        <Link href="/chat" className="text-orange-500 hover:underline text-sm shrink-0">
          ← Chat
        </Link>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-sm font-bold shrink-0">
            {name.slice(0, 2).toUpperCase()}
          </div>
          <span className="font-semibold truncate">{name}</span>
        </div>
      </div>
      <div className="flex-1 px-4 space-y-4 overflow-y-auto pb-4">
        {messages.length === 0 && (
          <p className="text-zinc-500 text-sm">Ask anything about this contact or company. I can search the web for current info if needed.</p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2 ${
                msg.role === "user"
                  ? "bg-orange-500 text-white"
                  : "bg-zinc-800 border border-zinc-700 text-zinc-200"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2 text-zinc-500 text-sm">
              …
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div className="px-4 pb-24 pt-2 flex gap-2 shrink-0 items-center bg-[var(--bg)]">
        <input
          ref={inputRef}
          type="text"
          placeholder="Ask about this contact..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          className="flex-1 bg-zinc-900/50 border-0 rounded-full px-5 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !input.trim()}
          className="bg-orange-500 text-white p-3 rounded-full hover:bg-orange-600 disabled:opacity-50 transition-colors shrink-0"
          aria-label="Send message"
        >
          <img src="/icons/send.svg" alt="" className="w-5 h-5" aria-hidden />
        </button>
      </div>
    </main>
  );
}

export default function ChatThreadPage() {
  return (
    <Suspense fallback={<main className="p-4"><div className="text-zinc-500">Loading…</div></main>}>
      <ChatThreadContent />
    </Suspense>
  );
}
