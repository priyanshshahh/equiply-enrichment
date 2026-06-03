# Equiply — Capital Equipment Enrichment Dashboard

A fully client-side React + TypeScript tool that ingests a hospital equipment CSV
(`manufacturer, model, serial number`) and enriches it with a **manufactured date**
and **device type**, then translates that into a hospital capital-planning view
(asset age + replacement tier), with charts, a sorted register, and CSV export.

Hybrid pipeline: **deterministic serial decoders run first** (zero tokens), then an
optional **deduplicated OpenAI gap-fill** (`gpt-5.4-nano`) for rows rules cannot
resolve. Hospira/Baxter sequential serials are never sent for date guessing.

**Full product documentation:** [DOCUMENTATION.md](./DOCUMENTATION.md)

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
npm run dev        # http://localhost:5173 — paste API key or set VITE_OPENAI_API_KEY in .env
npm run build
npm run verify     # local regex coverage report (no API spend)
npm run export     # write enriched.csv via local rules only
```

### OpenAI hybrid gap-fill (hackathon)

1. Enable **LLM gap-fill** on the upload screen and paste your API key (or set `VITE_OPENAI_API_KEY` in a local `.env` — never commit it).
2. **Stage 1:** normalize manufacturers, static `device_type` map, per-vendor serial regex.
3. **Stage 2:** collect rows still missing `device_type` or decodable dates (excluding Hospira/Baxter `not_encoded`), **dedupe to unique `MFR|MODEL` keys**, one batched `gpt-5.4-nano` call.
4. **Stage 3:** merge with provenance (`date_source`, `device_type_source`), compute age + capital status.
5. Dashboard **Token Efficiency** KPI shows tokens used and **% saved via deduplication** vs sending every row.

Budget cap: **$5** estimated spend (nano pricing). Model choices: `gpt-5.4-nano` (default), `gpt-5.4-mini` (fallback in UI if needed).

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
