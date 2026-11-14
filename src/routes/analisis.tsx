import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarRange, Gauge, Newspaper, Radar, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";

import { CategoryBadge } from "@/components/radar/badges";
import { KpiCard } from "@/components/radar/kpi-card";
import { PageHeader, Panel } from "@/components/radar/page-header";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { fmtMonth, fmtNumber } from "@/lib/radar/format";
import {
  avgRelevance,
  countByHorizon,
  monthlyChange,
  RANGE_OPTIONS,
  rangeStartMonth,
  timelineFromMonth,
  topSources,
  trendsFromMonth,
  type RangeValue,
} from "@/lib/radar/stats";
import { cn } from "@/lib/utils";
import { timelineQuery, trendsQuery } from "@/services/queries";
import { CATEGORIES, CATEGORY_COLOR, CATEGORY_KEY } from "@/services/types";

export const Route = createFileRoute("/analisis")({
  head: () => ({
    meta: [
      { title: "Análisis · EnergVision Radar Tecnológico" },
      { name: "description", content: "Evolución temporal de las tendencias por categoría, distribución por horizonte temporal y principales fuentes de información." },
      { property: "og:title", content: "Análisis · EnergVision Radar Tecnológico" },
      { property: "og:description", content: "Visualizaciones de evolución temporal, horizontes y fuentes de las tendencias tecnológicas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(trendsQuery), context.queryClient.ensureQueryData(timelineQuery)]),
  component: Analysis,
});

const stackedConfig = Object.fromEntries(
  CATEGORIES.map((c) => [CATEGORY_KEY[c], { label: c, color: CATEGORY_COLOR[c] }]),
) satisfies ChartConfig;

const horizonConfig = { total: { label: "Tendencias", color: "var(--chart-1)" } } satisfies ChartConfig;
const sourcesConfig = { total: { label: "Tendencias", color: "var(--chart-2)" } } satisfies ChartConfig;
const HORIZON_COLORS = ["var(--chart-2)", "var(--chart-1)", "var(--chart-6)"];

function Analysis() {
  const { data: trends } = useSuspenseQuery(trendsQuery);
  const { data: timeline } = useSuspenseQuery(timelineQuery);
  const [range, setRange] = useState<RangeValue>("12m");

  const months = RANGE_OPTIONS.find((r) => r.value === range)!.months;
  const start = rangeStartMonth(months, new Date());
  const tl = timelineFromMonth(timeline, start);
  const tr = trendsFromMonth(trends, start);

  const stacked = tl.map((p) => ({
    month: p.month,
    ...Object.fromEntries(CATEGORIES.map((c) => [CATEGORY_KEY[c], p.values[c]])),
  }));
  const horizons = countByHorizon(tr).map((h) => ({ ...h, label: h.horizon.replace(" Plazo", "") }));
  const sources = topSources(tr, 7);
  const changes = monthlyChange(tl);
  const totalPubs = tl.reduce((s, p) => s + Object.values(p.values).reduce((a, b) => a + b, 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Análisis avanzado"
        title="Análisis"
        description="Evolución temporal de las señales detectadas y distribución de las tendencias por horizonte y fuente."
        actions={
          <div className="flex items-center gap-2 rounded-lg border bg-card p-1 shadow-card">
            <CalendarRange className="ml-2 size-4 text-muted-foreground" />
            <ToggleGroup type="single" value={range} onValueChange={(v) => v && setRange(v as RangeValue)} size="sm">
              {RANGE_OPTIONS.map((r) => (
                <ToggleGroupItem key={r.value} value={r.value} className="px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  {r.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Tendencias en el período" value={tr.length} icon={Radar} hint={`desde ${fmtMonth(start)}`} />
        <KpiCard label="Publicaciones analizadas" value={fmtNumber(totalPubs)} icon={Newspaper} hint={`${tl.length} meses`} />
        <KpiCard label="Relevancia promedio" value={avgRelevance(tr)} icon={Gauge} hint="índice 1–100" />
      </div>

      <Panel title="Evolución temporal por categoría" description="Publicaciones analizadas por mes, apiladas por categoría tecnológica">
        <div className="p-4 pt-6">
          <ChartContainer config={stackedConfig} className="aspect-auto h-[340px] w-full">
            <BarChart data={stacked} margin={{ left: -8, right: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickFormatter={fmtMonth} tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} width={44} tickFormatter={(v) => fmtNumber(v)} />
              <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => fmtMonth(String(v))} />} />
              <ChartLegend content={<ChartLegendContent className="flex-wrap gap-x-4 gap-y-1" />} />
              {CATEGORIES.map((c, i) => (
                <Bar key={c} dataKey={CATEGORY_KEY[c]} stackId="a" fill={`var(--color-${CATEGORY_KEY[c]})`} radius={i === CATEGORIES.length - 1 ? [4, 4, 0, 0] : 0} maxBarSize={44} />
              ))}
            </BarChart>
          </ChartContainer>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Horizonte temporal" description="Tendencias según el plazo estimado de impacto">
          <div className="p-4 pt-6">
            <ChartContainer config={horizonConfig} className="aspect-auto h-[220px] w-full">
              <BarChart data={horizons} margin={{ top: 20, left: -16, right: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => `${v} plazo`} />} />
                <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={72}>
                  {horizons.map((h, i) => (
                    <Cell key={h.horizon} fill={HORIZON_COLORS[i]} />
                  ))}
                  <LabelList dataKey="total" position="top" className="fill-foreground font-mono text-xs" />
                </Bar>
              </BarChart>
            </ChartContainer>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-4">
              {horizons.map((h, i) => (
                <div key={h.horizon} className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                    <span className="size-2 shrink-0 rounded-sm" style={{ background: HORIZON_COLORS[i] }} />
                    {h.horizon}
                  </p>
                  <p className="mt-0.5 font-mono text-sm text-foreground">Relev. {h.avgRelevance || "—"}</p>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="Fuentes principales" description="Fuentes que originaron más tendencias en el período">
          <div className="p-4 pt-6">
            {sources.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">Sin tendencias en el período seleccionado.</p>
            ) : (
              <ChartContainer config={sourcesConfig} className="aspect-auto w-full" style={{ height: Math.max(160, sources.length * 40) }}>
                <BarChart data={sources} layout="vertical" margin={{ left: 0, right: 28 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis type="category" dataKey="source" tickLine={false} axisLine={false} width={130} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="total" fill="var(--color-total)" radius={[0, 6, 6, 0]} barSize={18}>
                    <LabelList dataKey="total" position="right" className="fill-foreground font-mono text-xs" />
                  </Bar>
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </Panel>
      </div>

      <Panel title="Variación mensual por categoría" description="Cambio en el volumen de publicaciones del último mes frente al anterior">
        <ul className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
          {changes.map((c) => {
            const up = c.change >= 0;
            return (
              <li key={c.category} className="flex flex-col gap-2 border-border p-4 sm:border-b lg:border-r">
                <CategoryBadge category={c.category} className="self-start" />
                <div className="flex items-end justify-between gap-2">
                  <span className="font-display text-xl font-semibold tabular text-foreground">{fmtNumber(c.current)}</span>
                  <span className={cn("inline-flex items-center gap-1 font-mono text-xs font-medium", up ? "text-success" : "text-destructive")}>
                    {up ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                    {up ? "+" : ""}{c.change}%
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}
