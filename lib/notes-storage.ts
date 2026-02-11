// localStorage utility functions for Notes section

const NOTES_KEY = "notes-storage-v1";

export type Note = {
  id: string;
  rawText: string;
  createdAt: string;
  status: "processing" | "completed" | "error";
  structured?: {
    contactName?: string;
    contactTitle?: string;
    companyName?: string;
    interactionType: "meeting" | "booth_visit" | "follow_up" | "phone_call" | "other";
    summary: string;
    keyPoints: string[];
    interactionDate?: string;
    location?: string;
    conventionSlug?: string;
    nextSteps?: string[];
    followUpDate?: string;
    priority?: "high" | "medium" | "low";
    tags?: string[];
    sentiment?: "positive" | "neutral" | "negative";
  };
  error?: string;
};

/**
 * Get all notes sorted by date (newest first)
 */
export function getAllNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(NOTES_KEY);
    if (!raw) return [];
    const notes = JSON.parse(raw);
    if (!Array.isArray(notes)) return [];
    // Sort by createdAt descending (newest first)
    return notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

/**
 * Get a single note by ID
 */
export function getNoteById(id: string): Note | null {
  if (typeof window === "undefined") return null;
  try {
    const notes = getAllNotes();
    return notes.find((note) => note.id === id) ?? null;
  } catch {
    return null;
  }
}

/**
 * Save a new note
 */
export function saveNote(note: Note): boolean {
  if (typeof window === "undefined") return false;
  try {
    const notes = getAllNotes();
    notes.push(note);
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    return true;
  } catch {
    return false;
  }
}

/**
 * Update an existing note
 */
export function updateNote(id: string, updates: Partial<Note>): boolean {
  if (typeof window === "undefined") return false;
  try {
    const notes = getAllNotes();
    const index = notes.findIndex((note) => note.id === id);
    if (index === -1) return false;
    notes[index] = { ...notes[index], ...updates };
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    return true;
  } catch {
    return false;
  }
}

/**
 * Delete a note by ID
 */
export function deleteNote(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const notes = getAllNotes();
    const filtered = notes.filter((note) => note.id !== id);
    localStorage.setItem(NOTES_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

/**
 * Search notes by contact name, company name, or location
 */
export function searchNotes(query: string): Note[] {
  if (typeof window === "undefined") return [];
  if (!query.trim()) return getAllNotes();

  try {
    const notes = getAllNotes();
    const lowerQuery = query.toLowerCase();

    return notes.filter((note) => {
      const contactName = note.structured?.contactName?.toLowerCase() ?? "";
      const companyName = note.structured?.companyName?.toLowerCase() ?? "";
      const location = note.structured?.location?.toLowerCase() ?? "";
      const rawText = note.rawText.toLowerCase();

      return (
        contactName.includes(lowerQuery) ||
        companyName.includes(lowerQuery) ||
        location.includes(lowerQuery) ||
        rawText.includes(lowerQuery)
      );
    });
  } catch {
    return [];
  }
}
