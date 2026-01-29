type CsvCell = string | number | boolean | null | undefined;

function escapeCsvCell(value: CsvCell) {
  const s = value === null || value === undefined ? "" : String(value);
  // Wrap in quotes if it contains special chars; escape quotes by doubling.
  if (/[\n\r",]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(rows: Record<string, unknown>[]) {
  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((k) => set.add(k));
      return set;
    }, new Set<string>()),
  );

  const lines: string[] = [];
  lines.push(headers.map(escapeCsvCell).join(","));
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvCell(row[h] as CsvCell)).join(","));
  }
  return lines.join("\n");
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const csv = rowsToCsv(rows);
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
