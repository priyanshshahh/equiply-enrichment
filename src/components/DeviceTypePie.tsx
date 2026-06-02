import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { DeviceTypeSlice } from "../lib/dataEngine";
import { PIE_COLORS } from "../lib/ui";

export default function DeviceTypePie({ data }: { data: DeviceTypeSlice[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-lg shadow-black/20">
      <h3 className="text-sm font-semibold text-white">Device Type Distribution</h3>
      <p className="text-xs text-slate-500">Share of each device category in the uploaded file</p>
      <div className="mt-2 h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={120}
              innerRadius={62}
              paddingAngle={1}
              stroke="rgba(7,11,20,0.6)"
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#0b1220",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                color: "#e6edf7",
              }}
              formatter={(value: number, name: string) => {
                const total = data.reduce((sum, d) => sum + d.value, 0) || 1;
                return [`${value} (${((value / total) * 100).toFixed(1)}%)`, name];
              }}
            />
            <Legend
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: 11, color: "#94a3b8" }}
              iconType="circle"
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
