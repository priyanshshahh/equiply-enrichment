import type { EnrichedRow } from "../lib/types";
import { downloadCsv, enrichedToCsv } from "../lib/csv";

export default function ExportButton({
  rows,
  filename = "enriched.csv",
}: {
  rows: EnrichedRow[];
  filename?: string;
}) {
  return (
    <button
      onClick={() => downloadCsv(filename, enrichedToCsv(rows))}
      disabled={rows.length === 0}
      className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 4v12M12 16l-4-4M12 16l4-4" />
        <path d="M4 20h16" />
      </svg>
      Export enriched CSV
    </button>
  );
}
