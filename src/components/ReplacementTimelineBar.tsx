import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimelineBucket } from "../lib/dataEngine";

export default function ReplacementTimelineBar({ data }: { data: TimelineBucket[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg shadow-black/20">
      <h3 className="text-sm font-semibold text-white">Capital Replacement Timeline</h3>
      <p className="text-xs text-slate-500">Assets by manufacture year, stacked by replacement tier</p>
      <div className="mt-2 h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="year" tick={{ fill: "#94a3b8", fontSize: 11 }} stroke="rgba(255,255,255,0.1)" />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} stroke="rgba(255,255,255,0.1)" allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{
                background: "#0b1220",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                color: "#e6edf7",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, color: "#94a3b8" }} iconType="circle" />
            <Bar dataKey="Active" stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Review" stackId="a" fill="#fbbf24" />
            <Bar dataKey="End of Life (Replace)" stackId="a" fill="#fb7185" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
