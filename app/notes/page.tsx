"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { getAllNotes, searchNotes, type Note } from "@/lib/notes-storage";
import { NoteCard } from "@/components/NoteCard";

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Load notes on mount
  useEffect(() => {
    setNotes(getAllNotes());
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(timer);
  }, [query]);

  // Filter notes based on debounced query
  useEffect(() => {
    if (debouncedQuery.trim()) {
      setNotes(searchNotes(debouncedQuery));
    } else {
      setNotes(getAllNotes());
    }
  }, [debouncedQuery]);

  return (
    <main className="p-4 pb-24 min-h-screen">
      <div className="mb-4">
        <h1 className="text-center text-2xl font-semibold mb-4">Notes</h1>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search notes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-zinc-900/50 border-0 rounded-full pl-12 pr-5 py-3 text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-700 appearance-none"
          />
        </div>
      </div>

      {notes.length === 0 && !query.trim() && (
        <div className="text-center py-12">
          <p className="text-zinc-500 mb-4">No notes yet.</p>
          <p className="text-zinc-600 text-sm">
            Capture your trade show interactions and let AI structure them for CRM import.
          </p>
        </div>
      )}

      {notes.length === 0 && query.trim() && (
        <div className="text-center py-12">
          <p className="text-zinc-500">No notes found for "{query}"</p>
        </div>
      )}

      {notes.length > 0 && (
        <div className="space-y-3">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
          ))}
        </div>
      )}

      {/* Floating Add Button */}
      <Link
        href="/notes/new"
        className="fixed bottom-24 right-6 w-14 h-14 bg-orange-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30 hover:bg-orange-600 hover:scale-110 transition-all active:scale-95 z-10"
        aria-label="Add new note"
      >
        <PlusIcon className="w-6 h-6" />
      </Link>
    </main>
  );
}
