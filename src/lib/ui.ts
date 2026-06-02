import type { CapitalStatus, DateConfidence } from "./types";

export const STATUS_STYLES: Record<CapitalStatus, { badge: string; dot: string; label: string }> = {
  "End of Life (Replace)": {
    badge: "bg-rose-500/15 text-rose-300 ring-1 ring-inset ring-rose-500/30",
    dot: "bg-rose-400",
    label: "End of Life",
  },
  Review: {
    badge: "bg-amber-500/15 text-amber-300 ring-1 ring-inset ring-amber-500/30",
    dot: "bg-amber-400",
    label: "Review",
  },
  Active: {
    badge: "bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-500/30",
    dot: "bg-emerald-400",
    label: "Active",
  },
  Unknown: {
    badge: "bg-slate-500/15 text-slate-300 ring-1 ring-inset ring-slate-500/30",
    dot: "bg-slate-400",
    label: "Unknown",
  },
};

export const CONFIDENCE_STYLES: Record<DateConfidence, { dot: string; text: string }> = {
  High: { dot: "bg-emerald-400", text: "text-emerald-300" },
  Medium: { dot: "bg-amber-400", text: "text-amber-300" },
  Low: { dot: "bg-orange-400", text: "text-orange-300" },
  None: { dot: "bg-slate-500", text: "text-slate-400" },
};

/** Distinct, theme-friendly palette for the device-type pie. */
export const PIE_COLORS = [
  "#1f8fff",
  "#22d3ee",
  "#34d399",
  "#a78bfa",
  "#f472b6",
  "#fbbf24",
  "#fb7185",
  "#60a5fa",
  "#4ade80",
  "#c084fc",
  "#f59e0b",
  "#2dd4bf",
  "#e879f9",
  "#38bdf8",
  "#facc15",
  "#fca5a5",
  "#818cf8",
  "#5eead4",
  "#fdba74",
  "#93c5fd",
  "#d8b4fe",
];
