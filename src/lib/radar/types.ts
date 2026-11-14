import { z } from "zod";

/**
 * Contrato de datos entre el agente (n8n + Gemini) y la interfaz.
 * Los flujos de n8n deben devolver objetos que cumplan estos esquemas.
 */

export const CATEGORIAS = [
  "Inteligencia Artificial",
  "Computación Cuántica",
  "Ciberseguridad",
  "Cloud y Edge",
  "IoT e Industria 4.0",
  "Biotecnología",
  "Energía y Clima",
  "Realidad Extendida",
] as const;

export const FASES = ["emergente", "en_crecimiento", "consolidada", "en_declive"] as const;
export const HORIZONTES = ["corto", "mediano", "largo"] as const;

export const categoriaSchema = z.enum(CATEGORIAS);
export const faseSchema = z.enum(FASES);
export const horizonteSchema = z.enum(HORIZONTES);

export const tendenciaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  descripcion: z.string(),
  categoria: categoriaSchema,
  fase: faseSchema,
  horizonte: horizonteSchema,
  fechaDeteccion: z.string(), // ISO 8601
  fuente: z.string(),
  url: z.string().url(),
  relevancia: z.number().min(0).max(100),
  menciones: z.number().int().nonnegative(),
  palabrasClave: z.array(z.string()),
});

export const ejecucionSchema = z.object({
  id: z.string(),
  inicio: z.string(),
  fin: z.string().nullable(),
  estado: z.enum(["completada", "fallida", "en_curso", "en_cola"]),
  disparador: z.enum(["programada", "manual"]),
  modelo: z.string(),
  fuentesConsultadas: z.number().int().nonnegative(),
  publicacionesAnalizadas: z.number().int().nonnegative(),
  tendenciasNuevas: z.number().int().nonnegative(),
  tendenciasActualizadas: z.number().int().nonnegative(),
  consulta: z.string().optional(),
  error: z.string().optional(),
});

export const serieMensualSchema = z.object({
  mes: z.string(), // "2026-01"
  valores: z.record(z.string(), z.number()),
});

export type Categoria = z.infer<typeof categoriaSchema>;
export type Fase = z.infer<typeof faseSchema>;
export type Horizonte = z.infer<typeof horizonteSchema>;
export type Tendencia = z.infer<typeof tendenciaSchema>;
export type Ejecucion = z.infer<typeof ejecucionSchema>;
export type SerieMensual = z.infer<typeof serieMensualSchema>;

export const FASE_LABEL: Record<Fase, string> = {
  emergente: "Emergente",
  en_crecimiento: "En crecimiento",
  consolidada: "Consolidada",
  en_declive: "En declive",
};

export const HORIZONTE_LABEL: Record<Horizonte, string> = {
  corto: "Corto plazo (0–1 año)",
  mediano: "Mediano plazo (1–3 años)",
  largo: "Largo plazo (3+ años)",
};

export const HORIZONTE_CORTO: Record<Horizonte, string> = {
  corto: "Corto",
  mediano: "Mediano",
  largo: "Largo",
};

export const ESTADO_LABEL: Record<Ejecucion["estado"], string> = {
  completada: "Completada",
  fallida: "Fallida",
  en_curso: "En curso",
  en_cola: "En cola",
};

/** Color de gráfico asignado a cada categoría (tokens --chart-1..8). */
export const CATEGORIA_COLOR: Record<Categoria, string> = {
  "Inteligencia Artificial": "var(--chart-1)",
  "Computación Cuántica": "var(--chart-3)",
  Ciberseguridad: "var(--chart-2)",
  "Cloud y Edge": "var(--chart-4)",
  "IoT e Industria 4.0": "var(--chart-6)",
  Biotecnología: "var(--chart-8)",
  "Energía y Clima": "var(--chart-7)",
  "Realidad Extendida": "var(--chart-5)",
};

export const CATEGORIA_SLUG: Record<Categoria, string> = {
  "Inteligencia Artificial": "ia",
  "Computación Cuántica": "cuantica",
  Ciberseguridad: "ciber",
  "Cloud y Edge": "cloud",
  "IoT e Industria 4.0": "iot",
  Biotecnología: "bio",
  "Energía y Clima": "energia",
  "Realidad Extendida": "xr",
};
