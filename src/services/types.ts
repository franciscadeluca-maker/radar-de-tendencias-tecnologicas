/**
 * Contrato de datos entre el agente (n8n + Gemini) y la interfaz.
 * Los webhooks de n8n deben devolver objetos con esta forma.
 */

export const CATEGORIES = [
  "Almacenamiento Energético",
  "Redes Inteligentes",
  "Hidrógeno Verde",
  "IA y Automatización",
  "Energía Solar",
  "Movilidad Eléctrica",
  "Regulación",
] as const;

export const TIME_HORIZONS = ["Corto Plazo", "Mediano Plazo", "Largo Plazo"] as const;

export type TrendCategory = (typeof CATEGORIES)[number];
export type TimeHorizon = (typeof TIME_HORIZONS)[number];

export interface Trend {
  id: string;
  title: string;
  /** Insight generado por Gemini. */
  summary: string;
  /** Puntos clave del resumen ejecutivo (opcional). */
  insights?: string[];
  category: TrendCategory;
  timeHorizon: TimeHorizon;
  /** 1–100 */
  relevanceScore: number;
  /** ISO 8601 */
  detectedAt: string;
  sourceName: string;
  sourceUrl: string;
  keywords?: string[];
}

export type ExecutionStatus = "Completado" | "En proceso" | "Error";

export interface AgentExecutionLog {
  id: string;
  /** ISO 8601 */
  startedAt: string;
  status: ExecutionStatus;
  sourcesScanned: number;
  newTrends: number;
  durationSeconds: number;
  trigger: "Programada" | "Manual";
  model: string;
  errorMessage?: string;
}

/** Publicaciones analizadas por mes y categoría. */
export interface TimelinePoint {
  month: string; // "2026-01"
  values: Record<TrendCategory, number>;
}

export interface AgentStatus {
  state: "Activo" | "En espera";
  workflowName: string;
  schedule: string;
  model: string;
  sourcesConfigured: number;
}

export interface SearchResult {
  trend: Trend | null;
  log: AgentExecutionLog;
}

export const CATEGORY_COLOR: Record<TrendCategory, string> = {
  "Almacenamiento Energético": "var(--chart-1)",
  "Redes Inteligentes": "var(--chart-2)",
  "Hidrógeno Verde": "var(--chart-8)",
  "IA y Automatización": "var(--chart-5)",
  "Energía Solar": "var(--chart-7)",
  "Movilidad Eléctrica": "var(--chart-4)",
  Regulación: "var(--chart-6)",
};

/** Clave segura para usar en configuraciones de gráficos. */
export const CATEGORY_KEY: Record<TrendCategory, string> = {
  "Almacenamiento Energético": "almacenamiento",
  "Redes Inteligentes": "redes",
  "Hidrógeno Verde": "hidrogeno",
  "IA y Automatización": "ia",
  "Energía Solar": "solar",
  "Movilidad Eléctrica": "movilidad",
  Regulación: "regulacion",
};
