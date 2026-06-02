import { ALLOWED_MODELS, DEFAULT_MODEL, FALLBACK_MODEL, MAX_BUDGET_USD, type AllowedModel } from "../lib/openaiFallback";

type Props = {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  model: AllowedModel;
  onModelChange: (model: AllowedModel) => void;
  enableLlm: boolean;
  onEnableLlmChange: (v: boolean) => void;
  estimatedCostUsd?: number;
};

export default function OpenAiSettings({
  apiKey,
  onApiKeyChange,
  model,
  onModelChange,
  enableLlm,
  onEnableLlmChange,
  estimatedCostUsd = 0,
}: Props) {
  const budgetRemaining = Math.max(0, MAX_BUDGET_USD - estimatedCostUsd);

  return (
    <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Hybrid enrichment (optional)</h3>
          <p className="mt-1 max-w-xl text-xs text-slate-400">
            Stage 1 runs local regex + static maps (zero tokens). Stage 2 sends only{" "}
            <strong className="text-slate-300">deduplicated manufacturer|model keys</strong> to{" "}
            <code className="text-brand-300">gpt-5.4-nano</code> for gap-fill. Hospira/Baxter
            sequential serials are never sent for date guessing.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={enableLlm}
            onChange={(e) => onEnableLlmChange(e.target.checked)}
            className="rounded border-white/20 bg-transparent"
          />
          Enable LLM gap-fill
        </label>
      </div>

      {enableLlm && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              OpenAI API key
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="sk-..."
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 font-mono text-sm text-slate-200 placeholder:text-slate-600 focus:border-brand-500 focus:outline-none"
            />
            <p className="mt-1 text-xs text-slate-600">
              Put your key in <code className="text-slate-400">.env</code> as{" "}
              <code className="text-slate-400">VITE_OPENAI_API_KEY=sk-...</code> (no space after
              =) or paste here. Never commit <code className="text-slate-400">.env</code>. Budget
              cap: ${MAX_BUDGET_USD.toFixed(2)} (~${budgetRemaining.toFixed(4)} remaining).
            </p>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Model
            </label>
            <select
              value={model}
              onChange={(e) => onModelChange(e.target.value as AllowedModel)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-slate-200 focus:border-brand-500 focus:outline-none"
            >
              {ALLOWED_MODELS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <p className="text-xs text-slate-500">
              Default: <span className="text-brand-300">{DEFAULT_MODEL}</span> (auto-fallback to{" "}
              {FALLBACK_MODEL} only if JSON parse fails). Allowed: {ALLOWED_MODELS.join(", ")}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
