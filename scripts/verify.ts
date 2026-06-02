/**
 * Offline verification harness. Runs the full data engine over the challenge
 * CSV and reports per-manufacturer date-decode coverage, confidence mix,
 * unknown device types, and the device-type distribution.
 *
 *   npm run verify
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import Papa from "papaparse";
import { enrichDataset, deviceTypeDistribution, computeKpis } from "../src/lib/dataEngine";
import { decodeDate } from "../src/lib/dateDecoders";
import type { RawRow } from "../src/lib/types";

const here = dirname(fileURLToPath(import.meta.url));
const csvPath = resolve(here, "../challenge_data-v1.csv");
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

console.log(`\nParsed ${raw.length} rows -> ${enriched.length} enriched.\n`);

// Per-manufacturer coverage
type Stat = { total: number; dated: number; high: number; medium: number; none: number };
const byMfr = new Map<string, Stat>();
for (const r of enriched) {
  const m = r.manufacturer;
  if (!byMfr.has(m)) byMfr.set(m, { total: 0, dated: 0, high: 0, medium: 0, none: 0 });
  const s = byMfr.get(m)!;
  s.total++;
  if (r.manufactured_date) s.dated++;
  if (r.date_confidence === "High") s.high++;
  else if (r.date_confidence === "Medium") s.medium++;
  else if (r.date_confidence === "None") s.none++;
}

console.log("=== Per-manufacturer date coverage ===");
console.log("manufacturer".padEnd(38), "total".padStart(6), "dated".padStart(6), "high".padStart(5), "med".padStart(5), "none".padStart(5));
[...byMfr.entries()]
  .sort((a, b) => b[1].total - a[1].total)
  .forEach(([m, s]) => {
    console.log(
      m.padEnd(38),
      String(s.total).padStart(6),
      String(s.dated).padStart(6),
      String(s.high).padStart(5),
      String(s.medium).padStart(5),
      String(s.none).padStart(5)
    );
  });

// Unknown device types
const unknownCombos = new Set<string>();
for (const r of enriched) {
  if (r.device_type === "Unknown") unknownCombos.add(`${r.manufacturer} | ${r.model}`);
}
console.log("\n=== Unknown device-type combos ===");
console.log(unknownCombos.size === 0 ? "(none — all combos mapped)" : [...unknownCombos].join("\n"));

// Device-type distribution
console.log("\n=== Device-type distribution ===");
for (const s of deviceTypeDistribution(enriched)) {
  console.log(s.name.padEnd(28), String(s.value).padStart(4), `${s.pct.toFixed(1)}%`);
}

// KPIs
const k = computeKpis(enriched);
console.log("\n=== KPIs ===");
console.log(JSON.stringify(k, null, 2));

// Spot-check the documented examples
console.log("\n=== Spot checks ===");
const checks: Array<[string, string, string]> = [
  ["ZOLL Medical", "X18E025923", "May 2018"],
  ["ZOLL Medical", "AI10L000796", "Dec 2010"],
  ["Mindray", "AH9-3A001716", "Oct 2023"],
  ["Hillrom", "12M1281998", "Dec 1998"],
  ["Stryker", "2021005801196", "2021"],
  ["Edan Instruments", "M19413130058", "2019"],
  ["Welch Allyn", "A1051223", "2010"],
  ["GE Healthcare", "SA308511468GR", "2008 wk51"],
  ["GE Healthcare", "RTS14104450GA", "2014 wk10"],
  ["Hillrom", "B332AG6677", "2000 (letter B)"],
  ["Hospira", "17431765", "not encoded"],
];
for (const [mfr, serial, expect] of checks) {
  const d = decodeDate(mfr, serial);
  console.log(
    `${mfr} ${serial} -> ${d.date ?? "null"} [${d.confidence}/${d.source}] (expect ${expect})`
  );
}
