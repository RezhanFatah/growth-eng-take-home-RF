"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeftIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  EllipsisVerticalIcon,
} from "@heroicons/react/24/outline";
import { getNoteById, deleteNote, type Note } from "@/lib/notes-storage";

const RAW_PREVIEW_LENGTH = 380;

export default function NoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [note, setNote] = useState<Note | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const found = getNoteById(id);
    setNote(found);
  }, [id]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [showMenu]);

  const handleDelete = () => {
    if (!note) return;
    if (confirm("Delete this note? This action cannot be undone.")) {
      const success = deleteNote(note.id);
      if (success) {
        router.push("/notes");
      }
    }
  };

  const downloadNote = () => {
    if (!note) return;
    setShowMenu(false);

    // For raw notes without AI structure, download as text file
    if (!note.structured) {
      const blob = new Blob([note.rawText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date(note.createdAt).toISOString().split("T")[0];
      a.download = `note-${date}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // For AI-structured notes, download as markdown
    const s = note.structured;
    let md = `# ${s.companyName || "Note"} - ${s.contactName || ""}

**Date:** ${s.interactionDate ? new Date(s.interactionDate).toLocaleDateString() : new Date(note.createdAt).toLocaleDateString()}
**Type:** ${s.interactionType?.replace("_", " ") || "—"}
**Priority:** ${s.priority || "—"}
${s.sentiment ? `**Sentiment:** ${s.sentiment}` : ""}

## Summary
${s.summary || "—"}

`;

    if (s.keyPoints && s.keyPoints.length > 0) {
      md += `## Key Points
${s.keyPoints.map((p) => `- ${p}`).join("\n")}

`;
    }

    if (s.nextSteps && s.nextSteps.length > 0) {
      md += `## Next Steps
${s.nextSteps.map((step) => `- [ ] ${step}`).join("\n")}

`;
    }

    if (s.tags && s.tags.length > 0) {
      md += `## Tags
${s.tags.map((t) => `\`${t}\``).join(", ")}

`;
    }

    if (s.location) {
      md += `**Location:** ${s.location}\n`;
    }

    if (s.followUpDate) {
      md += `**Follow-up Date:** ${new Date(s.followUpDate).toLocaleDateString()}\n`;
    }

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date(note.createdAt).toISOString().split("T")[0];
    a.download = `note-${note.id}-${date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!note) {
    return (
      <main className="p-4">
        <p className="text-zinc-500">Note not found.</p>
        <Link href="/notes" className="text-orange-500 underline mt-2 inline-block">
          Back to Notes
        </Link>
      </main>
    );
  }

  const displayName = note.structured?.companyName || note.structured?.contactName || "Note";
  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="p-4 pb-24 min-h-screen relative">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/notes"
          className="text-orange-500 hover:bg-orange-500/10 p-1.5 rounded-lg transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-sm font-bold shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-semibold truncate">{displayName}</h1>
            {note.structured?.contactName && note.structured?.companyName && (
              <p className="text-zinc-400 text-sm truncate">{note.structured.contactName}</p>
            )}
          </div>
        </div>
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu((v) => !v);
            }}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/50 transition-colors"
            aria-label="Note options"
          >
            <EllipsisVerticalIcon className="w-6 h-6" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1 py-1 w-48 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl z-20">
              <button
                type="button"
                onClick={() => {
                  downloadNote();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-zinc-700 transition-colors"
              >
                <ArrowDownTrayIcon className="w-5 h-5 shrink-0" />
                Download note
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowMenu(false);
                  handleDelete();
                }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <TrashIcon className="w-5 h-5 shrink-0" />
                Delete note
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error state */}
      {note.status === "error" && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          Failed to process this note: {note.error || "Unknown error"}
        </div>
      )}

      {/* Raw note preview when not AI-structured */}
      {!note.structured && note.rawText && (
        <div className="mb-4 rounded-xl bg-zinc-800/80 border border-zinc-700/50 p-4">
          <h2 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Note</h2>
          <p className="text-zinc-300 whitespace-pre-wrap text-sm">
            {showRawText ? note.rawText : note.rawText.slice(0, RAW_PREVIEW_LENGTH)}
            {!showRawText && note.rawText.length > RAW_PREVIEW_LENGTH && "…"}
          </p>
          {note.rawText.length > RAW_PREVIEW_LENGTH && (
            <button
              type="button"
              onClick={() => setShowRawText(!showRawText)}
              className="mt-2 flex items-center gap-1 text-zinc-400 hover:text-zinc-300 text-sm font-medium"
            >
              {showRawText ? (
                <>
                  <ChevronUpIcon className="w-4 h-4" /> Show less
                </>
              ) : (
                <>
                  <ChevronDownIcon className="w-4 h-4" /> Show full note
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Structured data display */}
      {note.structured && (
        <div className="mb-4 rounded-xl bg-zinc-800/80 border border-zinc-700/50 p-4 space-y-4">
          {/* Basic info */}
          <div className="space-y-2">
            {note.structured.contactTitle && (
              <Row label="Title" value={note.structured.contactTitle} />
            )}
            {note.structured.companyName && (
              <Row label="Company" value={note.structured.companyName} />
            )}
            {note.structured.interactionType && (
              <Row label="Type" value={note.structured.interactionType.replace("_", " ")} />
            )}
            {note.structured.interactionDate && (
              <Row
                label="Date"
                value={new Date(note.structured.interactionDate).toLocaleDateString()}
              />
            )}
            {note.structured.location && (
              <Row label="Location" value={note.structured.location} />
            )}
            {note.structured.priority && (
              <Row label="Priority" value={note.structured.priority} />
            )}
            {note.structured.sentiment && (
              <Row label="Sentiment" value={note.structured.sentiment} />
            )}
          </div>

          {/* Summary */}
          {note.structured.summary && (
            <Section title="Summary">
              <p className="text-zinc-200">{note.structured.summary}</p>
            </Section>
          )}

          {/* Key Points */}
          {note.structured.keyPoints && note.structured.keyPoints.length > 0 && (
            <Section title="Key Points">
              <ul className="list-disc list-inside text-zinc-200 space-y-1">
                {note.structured.keyPoints.map((point, i) => (
                  <li key={i}>{point}</li>
                ))}
              </ul>
            </Section>
          )}

          {/* Next Steps */}
          {note.structured.nextSteps && note.structured.nextSteps.length > 0 && (
            <Section title="Next Steps">
              <ul className="list-disc list-inside text-zinc-200 space-y-1">
                {note.structured.nextSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </Section>
          )}

          {/* Follow-up date */}
          {note.structured.followUpDate && (
            <Row
              label="Follow-up"
              value={new Date(note.structured.followUpDate).toLocaleDateString()}
            />
          )}

          {/* Tags */}
          {note.structured.tags && note.structured.tags.length > 0 && (
            <Section title="Tags">
              <div className="flex flex-wrap gap-2">
                {note.structured.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Section>
          )}
        </div>
      )}

      {/* Raw text toggle for structured notes (show original) */}
      {note.structured && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowRawText(!showRawText)}
            className="flex items-center gap-2 text-zinc-400 hover:text-zinc-300 transition-colors"
          >
            {showRawText ? (
              <ChevronUpIcon className="w-5 h-5" />
            ) : (
              <ChevronDownIcon className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">
              {showRawText ? "Hide" : "Show"} Original Note
            </span>
          </button>
          {showRawText && (
            <div className="mt-2 p-4 rounded-xl bg-zinc-900/50 border border-zinc-700/50">
              <p className="text-zinc-300 whitespace-pre-wrap">{note.rawText}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-zinc-500 shrink-0">{label}:</span>
      <span className="text-zinc-200">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-zinc-400 font-medium text-sm mb-2">{title}</h3>
      {children}
    </div>
  );
}
