import type { DecodedDate, DateConfidence, DateSource } from "./types";
import { normalizeManufacturer } from "./normalize";

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Build a DecodedDate, deriving the ISO date string from year/month. */
function build(
  year: number | null,
  month: number | null,
  confidence: DateConfidence,
  source: DateSource,
  method: string
): DecodedDate {
  let date: string | null = null;
  if (year != null) {
    date = `${year}-${pad2(month ?? 1)}-01`;
  }
  return { date, year, month, confidence, source, method };
}

function none(method: string, source: DateSource = "unrecognized"): DecodedDate {
  return { date: null, year: null, month: null, confidence: "None", source, method };
}

/** Map an ISO week number to its (1-12) calendar month via the week's Monday. */
function isoWeekToMonth(year: number, week: number): number {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay();
  const monday = simple;
  if (dow <= 4) {
    monday.setUTCDate(simple.getUTCDate() - dow + 1);
  } else {
    monday.setUTCDate(simple.getUTCDate() + 8 - dow);
  }
  return monday.getUTCMonth() + 1;
}

/** Map a Julian day-of-year (1-366) to its calendar month. */
function julianToMonth(year: number, day: number): number {
  return new Date(Date.UTC(year, 0, day)).getUTCMonth() + 1;
}

// --- Per-manufacturer decoders ----------------------------------------------

/**
 * ZOLL Medical: [optional (NN) GS1][alpha prefix][YY][month letter A-L][seq].
 * The month letter A..L = Jan..Dec is consistent across all ZOLL families.
 * Falls back to year-only for older serials that omit the month letter.
 */
function decodeZoll(serial: string): DecodedDate {
  const s = serial.trim();
  const full = /^(?:\(\d+\)\s*)?\d*[A-Za-z]{1,3}(\d{2})([A-La-l])/.exec(s);
  if (full) {
    const year = 2000 + parseInt(full[1], 10);
    const month = full[2].toUpperCase().charCodeAt(0) - 64; // A=1..L=12
    return build(
      year,
      month,
      "High",
      "serial_rule",
      `ZOLL date code: "${full[1]}"=${year}, "${full[2].toUpperCase()}"=${MONTH_NAMES[month - 1]}`
    );
  }
  const yearOnly = /^(?:\(\d+\)\s*)?\d*[A-Za-z]{1,3}(\d{2})/.exec(s);
  if (yearOnly) {
    const year = 2000 + parseInt(yearOnly[1], 10);
    return build(year, null, "Medium", "serial_rule", `ZOLL serial year "${yearOnly[1]}"=${year}; no month letter present`);
  }
  return none("ZOLL serial did not match known date code");
}

/**
 * Mindray: [prefix]-[year digit][month char], where month is 1-9 or A/B/C for
 * Oct/Nov/Dec. Decade assumed 2020s for the BeneVision/EPM generation.
 */
function decodeMindray(serial: string): DecodedDate {
  const m = /-\s*([0-9])([0-9A-Ca-c])/.exec(serial.trim());
  if (!m) return none("Mindray serial did not match date code");
  const year = 2020 + parseInt(m[1], 10);
  const c = m[2].toUpperCase();
  let month: number | null = null;
  if (/[1-9]/.test(c)) month = parseInt(c, 10);
  else if (c === "A") month = 10;
  else if (c === "B") month = 11;
  else if (c === "C") month = 12;
  if (month == null) {
    return build(year, null, "Medium", "serial_rule", `Mindray year "${m[1]}"=${year}; month char "${c}" invalid`);
  }
  return build(
    year,
    month,
    "High",
    "serial_rule",
    `Mindray date code: "${m[1]}"=${year}, "${c}"=${MONTH_NAMES[month - 1]}`
  );
}

/**
 * Hillrom: two schemas.
 *  A) MM[letter]NNN YYYY  -> month leads, 4-digit year trails (high confidence)
 *  B) [year letter]JJJ[plant code AG/HE] -> Julian day + year letter. The
 *     year-letter key is not publicly reliable, so we surface the Julian day
 *     but cannot assert a confident year (low confidence, no date).
 */
function decodeHillrom(serial: string): DecodedDate {
  const s = serial.trim();
  const a = /^(\d{2})[A-Za-z]\d{3}(\d{4})$/.exec(s);
  if (a) {
    const month = parseInt(a[1], 10);
    const year = parseInt(a[2], 10);
    if (month >= 1 && month <= 12 && year >= 1980 && year <= 2035) {
      return build(
        year,
        month,
        "High",
        "serial_rule",
        `Hillrom format A: month "${a[1]}"=${MONTH_NAMES[month - 1]}, trailing year ${year}`
      );
    }
  }
  const b = /^([A-Za-z])(\d{3})([A-Za-z]{2})/.exec(s);
  if (b) {
    const letter = b[1].toUpperCase();
    const julian = parseInt(b[2], 10);
    // Documented Hill-Rom first-letter year code (E=2003, F=2004, G=2005,
    // H=2006), extended linearly (continuous A-Z; "I" is present in this data
    // so no letters are skipped). Anchored A=1999. Post-2006 is extrapolated,
    // hence Low confidence.
    const year = 1999 + (letter.charCodeAt(0) - 65);
    if (year >= 1995 && year <= 2030 && julian >= 1 && julian <= 366) {
      const month = julianToMonth(year, julian);
      return build(
        year,
        month,
        "Low",
        "serial_rule",
        `Hillrom format B (documented letter code, extrapolated): "${letter}"~${year}, Julian day ${julian} ~ ${MONTH_NAMES[month - 1]}`
      );
    }
    return none(
      `Hillrom format B detected (letter "${letter}", Julian ${julian}) but outside decodable range`,
      "serial_rule"
    );
  }
  return none("Hillrom serial did not match known schema");
}

/** Stryker: modern serials lead with the explicit 4-digit manufacture year. */
function decodeStryker(serial: string): DecodedDate {
  const m = /^((?:19|20)\d{2})\d{5,}/.exec(serial.trim());
  if (!m) return none("Stryker serial not in modern year-prefixed format");
  const year = parseInt(m[1], 10);
  return build(year, null, "High", "serial_rule", `Stryker leading 4 digits = manufacture year ${year}`);
}

/** Edan Instruments: year encoded as the two digits after the first "M". */
function decodeEdan(serial: string): DecodedDate {
  const m = /M(\d{2})/.exec(serial.trim());
  if (!m) return none("Edan serial has no M[YY] year block");
  const yy = parseInt(m[1], 10);
  // Plausible manufacture window for this fleet.
  if (yy < 5 || yy > 30) return none(`Edan M-block "${m[1]}" outside plausible year range`);
  const year = 2000 + yy;
  return build(year, null, "Medium", "serial_rule", `Edan M-block "M${m[1]}" = year ${year}; month not encoded`);
}

/** Philips: [country code][year digit][ISO week 2-digit]. Decade assumed 2000s. */
function decodePhilips(serial: string): DecodedDate {
  const m = /^[A-Za-z]{2}(\d)(\d{2})/.exec(serial.trim());
  if (!m) return none("Philips serial missing country-code/date-code prefix");
  const year = 2000 + parseInt(m[1], 10);
  const week = parseInt(m[2], 10);
  if (week < 1 || week > 53) {
    return build(year, null, "Medium", "serial_rule", `Philips year digit "${m[1]}"=${year}; week "${m[2]}" out of range`);
  }
  const month = isoWeekToMonth(year, week);
  return build(
    year,
    month,
    "Medium",
    "serial_rule",
    `Philips date code: year "${m[1]}"=${year}, week ${week} ~ ${MONTH_NAMES[month - 1]}`
  );
}

/**
 * Welch Allyn: primary "A"+2-digit-year format; secondary YYYYMM-prefixed
 * numeric serials (e.g. SPOT Vital Signs "201507871" -> Jul 2015).
 */
function decodeWelchAllyn(serial: string): DecodedDate {
  const s = serial.trim();
  const a = /^[Aa](\d{2})/.exec(s);
  if (a) {
    const year = 2000 + parseInt(a[1], 10);
    return build(year, null, "High", "serial_rule", `Welch Allyn "A${a[1]}" = year ${year}; month not encoded`);
  }
  const ym = /^((?:19|20)\d{2})(0[1-9]|1[0-2])\d+/.exec(s);
  if (ym) {
    const year = parseInt(ym[1], 10);
    const month = parseInt(ym[2], 10);
    return build(
      year,
      month,
      "High",
      "serial_rule",
      `Welch Allyn numeric serial YYYYMM prefix: ${year}-${ym[2]} (${MONTH_NAMES[month - 1]})`
    );
  }
  return none("Welch Allyn serial not in A[YY] or YYYYMM format");
}

/**
 * GE Healthcare: documented service-manual format
 *   [3-char product code][2-digit year][2-digit fiscal week][4-digit seq][site][misc]
 * (e.g. PDM "SA3"=code, APEX "RT9"/"RTS"=code). Year is explicit; month is
 * approximated from the fiscal week.
 */
function decodeGe(serial: string): DecodedDate {
  const s = serial.trim().toUpperCase();
  const m = /^[A-Z0-9]{3}(\d{2})(\d{2})\d{2,}/.exec(s);
  if (!m) return none("GE serial not in documented [code][YY][WW] layout");
  const year = 2000 + parseInt(m[1], 10);
  const week = parseInt(m[2], 10);
  if (year < 2000 || year > 2030) return none(`GE year "${m[1]}" outside plausible range`);
  if (week < 1 || week > 53) {
    return build(year, null, "Medium", "serial_rule", `GE documented format: year "${m[1]}"=${year}; fiscal week "${m[2]}" out of range`);
  }
  const month = isoWeekToMonth(year, week);
  return build(
    year,
    month,
    "High",
    "serial_rule",
    `GE documented format: year "${m[1]}"=${year}, fiscal week ${week} ~ ${MONTH_NAMES[month - 1]}`
  );
}

/** Hospira / Baxter: purely sequential serials with no embedded date. */
function notEncoded(vendor: string): DecodedDate {
  return none(`${vendor} serials are sequential identifiers and do not encode a manufacture date`, "not_encoded");
}

type Decoder = (serial: string) => DecodedDate;

const DECODERS: Record<string, Decoder> = {
  "ZOLL Medical": decodeZoll,
  Mindray: decodeMindray,
  Hillrom: decodeHillrom,
  Stryker: decodeStryker,
  "Edan Instruments": decodeEdan,
  Philips: decodePhilips,
  "Welch Allyn": decodeWelchAllyn,
  "GE Healthcare": decodeGe,
  Hospira: () => notEncoded("Hospira"),
  "Baxter Healthcare Corp.": () => notEncoded("Baxter"),
};

/** Dispatch to the correct decoder based on the canonical manufacturer. */
export function decodeDate(manufacturer: string, serial: string): DecodedDate {
  const canonical = normalizeManufacturer(manufacturer);
  const decoder = DECODERS[canonical];
  if (!decoder) return none(`No date decoder defined for "${canonical}"`);
  return decoder(serial);
}

export function formatManufacturedDate(d: DecodedDate): string {
  if (d.year == null) return "—";
  if (d.month == null) return String(d.year);
  return `${MONTH_NAMES[d.month - 1]} ${d.year}`;
}
