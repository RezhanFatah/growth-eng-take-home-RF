"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Convention = {
  _id: string;
  name: string;
  slug: string;
  dates?: string;
  location?: string;
  attendeeCount?: number;
};

function badge(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2)
    return (words[0][0] ?? "") + (words[1][0] ?? "").toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function ConventionsPage() {
  const [list, setList] = useState<Convention[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/conventions")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <main className="p-4 min-h-screen">
        <h1 className="text-center text-lg font-medium text-zinc-200 mt-2">Conventions</h1>
        <p className="text-center text-zinc-400 text-sm mt-1">
          Browse upcoming events and their contacts.
        </p>
        <div className="mt-8 text-zinc-500 text-center">Loading…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-4 min-h-screen">
        <h1 className="text-center text-lg font-medium text-zinc-200 mt-2">Conventions</h1>
        <p className="text-red-400 mt-4">{error}</p>
        <p className="text-zinc-500 text-sm mt-2">
          Ensure Sanity is configured (NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET) and at least one convention exists in Studio.
        </p>
      </main>
    );
  }

  return (
    <main className="p-4 min-h-screen">
      <h1 className="text-center text-lg font-medium text-zinc-200 mt-2">Conventions</h1>
      <p className="text-center ext-zinc-400 text-sm mt-1">
        Browse Expos, Conventions, and Atendees.
      </p>
      <ul className="mt-6 space-y-3">
        {list.length === 0 ? (
          <li className="text-zinc-500 text-center py-8">
            No conventions yet. Add one in Sanity Studio.
          </li>
        ) : (
          list.map((c) => (
            <li key={c._id}>
              <Link
                href={`/conventions/${c.slug}`}
                className="flex items-center gap-3 p-4 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/50"
              >
                <div className="w-12 h-12 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-lg shrink-0">
                  {badge(c.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{c.name}</div>
                  {c.dates && (
                    <div className="text-zinc-400 text-sm flex items-center gap-1.5 mt-1.5 justify-end">
                      {c.dates} <div className="p-0.5 bg-zinc-700/50 rounded"><img src="/icons/calendar.png" alt="" className="w-4 h-4 shrink-0" aria-hidden /></div>
                    </div>
                  )}
                  {c.location && (
                    <div className="text-zinc-400 text-sm flex items-center gap-1.5 mt-1.5 justify-end">
                      {c.location} <div className="p-0.5 bg-zinc-700/50 rounded"><img src="/icons/location.png" alt="" className="w-4 h-4 shrink-0" aria-hidden /></div>
                    </div>
                  )}
                  {c.attendeeCount != null && (
                    <div className="text-zinc-400 text-sm flex items-center gap-1.5 mt-1.5 justify-end">
                      {c.attendeeCount.toLocaleString()} attendees <div className="p-0.5 bg-zinc-700/50 rounded"><img src="/icons/list.png" alt="" className="w-4 h-4 shrink-0" aria-hidden /></div>
                    </div>
                  )}
                </div>
                <span className="text-zinc-500">›</span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
