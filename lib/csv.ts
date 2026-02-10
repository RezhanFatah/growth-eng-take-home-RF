/**
 * Parse CSV text handling quoted fields and newlines inside quotes.
 * Returns array of row objects (first row = headers).
 */
export function parseCsv(csvText: string): Record<string, string>[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < csvText.length; i++) {
    const c = csvText[i];
    if (c === '"') {
      inQuotes = !inQuotes;
      current += c;
    } else if (c === "\n" || c === "\r") {
      if (inQuotes) current += c;
      else {
        if (current.trim()) lines.push(current);
        current = "";
        if (c === "\r" && csvText[i + 1] === "\n") i++;
      }
    } else {
      current += c;
    }
  }
  if (current.trim()) lines.push(current);

  const parseRow = (row: string): string[] => {
    const out: string[] = [];
    let cell = "";
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if ((c === "," && !inQuotes) || (c === "\n" && !inQuotes)) {
        out.push(cell.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
        cell = "";
      } else {
        cell += c;
      }
    }
    out.push(cell.trim().replace(/^"|"$/g, "").replace(/""/g, '"'));
    return out;
  };

  if (lines.length === 0) return [];
  const headers = parseRow(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, j) => {
      obj[h] = values[j] ?? "";
    });
    rows.push(obj);
  }
  return rows;
}

/** Normalize for search: lowercase, trim, collapse spaces */
export function normalizeSearch(s: string): string {
  return (s ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** Extract domain from URL string */
export function domainFromUrl(url: string): string {
  if (!url) return "";
  try {
    const u = url.startsWith("http") ? url : `https://${url}`;
    const host = new URL(u).hostname;
    return host.replace(/^www\./, "");
  } catch {
    return url.replace(/^www\./, "").split("/")[0] || "";
  }
}
