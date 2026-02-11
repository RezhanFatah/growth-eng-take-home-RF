"use client";

import Link from "next/link";
import { CheckCircleIcon, ExclamationCircleIcon, ArrowPathIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import type { Note } from "@/lib/notes-storage";

type Props = {
  note: Note;
};

export function NoteCard({ note }: Props) {
  // Generate a smart title
  let title = "Quick Note";
  if (note.structured?.companyName && note.structured?.contactName) {
    title = `${note.structured.contactName} @ ${note.structured.companyName}`;
  } else if (note.structured?.companyName) {
    title = note.structured.companyName;
  } else if (note.structured?.contactName) {
    title = note.structured.contactName;
  } else if (note.rawText.length > 0) {
    // Extract first meaningful line as title for raw notes
    const firstLine = note.rawText.split(/[\n.!?]/)[0].trim();
    if (firstLine.length > 0 && firstLine.length <= 60) {
      title = firstLine;
    }
  }

  const displayName = note.structured?.companyName || note.structured?.contactName || "Note";
  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Determine status icon
  let StatusIcon = CheckCircleIcon;
  let statusColor = "text-green-400";
  if (note.status === "processing") {
    StatusIcon = ArrowPathIcon;
    statusColor = "text-blue-400 animate-spin";
  } else if (note.status === "error") {
    StatusIcon = ExclamationCircleIcon;
    statusColor = "text-red-400";
  }

  // Priority badge color
  let priorityColor = "bg-gray-500/20 text-gray-400 border-gray-500/30";
  if (note.structured?.priority === "high") {
    priorityColor = "bg-red-500/20 text-red-400 border-red-500/30";
  } else if (note.structured?.priority === "medium") {
    priorityColor = "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  }

  // Preview text - show AI summary if available, otherwise raw text
  const preview = note.structured?.summary || note.rawText.slice(0, 150);
  const truncated = preview.length > 150 ? preview.slice(0, 150) + "…" : preview;

  // Format date
  const date = new Date(note.createdAt);
  const formattedDate = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
  });

  return (
    <Link href={`/notes/${note.id}`} className="block">
      <div className="rounded-xl bg-zinc-800 border border-zinc-700/50 p-4 hover:bg-zinc-700/50 transition-colors">
        <div className="flex items-start gap-3">
          {/* Company/Contact Badge */}
          <div className="w-12 h-12 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center text-sm font-bold shrink-0">
            {initials}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title row with smart title and status */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-white truncate">{title}</h3>
              <StatusIcon className={`w-4 h-4 shrink-0 ${statusColor}`} />
            </div>

            {/* Subtitle with contact title if available */}
            {note.structured?.contactTitle && (
              <p className="text-zinc-400 text-sm truncate mb-1">
                {note.structured.contactTitle}
              </p>
            )}

            {/* AI Summary preview */}
            {note.structured?.summary && (
              <p className="text-zinc-300 text-sm mb-2 line-clamp-2 font-medium">
                {note.structured.summary}
              </p>
            )}

            {/* Raw text preview for notes without AI processing */}
            {!note.structured?.summary && (
              <p className="text-zinc-400 text-sm mb-2 line-clamp-2 italic">
                {truncated}
              </p>
            )}

            {/* Footer row with priority, date, and arrow */}
            <div className="flex items-center gap-2 text-xs">
              {note.structured?.priority && (
                <span className={`px-2 py-0.5 rounded-full border ${priorityColor}`}>
                  {note.structured.priority}
                </span>
              )}
              {note.structured?.interactionType && (
                <span className="text-zinc-500">
                  {note.structured.interactionType.replace("_", " ")}
                </span>
              )}
              <span className="text-zinc-500 ml-auto">{formattedDate}</span>
              <ChevronRightIcon className="w-4 h-4 text-zinc-600 shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
