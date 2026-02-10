"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const RECENT_KEY = "chat-recent";
const RECENT_MAX = 10;

type RecentItem = {
  id: string;
  type: "company" | "contact" | "directory";
  name: string;
  snippet: string;
  date: string;
};

type SearchResult = {
  companies: Array<{ id: string; type: string; name: string; subtitle: string }>;
  contacts: Array<{ id: string; type: string; name: string; subtitle: string }>;
  directory: Array<{
    id: string;
    type: string;
    source: string;
    name: string;
    subtitle: string;
    conventionSlug?: string;
    entry?: unknown;
  }>;
};

function getRecent(): RecentItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addRecent(item: Omit<RecentItem, "date">) {
  const date = new Date().toISOString();
  const list = [
    { ...item, date },
    ...getRecent().filter((r) => !(r.id === item.id && r.type === item.type)),
  ].slice(0, RECENT_MAX);
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {}
}

export default function ChatPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState<RecentItem[]>([]);

  useEffect(() => {
    setRecent(getRecent());
  }, []);

  const doSearch = useCallback(() => {
    const q = query.trim();
    if (!q) {
      setResults(null);
      return;
    }
    setLoading(true);
    fetch(`/api/chat/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => {
        setResults({
          companies: data.companies ?? [],
          contacts: data.contacts ?? [],
          directory: data.directory ?? [],
        });
      })
      .catch(() => setResults({ companies: [], contacts: [], directory: [] }))
      .finally(() => setLoading(false));
  }, [query]);

  useEffect(() => {
    if (!query.trim()) return;
    const t = setTimeout(doSearch, 400);
    return () => clearTimeout(t);
  }, [query, doSearch]);

  const hasResults =
    results &&
    (results.companies.length > 0 ||
      results.contacts.length > 0 ||
      results.directory.length > 0);

  return (
    <main className="p-4 min-h-screen">
      <h1 className="text-xl font-bold mt-2">Chat</h1>
      <p className="text-zinc-400 text-sm mt-1">
        Search a contact or company to start a conversation.
      </p>
      <div className="mt-4">
        <input
          type="search"
          placeholder="Search name, company, or location..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {loading && <p className="mt-3 text-zinc-500 text-sm">Searching…</p>}

      {results && !loading && (
        <div className="mt-4 space-y-4">
          {results.companies.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                CRM Companies
              </h2>
              <ul className="space-y-2">
                {results.companies.map((c) => (
                  <li key={`company-${c.id}`}>
                    <Link
                      href={`/chat/thread?type=company&id=${c.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/50 hover:bg-zinc-800"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-sm font-bold shrink-0">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{c.name}</div>
                        <div className="text-zinc-400 text-sm truncate">{c.subtitle}</div>
                      </div>
                      <span className="text-xs text-zinc-500 bg-zinc-700 px-2 py-0.5 rounded">CRM</span>
                      <span className="text-zinc-500">›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.contacts.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                CRM Contacts
              </h2>
              <ul className="space-y-2">
                {results.contacts.map((c) => (
                  <li key={`contact-${c.id}`}>
                    <Link
                      href={`/chat/thread?type=contact&id=${c.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/50 hover:bg-zinc-800"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-sm font-bold shrink-0">
                        {c.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{c.name}</div>
                        <div className="text-zinc-400 text-sm truncate">{c.subtitle}</div>
                      </div>
                      <span className="text-xs text-zinc-500 bg-zinc-700 px-2 py-0.5 rounded">CRM</span>
                      <span className="text-zinc-500">›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results.directory.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Directory
              </h2>
              <ul className="space-y-2">
                {results.directory.map((d) => (
                  <li key={`dir-${d.id}`}>
                    <Link
                      href={`/chat/thread?type=directory&id=${encodeURIComponent(d.id)}&slug=${d.conventionSlug ?? ""}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/50 hover:bg-zinc-800"
                    >
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-sm font-bold shrink-0">
                        {d.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{d.name}</div>
                        <div className="text-zinc-400 text-sm truncate">{d.subtitle}</div>
                      </div>
                      <span className="text-xs text-zinc-500 bg-zinc-700 px-2 py-0.5 rounded">
                        {d.source === "target" ? "Exhibitor" : "Attendee"}
                      </span>
                      <span className="text-zinc-500">›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {!hasResults && query.trim() && (
            <div className="text-center py-6">
              <p className="text-zinc-500 mb-3">No results in directory or CRM.</p>
              <Link
                href={`/chat/web-search?q=${encodeURIComponent(query)}`}
                className="inline-block bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600"
              >
                Search the web for “{query}”
              </Link>
            </div>
          )}
        </div>
      )}

      {recent.length > 0 && !results && (
        <section className="mt-6">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            Recent conversations
          </h2>
          <ul className="space-y-2">
            {recent.map((r) => (
              <li key={`${r.type}-${r.id}`}>
                <Link
                  href={`/chat/thread?type=${r.type}&id=${encodeURIComponent(r.id)}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/80 border border-zinc-700/50 hover:bg-zinc-800"
                >
                  <div className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-sm font-bold shrink-0">
                    {r.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{r.name}</div>
                    <div className="text-zinc-400 text-sm truncate">{r.snippet}</div>
                  </div>
                  <span className="text-zinc-500 text-xs shrink-0">
                    {new Date(r.date).toLocaleDateString()}
                  </span>
                  <span className="text-zinc-500">›</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
