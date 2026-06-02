/**
 * Generate enriched.csv from challenge_data-v1.csv using the data engine.
 *
 *   npm run export
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import Papa from "papaparse";
import { enrichDataset } from "../src/lib/dataEngine";
import { enrichedToCsv } from "../src/lib/csv";
import type { RawRow } from "../src/lib/types";

const here = dirname(fileURLToPath(import.meta.url));
const csvPath = resolve(here, "../challenge_data-v1.csv");
const outPath = resolve(here, "../enriched.csv");

const csv = readFileSync(csvPath, "utf8");
const parsed = Papa.parse<Record<string, string>>(csv, {
  header: true,
  skipEmptyLines: true,
  transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
});

const raw: RawRow[] = parsed.data.map((r) => ({
  manufacturer: r["manufacturer"] ?? "",
  model: r["model"] ?? "",
  serial_number: r["serial_number"] ?? r["serial number"] ?? "",
}));

const enriched = enrichDataset(raw);
const output = enrichedToCsv(enriched);
writeFileSync(outPath, output, "utf8");

console.log(`Wrote ${enriched.length} rows to ${outPath}`);
