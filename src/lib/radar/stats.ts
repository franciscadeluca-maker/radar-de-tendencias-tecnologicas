import { CATEGORIAS, FASES, HORIZONTES, type Categoria, type Fase, type Horizonte, type SerieMensual, type Tendencia } from "./types";

export function contarPorCategoria(tendencias: Tendencia[]) {
  return CATEGORIAS.map((categoria) => ({
    categoria,
    total: tendencias.filter((t) => t.categoria === categoria).length,
  })).sort((a, b) => b.total - a.total);
}

export function contarPorFase(tendencias: Tendencia[]): Record<Fase, number> {
  return Object.fromEntries(FASES.map((f) => [f, tendencias.filter((t) => t.fase === f).length])) as Record<Fase, number>;
}

export function contarPorHorizonte(tendencias: Tendencia[]): Record<Horizonte, number> {
  return Object.fromEntries(HORIZONTES.map((h) => [h, tendencias.filter((t) => t.horizonte === h).length])) as Record<Horizonte, number>;
}

/** Tendencias detectadas en los últimos `dias` días respecto de `referencia`. */
export function detectadasRecientes(tendencias: Tendencia[], dias: number, referencia: Date) {
  const limite = referencia.getTime() - dias * 86_400_000;
  return tendencias.filter((t) => new Date(t.fechaDeteccion).getTime() >= limite);
}

export function relevanciaPromedio(tendencias: Tendencia[]) {
  if (!tendencias.length) return 0;
  return Math.round(tendencias.reduce((s, t) => s + t.relevancia, 0) / tendencias.length);
}

/** Fecha de detección más reciente, usada como referencia temporal del conjunto de datos. */
export function fechaReferencia(tendencias: Tendencia[]) {
  const max = Math.max(...tendencias.map((t) => new Date(t.fechaDeteccion).getTime()));
  return Number.isFinite(max) ? new Date(max) : new Date();
}

/** Aplana la serie mensual para los gráficos: { mes, [categoria]: n, total }. */
export function serieParaGrafico(serie: SerieMensual[]) {
  return serie.map((s) => ({
    mes: s.mes,
    ...s.valores,
    total: Object.values(s.valores).reduce((a, b) => a + b, 0),
  }));
}

/** Variación porcentual entre el último mes y el anterior, por categoría. */
export function variacionMensual(serie: SerieMensual[]) {
  if (serie.length < 2) return [] as { categoria: Categoria; variacion: number; actual: number }[];
  const [prev, last] = serie.slice(-2);
  return CATEGORIAS.map((categoria) => {
    const a = prev.valores[categoria] ?? 0;
    const b = last.valores[categoria] ?? 0;
    return { categoria, actual: b, variacion: a ? Math.round(((b - a) / a) * 1000) / 10 : 0 };
  }).sort((x, y) => y.variacion - x.variacion);
}

export interface FiltrosTendencias {
  q?: string;
  categoria?: Categoria | "todas";
  fase?: Fase | "todas";
  horizonte?: Horizonte | "todos";
  orden?: "fecha" | "relevancia" | "menciones";
}

export function filtrarTendencias(tendencias: Tendencia[], f: FiltrosTendencias) {
  const q = f.q?.trim().toLowerCase();
  const res = tendencias.filter((t) => {
    if (f.categoria && f.categoria !== "todas" && t.categoria !== f.categoria) return false;
    if (f.fase && f.fase !== "todas" && t.fase !== f.fase) return false;
    if (f.horizonte && f.horizonte !== "todos" && t.horizonte !== f.horizonte) return false;
    if (q) {
      const texto = `${t.nombre} ${t.descripcion} ${t.fuente} ${t.palabrasClave.join(" ")}`.toLowerCase();
      if (!texto.includes(q)) return false;
    }
    return true;
  });
  const orden = f.orden ?? "fecha";
  return res.sort((a, b) =>
    orden === "relevancia"
      ? b.relevancia - a.relevancia
      : orden === "menciones"
        ? b.menciones - a.menciones
        : new Date(b.fechaDeteccion).getTime() - new Date(a.fechaDeteccion).getTime(),
  );
}
