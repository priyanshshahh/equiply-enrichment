# Equiply — Capital Equipment Enrichment Dashboard

A fully client-side React + TypeScript tool that ingests a hospital equipment CSV
(`manufacturer, model, serial number`) and enriches it with a **manufactured date**
and **device type**, then translates that into a hospital capital-planning view
(asset age + replacement tier), with charts, a sorted register, and CSV export.

Everything runs in the browser. No backend, no network calls, no LLM at runtime —
so it is instant, offline, reproducible, and fully auditable.

## Demo video

**[Watch the demo video](https://youtu.be/YOUR_VIDEO_ID)** — walkthrough of upload, enrichment pipeline, charts, and export.

> Replace the link above with your recorded demo (YouTube, Loom, or Google Drive with public access) before submitting.

## Submission artifacts

| Artifact | Location |
|---|---|
| Enriched output CSV | [`enriched.csv`](./enriched.csv) |
| Source code | [`src/`](./src/) (React app + deterministic data engine) |
| Input dataset | [`challenge_data-v1.csv`](./challenge_data-v1.csv) |
| Verification script | [`scripts/verify.ts`](./scripts/verify.ts) |

Regenerate `enriched.csv` anytime:

```bash
npm run export
```

## Run

```bash
npm install
npm run dev        # http://localhost:5173  (click "Load sample dataset")
npm run build      # type-check + production build
npm run verify     # run the data engine over challenge_data-v1.csv and print coverage
```

## How enrichment works (the part that matters)

The 800 records reduce to **53 canonical manufacturer|model combinations**, so each
is classified once rather than guessed per row.

1. **Normalization** (`src/lib/normalize.ts`) — collapses deliberate data anomalies
   (`PHILIPS`/`Philips`, `HILL ROM`/`Hillrom`/`HILLROM`) to one canonical string.
   Note: `P3200` and `CENTURYP1400` appear under *both* Hillrom spellings and are merged.

2. **`device_type`** (`src/lib/deviceTypes.ts`) — a curated static map keyed by
   `manufacturer|model`. Unmapped combos fall back to `Unknown` (never invented).

3. **`manufactured_date`** (`src/lib/dateDecoders.ts`) — deterministic, per-manufacturer
   serial decoders, each returning a date plus a **confidence** and a **provenance note**:

   | Manufacturer | Rule | Confidence |
   |---|---|---|
   | ZOLL | `[prefix][YY][month letter A–L]` (e.g. `X18E…` → May 2018) | High |
   | Mindray | `-[year][month 1–9/A–C]` (e.g. `-3A` → Oct 2023) | High |
   | Hillrom A | `MM[x]NNN YYYY` (e.g. `12M1281998` → Dec 1998) | High |
   | Stryker | leading 4-digit year (`2021…` → 2021) | High |
   | Welch Allyn | `A[YY]` or `YYYYMM` prefix | High |
   | Edan | `M[YY]` year (`M19…` → 2019) | Medium (no month) |
   | Philips | `[country][year][ISO week]` | Medium (week→month) |
   | GE | documented service-manual layout `[code][YY][fiscal week]` (`SA308…` → 2008 wk51) | High |
   | Hillrom B | documented first-letter year code (E=2003…H=2006) extended + Julian day | Low (extrapolated) |
   | Hospira / Baxter | sequential — **not date-encoded** → `null` | n/a |

   The GE and Hillrom Format B rules were derived from primary sources (GE's
   Dash/PDM service manuals; Hill-Rom's documented letter year code). The
   Hillrom letter scheme is documented only for 2003-2006, so later years are a
   linear extrapolation and are flagged **Low** confidence rather than asserted.
   Truly undecodable serials (Hospira/Baxter sequential, a few edge cases) stay
   `null` with a reason — more honest and defensible than fabricating a date.

   Result on the sample file: **~73% of rows carry a decoded date**, each with a
   confidence level and a provenance note (`date_source` + `date_method`).

4. **Derived capital fields** (`src/lib/dataEngine.ts`) —
   `equipment_age_years = 2026 − year`, and `capital_status`:
   `>10 yrs` → End of Life (red), `7–10` → Review (amber), else Active (green),
   unknown date → Unknown.

## Output

- KPI cards (total assets, immediate replacements, review window, pipeline confidence)
- Device-type distribution pie chart
- Capital replacement timeline (stacked bar by manufacture year)
- Enriched register sorted ascending by manufactured date, with status badges and
  per-row confidence indicators (hover to see how each date was derived)
- One-click enriched CSV export (includes `date_source` + `date_method` provenance)
