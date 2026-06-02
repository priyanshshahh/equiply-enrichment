import Papa from "papaparse";
import type { EnrichedRow, RawRow } from "./types";

/** Parse an uploaded CSV file into RawRow[], tolerating header variations. */
export function parseCsvFile(file: File): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
      complete: (results) => {
        const rows: RawRow[] = results.data.map((r) => ({
          manufacturer: r["manufacturer"] ?? "",
          model: r["model"] ?? "",
          serial_number: r["serial_number"] ?? r["serial"] ?? "",
        }));
        resolve(rows);
      },
      error: (err) => reject(err),
    });
  });
}

/** Parse an in-memory CSV string (used by the bundled sample dataset). */
export function parseCsvString(csv: string): RawRow[] {
  const results = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
  });
  return results.data.map((r) => ({
    manufacturer: r["manufacturer"] ?? "",
    model: r["model"] ?? "",
    serial_number: r["serial_number"] ?? r["serial"] ?? "",
  }));
}

/** Serialize enriched rows to a CSV string for download. */
export function enrichedToCsv(rows: EnrichedRow[]): string {
  const records = rows.map((r) => ({
    manufacturer: r.manufacturer,
    model: r.model,
    serial_number: r.serial_number,
    manufactured_date: r.manufactured_date ?? "",
    device_type: r.device_type,
    equipment_age_years: r.equipment_age_years ?? "",
    capital_status: r.capital_status,
    date_confidence: r.date_confidence,
    date_source: r.date_source,
    date_method: r.date_method,
  }));
  return Papa.unparse(records);
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
