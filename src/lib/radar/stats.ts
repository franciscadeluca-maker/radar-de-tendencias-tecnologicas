import {
  CATEGORIES,
  TIME_HORIZONS,
  type TimeHorizon,
  type TimelinePoint,
  type Trend,
  type TrendCategory,
} from "@/services/types";

const DAY = 86_400_000;

export function countByCategory(trends: Trend[]) {
  return CATEGORIES.map((category) => ({
    category,
    total: trends.filter((t) => t.category === category).length,
  })).sort((a, b) => b.total - a.total);
}

export function countByHorizon(trends: Trend[]) {
  return TIME_HORIZONS.map((horizon) => {
    const items = trends.filter((t) => t.timeHorizon === horizon);
    return {
      horizon,
      total: items.length,
      avgRelevance: items.length ? Math.round(items.reduce((s, t) => s + t.relevanceScore, 0) / items.length) : 0,
    };
  });
}

export function topSources(trends: Trend[], limit = 6) {
  const map = new Map<string, number>();
  for (const t of trends) map.set(t.sourceName, (map.get(t.sourceName) ?? 0) + 1);
  return [...map.entries()]
    .map(([source, total]) => ({ source, total }))
    .sort((a, b) => b.total - a.total || a.source.localeCompare(b.source))
    .slice(0, limit);
}

export function detectedWithin(trends: Trend[], days: number, now: Date) {
  const limit = now.getTime() - days * DAY;
  return trends.filter((t) => new Date(t.detectedAt).getTime() >= limit);
}

export function dominantCategory(trends: Trend[]) {
  const [first] = countByCategory(trends);
  return first && first.total > 0 ? first : null;
}

export function avgRelevance(trends: Trend[]) {
  if (!trends.length) return 0;
  return Math.round(trends.reduce((s, t) => s + t.relevanceScore, 0) / trends.length);
}

export function monthKey(iso: string) {
  return iso.slice(0, 7);
}

/** Serie del gráfico temporal: publicaciones analizadas por mes + tendencias detectadas ese mes. */
export function detectionSeries(timeline: TimelinePoint[], trends: Trend[]) {
  return timeline.map((p) => ({
    month: p.month,
    publicaciones: Object.values(p.values).reduce((a, b) => a + b, 0),
    tendencias: trends.filter((t) => monthKey(t.detectedAt) === p.month).length,
  }));
}

export const RANGE_OPTIONS = [
  { value: "3m", label: "3 meses", months: 3 },
  { value: "6m", label: "6 meses", months: 6 },
  { value: "12m", label: "12 meses", months: 12 },
] as const;
export type RangeValue = (typeof RANGE_OPTIONS)[number]["value"];

/** Primer mes (YYYY-MM) incluido al mirar los últimos `months` meses desde `now`. */
export function rangeStartMonth(months: number, now: Date) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function trendsFromMonth(trends: Trend[], startMonth: string) {
  return trends.filter((t) => monthKey(t.detectedAt) >= startMonth);
}

export function timelineFromMonth(timeline: TimelinePoint[], startMonth: string) {
  return timeline.filter((p) => p.month >= startMonth);
}

/** Variación porcentual entre el último mes y el anterior de la serie. */
export function monthlyChange(timeline: TimelinePoint[]) {
  if (timeline.length < 2) return [] as { category: TrendCategory; current: number; change: number }[];
  const prev = timeline[timeline.length - 2];
  const last = timeline[timeline.length - 1];
  if (!prev || !last) return [];
  return CATEGORIES.map((category) => {
    const a = prev.values[category] ?? 0;
    const b = last.values[category] ?? 0;
    return { category, current: b, change: a ? Math.round(((b - a) / a) * 1000) / 10 : 0 };
  }).sort((x, y) => y.change - x.change);
}

export type SortField = "title" | "category" | "timeHorizon" | "detectedAt" | "sourceName" | "relevanceScore";
export type SortDir = "asc" | "desc";

export interface TrendFilters {
  q?: string;
  category?: TrendCategory | "todas";
  horizon?: TimeHorizon | "todos";
}

export function filterTrends(trends: Trend[], f: TrendFilters) {
  const q = f.q?.trim().toLocaleLowerCase("es");
  return trends.filter((t) => {
    if (f.category && f.category !== "todas" && t.category !== f.category) return false;
    if (f.horizon && f.horizon !== "todos" && t.timeHorizon !== f.horizon) return false;
    if (q) {
      const text = `${t.title} ${t.summary} ${t.sourceName} ${(t.keywords ?? []).join(" ")}`.toLocaleLowerCase("es");
      if (!text.includes(q)) return false;
    }
    return true;
  });
}

const HORIZON_ORDER: Record<TimeHorizon, number> = { "Corto Plazo": 0, "Mediano Plazo": 1, "Largo Plazo": 2 };

export function sortTrends(trends: Trend[], field: SortField, dir: SortDir) {
  const m = dir === "asc" ? 1 : -1;
  return [...trends].sort((a, b) => {
    switch (field) {
      case "relevanceScore":
        return (a.relevanceScore - b.relevanceScore) * m;
      case "detectedAt":
        return (new Date(a.detectedAt).getTime() - new Date(b.detectedAt).getTime()) * m;
      case "timeHorizon":
        return (HORIZON_ORDER[a.timeHorizon] - HORIZON_ORDER[b.timeHorizon]) * m;
      default:
        return a[field].localeCompare(b[field], "es") * m;
    }
  });
}
