"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function WebSearchContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [snippets, setSnippets] = useState<Array<{ title?: string; snippet?: string; link?: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!q) {
      setLoading(false);
      return;
    }
    fetch(`/api/web-search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => setSnippets(data.snippets ?? []))
      .catch(() => setSnippets([]))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <main className="p-4 pb-20">
      <Link href="/chat" className="text-orange-500 hover:underline text-sm inline-block mb-4">
        ← Back to Chat
      </Link>
      <h1 className="text-xl font-bold mt-2">Web results for “{q}”</h1>
      {loading ? (
        <p className="text-zinc-500 mt-4">Searching…</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {snippets.map((s, i) => (
            <li
              key={i}
              className="p-4 rounded-xl bg-zinc-800/80 border border-zinc-700/50"
            >
              {s.link ? (
                <a
                  href={s.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-orange-500 hover:underline block"
                >
                  {s.title ?? "Link"}
                </a>
              ) : (
                <span className="font-medium text-zinc-300">{s.title ?? "Result"}</span>
              )}
              {s.snippet && (
                <p className="text-zinc-400 text-sm mt-1">{s.snippet}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function WebSearchPage() {
  return (
    <Suspense fallback={<main className="p-4"><p className="text-zinc-500">Loading…</p></main>}>
      <WebSearchContent />
    </Suspense>
  );
}
