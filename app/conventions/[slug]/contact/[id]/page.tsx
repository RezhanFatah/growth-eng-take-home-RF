"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/solid";

type Convention = { name: string; slug: string; dates?: string; location?: string };
type DirectoryEntry = {
  id: string;
  source: string;
  companyName: string;
  companyDomain: string;
  personName?: string;
  personTitle?: string;
  location?: string;
  score?: number;
  tier?: string;
  fitReasons?: string;
  raw: Record<string, string>;
};

export default function DirectoryContactPage() {
  const params = useParams();
  const slug = params.slug as string;
  const id = params.id as string;
  const [convention, setConvention] = useState<Convention | null>(null);
  const [entry, setEntry] = useState<DirectoryEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch(`/api/conventions/${slug}/directory`)
      .then((r) => r.json())
      .then((data) => {
        setConvention(data.convention);
        const all = [...(data.exhibitors ?? []), ...(data.attendees ?? [])];
        const found = all.find((e: DirectoryEntry) => e.id === decodeURIComponent(id));
        setEntry(found ?? null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [slug, id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <main className="p-4"><div className="text-zinc-500">Loading…</div></main>;
  if (error) return <main className="p-4"><p className="text-red-400">{error}</p></main>;
  if (!entry) return <main className="p-4"><p className="text-zinc-500">Contact not found.</p></main>;

  const displayName = entry.personName || entry.companyName;

  return (
    <main className="p-4 min-h-screen pb-20 relative">
      <Link
        href={`/conventions/${slug}`}
        className="text-orange-500 hover:underline text-sm inline-block mb-4"
      >
        ← Back to {convention?.name ?? "directory"}
      </Link>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-xl font-bold">
          {displayName.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-center text-lg font-medium text-zinc-200">{displayName}</h1>
          {entry.personTitle && (
            <p className="text-zinc-400 text-sm">{entry.personTitle}</p>
          )}
        </div>
      </div>
      <div className="rounded-xl bg-zinc-800/80 border border-zinc-700/50 p-4 space-y-3">
        <Row label="Company" value={entry.companyName} />
        {entry.location && <Row label="Location" value={entry.location} />}
        {entry.raw["Email"] && <Row label="Email" value={entry.raw["Email"]} />}
        {entry.raw["Phone"] && <Row label="Phone" value={entry.raw["Phone"]} />}
        {entry.raw["Website"] && <Row label="Website" value={entry.raw["Website"]} />}
        {entry.raw["Company URL"] && <Row label="Website" value={entry.raw["Company URL"]} />}
        {entry.raw["Platform"] && <Row label="Platform" value={entry.raw["Platform"]} />}
        {entry.raw["Revenue"] && <Row label="Revenue" value={entry.raw["Revenue"]} />}
        {entry.score != null && (
          <Row
            label="Fit score"
            value={entry.tier ? `${entry.score} — ${entry.tier}` : String(entry.score)}
          />
        )}
        {entry.fitReasons && (
          <Row label="Fit reasons" value={entry.fitReasons} />
        )}
      </div>
      {Object.keys(entry.raw).length > 0 && (
        <div className="mt-4 rounded-xl bg-zinc-800/80 border border-zinc-700/50 p-4">
          <h2 className="text-center text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
            All fields
          </h2>
          <dl className="space-y-1 text-sm">
            {Object.entries(entry.raw).map(([k, v]) =>
              v ? (
                <div key={k} className="flex gap-2">
                  <dt className="text-zinc-500 shrink-0">{k}:</dt>
                  <dd className="break-words">{v}</dd>
                </div>
              ) : null
            )}
          </dl>
        </div>
      )}

      {/* Floating AI Chat Button */}
      <Link
        href={`/chat/thread?type=directory&id=${encodeURIComponent(id)}&slug=${slug}`}
        className="fixed bottom-24 right-6 w-14 h-14 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 hover:bg-orange-600 hover:scale-110 transition-all active:scale-95 z-10"
        aria-label="Ask AI about this contact"
      >
        <ChatBubbleLeftRightIcon className="w-6 h-6" />
      </Link>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  const isWebsite = label === "Website";
  const isEmail = label === "Email";
  const isPhone = label === "Phone";

  const url = value && isWebsite ? (value.startsWith("http") ? value : `https://${value}`) : null;
  const mailto = value && isEmail ? `mailto:${value}` : null;
  const tel = value && isPhone ? `tel:${value}` : null;

  return (
    <div className="flex gap-2">
      <span className="text-zinc-500 shrink-0">{label}:</span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="break-words text-orange-500 hover:underline"
        >
          {value}
        </a>
      ) : mailto ? (
        <a
          href={mailto}
          className="break-words text-orange-500 hover:underline"
        >
          {value}
        </a>
      ) : tel ? (
        <a
          href={tel}
          className="break-words text-orange-500 hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className="break-words">{value || "—"}</span>
      )}
    </div>
  );
}
