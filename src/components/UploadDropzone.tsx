import { useCallback, useRef, useState } from "react";
import type { RawRow } from "../lib/types";
import { parseCsvFile, parseCsvString } from "../lib/csv";
import sampleCsv from "../../challenge_data-v1.csv?raw";

type Props = {
  onData: (rows: RawRow[], fileName: string) => void | Promise<void>;
  disabled?: boolean;
};

export default function UploadDropzone({ onData, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      try {
        const rows = await parseCsvFile(file);
        if (rows.length === 0) {
          setError("No rows found in that file.");
          return;
        }
        onData(rows, file.name);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to parse CSV.");
      }
    },
    [onData]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
      className={`rounded-2xl border-2 border-dashed p-10 text-center transition ${
        dragging
          ? "border-brand-500 bg-brand-500/10"
          : "border-white/15 bg-white/[0.02] hover:border-white/30"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-brand-500/15 text-brand-300">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
          <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-semibold text-white">Upload equipment CSV</h3>
      <p className="mt-1 text-sm text-slate-400">
        Drag &amp; drop a file with <code className="text-slate-300">manufacturer, model, serial number</code>, or
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Choose file
        </button>
        <button
          onClick={() => onData(parseCsvString(sampleCsv), "challenge_data-v1.csv")}
          disabled={disabled}
          className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Load sample dataset
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-rose-400">{error}</p>}
    </div>
  );
}
