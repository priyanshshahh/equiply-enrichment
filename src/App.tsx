import { useMemo, useState } from "react";
import type { EnrichedRow, RawRow } from "./lib/types";
import {
  computeKpis,
  deviceTypeDistribution,
  enrichDatasetHybrid,
  replacementTimeline,
  type TokenStats,
} from "./lib/dataEngine";
import { DEFAULT_MODEL, type AllowedModel } from "./lib/openaiFallback";
import UploadDropzone from "./components/UploadDropzone";
import OpenAiSettings from "./components/OpenAiSettings";
import KpiCards from "./components/KpiCards";
import DeviceTypePie from "./components/DeviceTypePie";
import ReplacementTimelineBar from "./components/ReplacementTimelineBar";
import EnrichedTable from "./components/EnrichedTable";
import ExportButton from "./components/ExportButton";
import { getOpenAiKeyFromEnv } from "./lib/env";

export default function App() {
  const [rows, setRows] = useState<EnrichedRow[] | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(getOpenAiKeyFromEnv);
  const [model, setModel] = useState<AllowedModel>(DEFAULT_MODEL);
  const [enableLlm, setEnableLlm] = useState(() => Boolean(getOpenAiKeyFromEnv()));
  const [tokenStats, setTokenStats] = useState<TokenStats | null>(null);

  const handleData = async (raw: RawRow[], name: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await enrichDatasetHybrid(raw, {
        apiKey: enableLlm ? apiKey.trim() : undefined,
        model,
        skipLLM: !enableLlm || !apiKey.trim(),
      });
      setRows(result.rows);
      setTokenStats(result.tokenStats);
      setFileName(name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enrichment failed.");
    } finally {
      setLoading(false);
    }
  };

  const kpis = useMemo(
    () => (rows ? computeKpis(rows, tokenStats ?? undefined) : null),
    [rows, tokenStats]
  );
  const pie = useMemo(() => (rows ? deviceTypeDistribution(rows) : []), [rows]);
  const timeline = useMemo(() => (rows ? replacementTimeline(rows) : []), [rows]);

  return (
    <div className="mx-auto min-h-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 font-bold text-white shadow-lg shadow-brand-600/30">
            Eq
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Equiply</h1>
            <p className="text-xs text-slate-400">Capital Equipment Enrichment</p>
          </div>
        </div>
        {rows && (
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-500 sm:inline">{fileName}</span>
    <ExportButton rows={rows} filename="enriched.csv" />
            <button
              onClick={() => {
                setRows(null);
                setTokenStats(null);
                setError(null);
              }}
              className="rounded-lg border border-white/15 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
            >
              New file
            </button>
          </div>
        )}
      </header>

      <main className="mt-8 space-y-6">
        {!rows || !kpis ? (
          <div className="mx-auto max-w-2xl pt-6">
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold text-white">
                Turn raw equipment serials into a capital plan
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Hybrid pipeline: deterministic serial decoders first, then deduplicated LLM
                gap-fill only where rules leave gaps — never guessing Hospira/Baxter dates.
              </p>
            </div>
            <OpenAiSettings
              apiKey={apiKey}
              onApiKeyChange={setApiKey}
              model={model}
              onModelChange={setModel}
              enableLlm={enableLlm}
              onEnableLlmChange={setEnableLlm}
            />
            <UploadDropzone onData={handleData} disabled={loading} />
            {loading && (
              <p className="mt-4 text-center text-sm text-brand-300">Enriching dataset…</p>
            )}
            {error && <p className="mt-4 text-center text-sm text-rose-400">{error}</p>}
          </div>
        ) : (
          <>
            <KpiCards kpis={kpis} />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <DeviceTypePie data={pie} />
              <ReplacementTimelineBar data={timeline} />
            </div>
            <EnrichedTable rows={rows} />
            <p className="pb-6 text-center text-xs text-slate-600">
              Provenance: hover confidence for decode method. LLM assists only deduplicated
              manufacturer|model gaps; serial rules always win when present.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
