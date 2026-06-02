import OpenAI from "openai";
import { comboKey } from "./normalize";
import { assertAllowedModel, resolveModel } from "./env";
import type { EnrichedRow, RawRow } from "./types";

/** Hackathon-allowed models only. */
export const ALLOWED_MODELS = [
  "gpt-5.4-nano",
  "gpt-5.4-nano-2026-03-17",
  "gpt-5.4-mini",
  "gpt-5.4-mini-2026-03-17",
] as const;

export type AllowedModel = (typeof ALLOWED_MODELS)[number];

/** Cheapest allowed model — default for all gap-fill calls. */
export const DEFAULT_MODEL: AllowedModel = "gpt-5.4-nano";

export const FALLBACK_MODEL: AllowedModel = "gpt-5.4-mini";

export const MAX_BUDGET_USD = 5;

const INPUT_USD_PER_1M = 0.1;
const OUTPUT_USD_PER_1M = 0.4;

export type LLMComboResult = {
  device_type: string;
  launch_year: number | null;
};

export type LLMGapFillResult = {
  map: Record<string, LLMComboResult>;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  estimatedCostUsd: number;
  uniqueCombosSent: number;
  rowsEligible: number;
  rowsWithoutDedupe: number;
  dedupeSavedPct: number;
  model: string;
};

export type GapFillInput = Pick<
  EnrichedRow,
  "manufacturer" | "model" | "serial_number" | "device_type" | "date_source" | "manufactured_date"
>;

/** Minified system prompt — no prose, saves input tokens. */
const SYSTEM_PROMPT =
  'Clinical device mapper. Input: JSON array of unique "MFR|MODEL" keys. Output: JSON object keyed by same strings, values {"device_type":"...","launch_year":number|null}. No markdown. No explanation.';

function estimateCostUsd(prompt: number, completion: number): number {
  return (prompt / 1_000_000) * INPUT_USD_PER_1M + (completion / 1_000_000) * OUTPUT_USD_PER_1M;
}

export function rowsNeedingGapFill(enriched: EnrichedRow[]): EnrichedRow[] {
  return enriched.filter((r) => {
    const needsDevice = r.device_type === "Unknown";
    const needsDate =
      r.manufactured_date == null &&
      r.date_source !== "not_encoded" &&
      r.date_source !== "openai";
    return needsDevice || needsDate;
  });
}

/** Deduplicate gap rows to unique manufacturer|model keys (the token-saving step). */
export function uniqueGapComboKeys(gapRows: GapFillInput[]): string[] {
  const keys = new Set<string>();
  for (const r of gapRows) keys.add(comboKey(r.manufacturer, r.model));
  return [...keys];
}

function createClient(apiKey: string): OpenAI {
  const baseURL =
    typeof window !== "undefined" && import.meta.env.DEV
      ? `${window.location.origin}/openai-api/v1`
      : undefined;

  return new OpenAI({
    apiKey: apiKey.trim(),
    dangerouslyAllowBrowser: true,
    baseURL,
  });
}

function parseLLMMap(raw: string, expectedKeys: string[]): Record<string, LLMComboResult> {
  let root: unknown;
  try {
    root = JSON.parse(raw);
  } catch {
    throw new Error("LLM returned invalid JSON.");
  }

  const obj = root as Record<string, unknown>;
  const candidate =
    obj && typeof obj === "object" && !Array.isArray(obj)
      ? (obj.mappings ?? obj.data ?? obj.results ?? obj.items ?? obj)
      : obj;

  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    throw new Error("LLM JSON missing mapping object.");
  }

  const record = candidate as Record<string, unknown>;
  const map: Record<string, LLMComboResult> = {};

  for (const key of expectedKeys) {
    const hit = record[key];
    if (!hit || typeof hit !== "object") continue;
    const row = hit as Record<string, unknown>;
    if (typeof row.device_type !== "string") continue;
    map[key] = {
      device_type: row.device_type,
      launch_year:
        row.launch_year != null && !Number.isNaN(Number(row.launch_year))
          ? Number(row.launch_year)
          : null,
    };
  }

  return map;
}

async function callGapFill(
  client: OpenAI,
  model: AllowedModel,
  uniqueKeys: string[]
): Promise<{ map: Record<string, LLMComboResult>; usage: LLMGapFillResult["usage"] }> {
  assertAllowedModel(model);

  const response = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: JSON.stringify(uniqueKeys) },
    ],
    temperature: 0,
    max_completion_tokens: Math.min(2048, 48 * uniqueKeys.length + 64),
  });

  const usage = {
    prompt_tokens: response.usage?.prompt_tokens ?? 0,
    completion_tokens: response.usage?.completion_tokens ?? 0,
    total_tokens: response.usage?.total_tokens ?? 0,
  };

  const raw = response.choices[0]?.message?.content ?? "{}";
  const map = parseLLMMap(raw, uniqueKeys);
  if (Object.keys(map).length === 0) {
    throw new Error("LLM returned no usable mappings.");
  }

  return { map, usage };
}

/**
 * One batched call for all unique MFR|MODEL keys (deduped from gap rows).
 * Uses gpt-5.4-nano first; retries once with gpt-5.4-mini only if nano JSON fails.
 */
export async function runLLMGapFill(
  apiKey: string,
  gapRows: GapFillInput[],
  model?: AllowedModel,
  spentSoFarUsd = 0
): Promise<LLMGapFillResult> {
  const primary = resolveModel(model);
  const rowsEligible = gapRows.length;
  const uniqueKeys = uniqueGapComboKeys(gapRows);

  if (uniqueKeys.length === 0) {
    return {
      map: {},
      usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
      estimatedCostUsd: 0,
      uniqueCombosSent: 0,
      rowsEligible: 0,
      rowsWithoutDedupe: 0,
      dedupeSavedPct: 100,
      model: primary,
    };
  }

  const rowsWithoutDedupe = rowsEligible;
  const dedupeSavedPct =
    rowsWithoutDedupe > 0
      ? ((rowsWithoutDedupe - uniqueKeys.length) / rowsWithoutDedupe) * 100
      : 100;

  const client = createClient(apiKey);
  let usedModel: AllowedModel = primary;
  let map: Record<string, LLMComboResult> = {};
  let usage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };

  try {
    const first = await callGapFill(client, primary, uniqueKeys);
    map = first.map;
    usage = first.usage;
    usedModel = primary;
  } catch {
    if (primary === FALLBACK_MODEL) throw new Error("LLM gap-fill failed.");
    const second = await callGapFill(client, FALLBACK_MODEL, uniqueKeys);
    map = second.map;
    usage = {
      prompt_tokens: usage.prompt_tokens + second.usage.prompt_tokens,
      completion_tokens: usage.completion_tokens + second.usage.completion_tokens,
      total_tokens: usage.total_tokens + second.usage.total_tokens,
    };
    usedModel = FALLBACK_MODEL;
  }

  const estimatedCostUsd = estimateCostUsd(usage.prompt_tokens, usage.completion_tokens);
  if (spentSoFarUsd + estimatedCostUsd > MAX_BUDGET_USD) {
    throw new Error(
      `Estimated spend $${(spentSoFarUsd + estimatedCostUsd).toFixed(4)} exceeds $${MAX_BUDGET_USD} budget cap.`
    );
  }

  return {
    map,
    usage,
    estimatedCostUsd,
    uniqueCombosSent: uniqueKeys.length,
    rowsEligible,
    rowsWithoutDedupe,
    dedupeSavedPct: Math.max(0, Math.min(100, dedupeSavedPct)),
    model: usedModel,
  };
}

export function collectGapRowsFromRaw(_raw: RawRow[], enriched: EnrichedRow[]): EnrichedRow[] {
  return rowsNeedingGapFill(enriched);
}
