"use client";

import { useEffect, useState } from "react";
import {
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

type EngagementItem = {
  id: string;
  type: "call" | "email" | "meeting" | "note";
  timestamp: string;
  title?: string;
  body?: string;
  direction?: string;
  duration?: string;
  contactName?: string;
};

type EngagementsSectionProps = {
  engagementsUrl: string;
  title?: string;
};

const TYPE_LABELS: Record<EngagementItem["type"], string> = {
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  note: "Note",
};

const TYPE_ICONS: Record<EngagementItem["type"], React.ComponentType<{ className?: string }>> = {
  call: PhoneIcon,
  email: EnvelopeIcon,
  meeting: CalendarDaysIcon,
  note: DocumentTextIcon,
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function EngagementsSection({
  engagementsUrl,
  title = "Recent activity",
}: EngagementsSectionProps) {
  const [data, setData] = useState<{
    engagements: EngagementItem[];
    displaySummaries: string[];
    contextSummary: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch(engagementsUrl)
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 429 ? "Too many requests. Try again in a moment." : "Failed to load");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [engagementsUrl]);

  if (loading && !data) {
    return (
      <div className="mt-4 rounded-xl bg-zinc-800/80 border border-zinc-700/50 p-4">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
          {title}
        </h2>
        <p className="text-zinc-500 text-sm">Loading…</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mt-4 rounded-xl bg-zinc-800/80 border border-zinc-700/50 p-4">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
          {title}
        </h2>
        <p className="text-zinc-400 text-sm mb-2">Couldn&apos;t load engagement history.</p>
        <p className="text-zinc-500 text-xs mb-3">{error}</p>
        <button
          type="button"
          onClick={load}
          className="text-sm font-medium text-orange-500 hover:text-orange-400"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data || data.engagements.length === 0) {
    return (
      <div className="mt-4 rounded-xl bg-zinc-800/80 border border-zinc-700/50 p-4">
        <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
          {title}
        </h2>
        <p className="text-zinc-500 text-sm">No recent engagements.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl bg-zinc-800/80 border border-zinc-700/50 p-4">
      <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">
        {title}
      </h2>
      <ul className="space-y-3">
        {data.engagements.map((e, i) => {
          const Icon = TYPE_ICONS[e.type];
          const summary = data.displaySummaries[i] ?? "Summary unavailable.";
          return (
            <li
              key={`${e.type}-${e.id}`}
              className="p-3 rounded-lg bg-zinc-800 border border-zinc-700/50"
            >
              <div className="flex items-center gap-2 text-zinc-400 text-xs mb-1">
                {Icon && <Icon className="w-4 h-4" />}
                <span>{TYPE_LABELS[e.type]}</span>
                <span>·</span>
                <span>{formatDate(e.timestamp)}</span>
                {e.contactName && (
                  <>
                    <span>·</span>
                    <span>{e.contactName}</span>
                  </>
                )}
              </div>
              {e.title && e.title !== TYPE_LABELS[e.type] && (
                <p className="text-zinc-300 text-sm font-medium mb-1">{e.title}</p>
              )}
              <p className="text-zinc-300 text-sm whitespace-pre-wrap">{summary}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
