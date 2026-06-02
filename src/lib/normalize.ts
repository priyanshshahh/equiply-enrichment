/**
 * Manufacturer + model normalization.
 *
 * The source file contains deliberate data-quality anomalies: the same vendor
 * appears under different casing/spacing (PHILIPS vs Philips, HILL ROM vs
 * Hillrom vs HILLROM). If these are not collapsed to one canonical string,
 * grouping, the device-type map, and the pie chart all distort.
 */

/** Uppercase + collapse all whitespace -> a stable lookup key. */
export function keyify(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

/**
 * Canonical display names for known manufacturers, keyed by keyify() output.
 * Several raw spellings intentionally collapse to a single canonical string.
 */
const MANUFACTURER_CANONICAL: Record<string, string> = {
  "HILL ROM": "Hillrom",
  HILLROM: "Hillrom",
  PHILIPS: "Philips",
  "GE HEALTHCARE": "GE Healthcare",
  "ZOLL MEDICAL": "ZOLL Medical",
  "EDAN INSTRUMENTS": "Edan Instruments",
  HOSPIRA: "Hospira",
  "BAXTER HEALTHCARE CORP.": "Baxter Healthcare Corp.",
  "WELCH ALLYN": "Welch Allyn",
  MINDRAY: "Mindray",
  STRYKER: "Stryker",
  "ARJO INC.": "Arjo Inc.",
  "JIANGMEN DACHENG MEDICAL EQUIPMENT CO.": "Jiangmen Dacheng Medical Equipment Co.",
  LINET: "LINET",
  "AMERICAN DIAGNOSTIC": "American Diagnostic",
  "THERMO SCIENTIFIC": "Thermo Scientific",
  OLYMPUS: "Olympus",
  EXERGEN: "Exergen",
  MASIMO: "Masimo",
  "COGENTIX MEDICAL": "Cogentix Medical",
  COVIDIEN: "Covidien",
  BIOSONIC: "BIOSONIC",
  "LAB CORP.": "Lab Corp.",
  UNICO: "Unico",
};

/** Title-case fallback for vendors not in the canonical map. */
function titleCaseFallback(raw: string): string {
  const cleaned = raw.trim().replace(/\s+/g, " ");
  return cleaned
    .split(" ")
    .map((w) =>
      w.length <= 3 && w === w.toUpperCase()
        ? w // keep short all-caps tokens (e.g. "GE")
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join(" ");
}

export function normalizeManufacturer(raw: string): string {
  const key = keyify(raw);
  return MANUFACTURER_CANONICAL[key] ?? titleCaseFallback(raw);
}

/**
 * Model normalization: collapse whitespace + uppercase. Models in this dataset
 * are short codes (P1440, INTELLIVUE MP50, R Series ALS) where casing is noisy,
 * so we key on the uppercased, whitespace-collapsed form.
 */
export function normalizeModel(raw: string): string {
  return keyify(raw);
}

/** Stable composite key for the device-type lookup. */
export function comboKey(manufacturer: string, model: string): string {
  return `${normalizeManufacturer(manufacturer)}|${normalizeModel(model)}`;
}
