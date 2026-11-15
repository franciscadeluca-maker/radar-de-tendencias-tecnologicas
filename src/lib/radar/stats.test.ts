import { describe, expect, it } from "vitest";

import type { Trend, TrendCategory, TimeHorizon } from "@/services/types";

import { categoryDistribution, horizonBreakdown, parseExplorerSearch, percentages } from "./stats";

let n = 0;
const t = (category: TrendCategory, timeHorizon: TimeHorizon): Trend => ({
  id: `t${n++}`,
  title: "x",
  summary: "x",
  category,
  timeHorizon,
  relevanceScore: 80,
  detectedAt: "2026-11-10T14:00:00Z",
  sourceName: "s",
  sourceUrl: "#",
});

const sample = [
  ...Array.from({ length: 5 }, () => t("IA y Automatización", "Mediano Plazo")),
  ...Array.from({ length: 4 }, () => t("Almacenamiento Energético", "Corto Plazo")),
  ...Array.from({ length: 3 }, () => t("Hidrógeno Verde", "Largo Plazo")),
  t("IA y Automatización", "Corto Plazo"),
];

describe("totales del Dashboard", () => {
  it("la dona suma exactamente el total de tendencias", () => {
    expect(categoryDistribution(sample).reduce((s, c) => s + c.total, 0)).toBe(sample.length);
  });

  it("el horizonte temporal suma exactamente el total de tendencias", () => {
    expect(horizonBreakdown(sample).reduce((s, h) => s + h.total, 0)).toBe(sample.length);
  });

  it("el desglose por categoría de cada horizonte suma el total de ese horizonte", () => {
    for (const h of horizonBreakdown(sample)) {
      expect(h.byCategory.reduce((s, c) => s + c.total, 0)).toBe(h.total);
    }
  });

  it("los porcentajes de la leyenda suman 100", () => {
    expect(percentages([1, 1, 1])).toEqual([34, 33, 33]);
    expect(categoryDistribution(sample).reduce((s, c) => s + c.pct, 0)).toBe(100);
  });
});

describe("filtros del Explorador desde el Dashboard", () => {
  it("acepta una categoría y un horizonte válidos", () => {
    expect(parseExplorerSearch({ categoria: "Hidrógeno Verde", horizonte: "Largo Plazo" })).toEqual({
      id: undefined,
      categoria: "Hidrógeno Verde",
      horizonte: "Largo Plazo",
    });
  });

  it("ignora valores desconocidos", () => {
    expect(parseExplorerSearch({ categoria: "Nuclear", horizonte: "Ya" })).toEqual({ id: undefined, categoria: undefined, horizonte: undefined });
  });
});
