import { useMemo, useState } from "react";
import type { EnrichedRow, RawRow } from "./lib/types";
import {
  computeKpis,
  deviceTypeDistribution,
  enrichDataset,
  replacementTimeline,
} from "./lib/dataEngine";
import UploadDropzone from "./components/UploadDropzone";
import KpiCards from "./components/KpiCards";
import DeviceTypePie from "./components/DeviceTypePie";
import ReplacementTimelineBar from "./components/ReplacementTimelineBar";
import EnrichedTable from "./components/EnrichedTable";
import ExportButton from "./components/ExportButton";

export default function App() {
  const [rows, setRows] = useState<EnrichedRow[] | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const handleData = (raw: RawRow[], name: string) => {
    setRows(enrichDataset(raw));
    setFileName(name);
  };

  const kpis = useMemo(() => (rows ? computeKpis(rows) : null), [rows]);
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
            <ExportButton rows={rows} />
            <button
              onClick={() => setRows(null)}
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
                Deterministic enrichment - manufactured date, device type, asset age, and
                replacement tier - computed entirely in your browser. No data leaves this page.
              </p>
            </div>
            <UploadDropzone onData={handleData} />
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
              Every date carries a provenance trail (source + confidence). Hover a confidence
              indicator to see exactly how the date was derived.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
