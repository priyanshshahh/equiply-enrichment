import type { CapitalStatus, EnrichedRow, RawRow } from "./types";
import { normalizeManufacturer, normalizeModel } from "./normalize";
import { lookupDeviceType } from "./deviceTypes";
import { decodeDate, formatManufacturedDate } from "./dateDecoders";

/**
 * Fixed reference year so age/status output is reproducible regardless of when
 * the demo is run (judges re-running the file get identical numbers).
 */
export const CURRENT_YEAR = 2026;

/** Hospital capital-replacement thresholds (years of service). */
export const EOL_THRESHOLD = 10;
export const REVIEW_THRESHOLD = 7;

function capitalStatus(age: number | null): CapitalStatus {
  if (age == null) return "Unknown";
  if (age > EOL_THRESHOLD) return "End of Life (Replace)";
  if (age >= REVIEW_THRESHOLD) return "Review";
  return "Active";
}

export function enrichRow(raw: RawRow): EnrichedRow {
  const manufacturer = normalizeManufacturer(raw.manufacturer);
  const model = normalizeModel(raw.model);
  const serial = (raw.serial_number ?? "").trim();

  const device_type = lookupDeviceType(raw.manufacturer, raw.model);
  const decoded = decodeDate(raw.manufacturer, serial);

  const equipment_age_years = decoded.year != null ? CURRENT_YEAR - decoded.year : null;

  return {
    manufacturer,
    model,
    serial_number: serial,
    manufactured_date: decoded.date,
    manufactured_display: formatManufacturedDate(decoded),
    device_type,
    equipment_age_years,
    capital_status: capitalStatus(equipment_age_years),
    date_confidence: decoded.confidence,
    date_source: decoded.source,
    date_method: decoded.method,
  };
}

/** Sort key: known dates ascending first; unknown dates sink to the bottom. */
function sortValue(row: EnrichedRow): number {
  if (!row.manufactured_date) return Number.POSITIVE_INFINITY;
  return new Date(row.manufactured_date).getTime();
}

export function enrichDataset(rows: RawRow[]): EnrichedRow[] {
  return rows
    .filter((r) => (r.manufacturer ?? "").trim() || (r.model ?? "").trim() || (r.serial_number ?? "").trim())
    .map(enrichRow)
    .sort((a, b) => sortValue(a) - sortValue(b));
}

// --- Aggregations for the dashboard -----------------------------------------

export type DeviceTypeSlice = { name: string; value: number; pct: number };

export function deviceTypeDistribution(rows: EnrichedRow[]): DeviceTypeSlice[] {
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.device_type, (counts.get(r.device_type) ?? 0) + 1);
  const total = rows.length || 1;
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value, pct: (value / total) * 100 }))
    .sort((a, b) => b.value - a.value);
}

export type TimelineBucket = {
  year: string;
  Active: number;
  Review: number;
  "End of Life (Replace)": number;
};

export function replacementTimeline(rows: EnrichedRow[]): TimelineBucket[] {
  const byYear = new Map<number, TimelineBucket>();
  for (const r of rows) {
    if (r.manufactured_date == null) continue;
    const year = new Date(r.manufactured_date).getUTCFullYear();
    if (!byYear.has(year)) {
      byYear.set(year, {
        year: String(year),
        Active: 0,
        Review: 0,
        "End of Life (Replace)": 0,
      });
    }
    const bucket = byYear.get(year)!;
    if (r.capital_status === "Active") bucket.Active += 1;
    else if (r.capital_status === "Review") bucket.Review += 1;
    else if (r.capital_status === "End of Life (Replace)") bucket["End of Life (Replace)"] += 1;
  }
  return [...byYear.values()].sort((a, b) => Number(a.year) - Number(b.year));
}

export type Kpis = {
  totalAssets: number;
  needsReplacement: number;
  reviewSoon: number;
  confidenceRate: number;
  datedRate: number;
  deviceTypeCount: number;
};

export function computeKpis(rows: EnrichedRow[]): Kpis {
  const total = rows.length;
  const needsReplacement = rows.filter((r) => r.capital_status === "End of Life (Replace)").length;
  const reviewSoon = rows.filter((r) => r.capital_status === "Review").length;
  const withConfidence = rows.filter((r) => r.date_confidence !== "None").length;
  const dated = rows.filter((r) => r.manufactured_date != null).length;
  const types = new Set(rows.map((r) => r.device_type));
  return {
    totalAssets: total,
    needsReplacement,
    reviewSoon,
    confidenceRate: total ? (withConfidence / total) * 100 : 0,
    datedRate: total ? (dated / total) * 100 : 0,
    deviceTypeCount: types.size,
  };
}
