import { CATEGORIES, TIME_HORIZONS, type TimeHorizon, type Trend, type TrendCategory } from "@/services/types";

const DAY = 86_400_000;

/**
 * Porcentajes enteros que siempre suman 100 (método del mayor resto),
 * para que la leyenda nunca muestre 99 % o 101 %.
 */
export function percentages(counts: number[]) {
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return counts.map(() => 0);
  const raw = counts.map((c) => (c / total) * 100);
  const floors = raw.map(Math.floor);
  let left = 100 - floors.reduce((a, b) => a + b, 0);
  const order = raw.map((r, i) => ({ i, rest: r - Math.floor(r) })).sort((a, b) => b.rest - a.rest);
  for (const { i } of order) {
    if (left <= 0) break;
    floors[i]! += 1;
    left--;
  }
  return floors;
}

export function countByCategory(trends: Trend[]) {
  return CATEGORIES.map((category) => ({
    category,
    total: trends.filter((t) => t.category === category).length,
  })).sort((a, b) => b.total - a.total);
}

/** Distribución por categoría (solo categorías con tendencias), con porcentaje sobre el total. */
export function categoryDistribution(trends: Trend[]) {
  const rows = countByCategory(trends).filter((c) => c.total > 0);
  const pcts = percentages(rows.map((r) => r.total));
  return rows.map((r, i) => ({ ...r, pct: pcts[i] ?? 0 }));
}

/** Tendencias por horizonte temporal, desglosadas por categoría. */
export function horizonBreakdown(trends: Trend[]) {
  const totals = TIME_HORIZONS.map((h) => trends.filter((t) => t.timeHorizon === h));
  const pcts = percentages(totals.map((items) => items.length));
  return TIME_HORIZONS.map((horizon, i) => {
    const items = totals[i] ?? [];
    return {
      horizon,
      total: items.length,
      pct: pcts[i] ?? 0,
      avgRelevance: avgRelevance(items),
      byCategory: CATEGORIES.map((category) => ({
        category,
        total: items.filter((t) => t.category === category).length,
      })).filter((c) => c.total > 0),
    };
  });
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

/** Tendencias detectadas en el mes calendario actual (UTC) de `now`. */
export function detectedThisMonth(trends: Trend[], now: Date) {
  const key = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return trends.filter((t) => monthKey(t.detectedAt) === key);
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

/** Lee los filtros del Explorador desde la URL, ignorando valores desconocidos. */
export function parseExplorerSearch(search: Record<string, unknown>) {
  const id = search["id"];
  const cat = search["categoria"];
  const hor = search["horizonte"];
  return {
    id: typeof id === "string" ? id : undefined,
    categoria: (CATEGORIES as readonly unknown[]).includes(cat) ? (cat as TrendCategory) : undefined,
    horizonte: (TIME_HORIZONS as readonly unknown[]).includes(hor) ? (hor as TimeHorizon) : undefined,
  };
}
