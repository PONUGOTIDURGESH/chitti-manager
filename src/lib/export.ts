function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(headers.map((h) => escape(r[h])).join(','));
  return lines.join('\n');
}

export function exportCSV(rows: Record<string, unknown>[], filename: string) {
  download(filename, toCSV(rows), 'text/csv;charset=utf-8');
}

export function exportCSVTyped<T extends object>(rows: T[], filename: string) {
  download(filename, toCSV(rows as Record<string, unknown>[]), 'text/csv;charset=utf-8');
}

export function exportJSON(data: unknown, filename: string) {
  download(filename, JSON.stringify(data, null, 2), 'application/json');
}
