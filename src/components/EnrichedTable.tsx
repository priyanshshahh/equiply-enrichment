import { useMemo, useState } from "react";
import type { CapitalStatus, EnrichedRow } from "../lib/types";
import { CONFIDENCE_STYLES, STATUS_STYLES } from "../lib/ui";

type Props = { rows: EnrichedRow[] };

const STATUS_FILTERS: Array<CapitalStatus | "All"> = [
  "All",
  "End of Life (Replace)",
  "Review",
  "Active",
  "Unknown",
];

export default function EnrichedTable({ rows }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<CapitalStatus | "All">("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "All" && r.capital_status !== status) return false;
      if (!q) return true;
      return (
        r.manufacturer.toLowerCase().includes(q) ||
        r.model.toLowerCase().includes(q) ||
        r.serial_number.toLowerCase().includes(q) ||
        r.device_type.toLowerCase().includes(q)
      );
    });
  }, [rows, query, status]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-lg shadow-black/20">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 p-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Enriched Equipment Register</h3>
          <p className="text-xs text-slate-500">
            Sorted ascending by manufactured date - {filtered.length.toLocaleString()} of{" "}
            {rows.length.toLocaleString()} assets
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex overflow-hidden rounded-lg border border-white/10">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  status === s ? "bg-brand-600 text-white" : "text-slate-300 hover:bg-white/5"
                }`}
              >
                {s === "End of Life (Replace)" ? "EOL" : s}
              </button>
            ))}
          </div>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="w-44 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="max-h-[620px] overflow-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-[#0c1322] text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <Th>Manufacturer</Th>
              <Th>Model</Th>
              <Th>Serial</Th>
              <Th>Device Type</Th>
              <Th>Manufactured</Th>
              <Th className="text-right">Age</Th>
              <Th>Capital Status</Th>
              <Th>Confidence</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => {
              const st = STATUS_STYLES[r.capital_status];
              const conf = CONFIDENCE_STYLES[r.date_confidence];
              return (
                <tr
                  key={`${r.serial_number}-${i}`}
                  className="border-t border-white/[0.06] hover:bg-white/[0.02]"
                >
                  <Td className="font-medium text-slate-200">{r.manufacturer}</Td>
                  <Td className="text-slate-300">{r.model}</Td>
                  <Td className="font-mono text-xs text-slate-400">{r.serial_number}</Td>
                  <Td className="text-slate-300">{r.device_type}</Td>
                  <Td className="text-slate-300">{r.manufactured_display}</Td>
                  <Td className="text-right tabular-nums text-slate-300">
                    {r.equipment_age_years == null ? "—" : `${r.equipment_age_years}y`}
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${st.badge}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                      {st.label}
                    </span>
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs ${conf.text}`}
                      title={r.date_method}
                    >
                      <span className={`h-2 w-2 rounded-full ${conf.dot}`} />
                      {r.date_confidence}
                    </span>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-8 text-center text-sm text-slate-500">No assets match your filters.</p>
        )}
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`whitespace-nowrap px-4 py-3 font-semibold ${className}`}>{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`whitespace-nowrap px-4 py-2.5 ${className}`}>{children}</td>;
}
