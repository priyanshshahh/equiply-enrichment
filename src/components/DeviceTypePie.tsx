import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DeviceTypeSlice } from "../lib/dataEngine";
import { PIE_COLORS } from "../lib/ui";

function PieTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: DeviceTypeSlice }>;
  total: number;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const pct = total ? ((item.value / total) * 100).toFixed(1) : "0";
  return (
    <div className="rounded-xl border border-white/15 bg-[#0b1220] px-3 py-2 shadow-xl">
      <p className="text-sm font-semibold text-white">{item.name}</p>
      <p className="text-xs text-slate-300">
        {item.value.toLocaleString()} assets · {pct}%
      </p>
    </div>
  );
}

export default function DeviceTypePie({ data }: { data: DeviceTypeSlice[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg shadow-black/20">
      <h3 className="text-sm font-semibold text-white">Device Type Distribution</h3>
      <p className="text-xs text-slate-500">Share of each device category in the uploaded file</p>

      <div className="mt-2 h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={96}
              innerRadius={52}
              paddingAngle={1}
              stroke="rgba(7,11,20,0.6)"
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<PieTooltip total={total} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 max-h-36 overflow-y-auto rounded-lg border border-white/[0.06] bg-black/20 p-3">
        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {data.map((entry, i) => (
            <div
              key={entry.name}
              className="flex min-w-0 items-center gap-2 text-xs"
              title={`${entry.name}: ${entry.value} (${entry.pct.toFixed(1)}%)`}
            >
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
              />
              <span className="min-w-0 flex-1 truncate text-slate-200">{entry.name}</span>
              <span className="shrink-0 tabular-nums text-slate-400">{entry.pct.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
