"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeftIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { saveNote, type Note } from "@/lib/notes-storage";

export default function NewNotePage() {
  const router = useRouter();
  const [rawText, setRawText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [structured, setStructured] = useState<Note["structured"] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus textarea on mount
  useEffect(() => {
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 400) + "px";
    }
  }, [rawText]);

  const handleProcess = async () => {
    if (!rawText.trim() || processing) return;

    setProcessing(true);
    setError(null);

    const noteId = crypto.randomUUID();

    try {
      const response = await fetch("/api/notes/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: rawText.trim(), noteId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to process note");
      }

      const data = await response.json();
      setStructured(data.structured);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process note");
    } finally {
      setProcessing(false);
    }
  };

  const handleQuickSave = () => {
    if (!rawText.trim()) return;

    const note: Note = {
      id: crypto.randomUUID(),
      rawText: rawText.trim(),
      createdAt: new Date().toISOString(),
      status: "completed",
      // No structured field - saves as raw note only
    };

    const success = saveNote(note);
    if (success) {
      router.push("/notes");
    } else {
      setError("Failed to save note. Storage may be full.");
    }
  };

  const handleSave = () => {
    if (!structured) return;

    const note: Note = {
      id: crypto.randomUUID(),
      rawText: rawText.trim(),
      createdAt: new Date().toISOString(),
      status: "completed",
      structured,
    };

    const success = saveNote(note);
    if (success) {
      router.push("/notes");
    } else {
      setError("Failed to save note. Storage may be full.");
    }
  };

  const handleDiscard = () => {
    if (confirm("Discard this note?")) {
      router.push("/notes");
    }
  };

  const charCount = rawText.length;
  const canProcess = rawText.trim().length > 0 && !processing && !structured;

  return (
    <main className="p-4 pb-24 min-h-screen">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/notes"
          className="text-orange-500 hover:bg-orange-500/10 p-1.5 rounded-lg transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </Link>
        <h1 className="text-xl font-semibold">New Note</h1>
      </div>

      {/* Textarea for note input */}
      <div className="mb-4">
        <textarea
          ref={textareaRef}
          placeholder="Describe your interaction in natural language...&#10;&#10;Example: Met Sarah Chen from Acme Corp at booth 42 yesterday..."
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          disabled={processing || !!structured}
          rows={8}
          className="w-full bg-zinc-900/50 border border-zinc-700 rounded-2xl px-5 py-4 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500 resize-none overflow-auto max-h-[400px] disabled:opacity-50"
        />
        <div className="flex items-center justify-between mt-2">
          <span className="text-zinc-500 text-sm">{charCount} characters</span>
          {!structured && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleQuickSave}
                disabled={!rawText.trim()}
                className="flex items-center gap-2 bg-zinc-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                Save Note
              </button>
              <button
                type="button"
                onClick={handleProcess}
                disabled={!canProcess}
                className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <SparklesIcon className="w-5 h-5" />
                {processing ? "Processing..." : "AI Structure Note"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {/* Preview of structured data */}
      {structured && (
        <div className="mb-4 rounded-xl bg-zinc-800/80 border border-zinc-700/50 p-4">
          <h2 className="text-lg font-medium mb-3 text-orange-500">Structured Preview</h2>
          <div className="space-y-3">
            {structured.contactName && (
              <Row label="Contact" value={structured.contactName} />
            )}
            {structured.contactTitle && (
              <Row label="Title" value={structured.contactTitle} />
            )}
            {structured.companyName && (
              <Row label="Company" value={structured.companyName} />
            )}
            {structured.interactionType && (
              <Row label="Type" value={structured.interactionType.replace("_", " ")} />
            )}
            {structured.interactionDate && (
              <Row label="Date" value={new Date(structured.interactionDate).toLocaleDateString()} />
            )}
            {structured.location && (
              <Row label="Location" value={structured.location} />
            )}
            {structured.priority && (
              <Row label="Priority" value={structured.priority} />
            )}
            {structured.sentiment && (
              <Row label="Sentiment" value={structured.sentiment} />
            )}
            {structured.summary && (
              <div>
                <span className="text-zinc-500 font-medium">Summary:</span>
                <p className="text-zinc-200 mt-1">{structured.summary}</p>
              </div>
            )}
            {structured.keyPoints && structured.keyPoints.length > 0 && (
              <div>
                <span className="text-zinc-500 font-medium">Key Points:</span>
                <ul className="list-disc list-inside text-zinc-200 mt-1 space-y-1">
                  {structured.keyPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
            {structured.nextSteps && structured.nextSteps.length > 0 && (
              <div>
                <span className="text-zinc-500 font-medium">Next Steps:</span>
                <ul className="list-disc list-inside text-zinc-200 mt-1 space-y-1">
                  {structured.nextSteps.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ul>
              </div>
            )}
            {structured.followUpDate && (
              <Row label="Follow-up Date" value={new Date(structured.followUpDate).toLocaleDateString()} />
            )}
            {structured.tags && structured.tags.length > 0 && (
              <div>
                <span className="text-zinc-500 font-medium">Tags:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {structured.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {structured && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDiscard}
            className="flex-1 bg-zinc-800 text-white px-4 py-3 rounded-lg font-medium hover:bg-zinc-700 transition-all"
          >
            Discard
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 bg-orange-500 text-white px-4 py-3 rounded-lg font-medium hover:bg-orange-600 transition-all active:scale-95"
          >
            Save Note
          </button>
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
