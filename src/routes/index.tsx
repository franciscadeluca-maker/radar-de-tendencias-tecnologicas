import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, Bot, CalendarClock, Layers, Radar, Sparkles } from "lucide-react";
import { Area, Bar, CartesianGrid, Cell, ComposedChart, Pie, PieChart, XAxis, YAxis } from "recharts";

import { CategoryBadge, HorizonBadge, RelevanceMeter, StatusBadge } from "@/components/radar/badges";
import { KpiCard } from "@/components/radar/kpi-card";
import { PageHeader, Panel } from "@/components/radar/page-header";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { fmtDate, fmtDateTime, fmtMonth, fmtNumber } from "@/lib/radar/format";
import { countByCategory, detectedWithin, detectionSeries, dominantCategory } from "@/lib/radar/stats";
import { logsQuery, timelineQuery, trendsQuery } from "@/services/queries";
import { CATEGORY_COLOR } from "@/services/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · EnergVision Radar Tecnológico" },
      { name: "description", content: "Indicadores generales de vigilancia tecnológica: tendencias detectadas, novedades de la semana y distribución por categoría." },
      { property: "og:title", content: "Dashboard · EnergVision Radar Tecnológico" },
      { property: "og:description", content: "Indicadores generales de vigilancia tecnológica del sector energético." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(trendsQuery),
      context.queryClient.ensureQueryData(logsQuery),
      context.queryClient.ensureQueryData(timelineQuery),
    ]),
  component: Dashboard,
});

const seriesConfig = {
  publicaciones: { label: "Publicaciones analizadas", color: "var(--chart-3)" },
  tendencias: { label: "Tendencias detectadas", color: "var(--chart-1)" },
} satisfies ChartConfig;

function Dashboard() {
  const { data: trends } = useSuspenseQuery(trendsQuery);
  const { data: logs } = useSuspenseQuery(logsQuery);
  const { data: timeline } = useSuspenseQuery(timelineQuery);

  const now = new Date();
  const weekly = detectedWithin(trends, 7, now);
  const previousWeek = detectedWithin(trends, 14, now).length - weekly.length;
  const dominant = dominantCategory(trends);
  const lastRun = logs.find((l) => l.status !== "En proceso");
  const byCategory = countByCategory(trends).filter((c) => c.total > 0);
  const series = detectionSeries(timeline, trends);
  const recent = [...trends].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt)).slice(0, 5);
  const monthPubs = series.at(-1)?.publicaciones ?? 0;
  const prevPubs = series.at(-2)?.publicaciones ?? 0;
  const pubChange = prevPubs ? Math.round(((monthPubs - prevPubs) / prevPubs) * 100) : 0;

  const pieConfig = Object.fromEntries(byCategory.map((c) => [c.category, { label: c.category, color: CATEGORY_COLOR[c.category] }])) satisfies ChartConfig;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Panel de vigilancia"
        title="Dashboard"
        description="Resumen de las tendencias identificadas por el agente de n8n + Gemini en fuentes técnicas, científicas y regulatorias."
        actions={
          <Button asChild variant="outline">
            <Link to="/tendencias">
              Explorar tendencias <ArrowRight />
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Tendencias detectadas" value={fmtNumber(trends.length)} icon={Radar} trend={{ value: `${pubChange >= 0 ? "+" : ""}${pubChange}%`, positive: pubChange >= 0 }} hint="publicaciones vs. mes anterior" />
        <KpiCard label="Nuevas esta semana" value={weekly.length} icon={Sparkles} trend={{ value: `${weekly.length - previousWeek >= 0 ? "+" : ""}${weekly.length - previousWeek}`, positive: weekly.length >= previousWeek }} hint="vs. semana anterior" />
        <KpiCard label="Categoría dominante" value={dominant?.category ?? "—"} valueClassName="text-lg leading-snug sm:text-xl" icon={Layers} hint={dominant ? `${dominant.total} tendencias · ${Math.round((dominant.total / trends.length) * 100)}% del total` : undefined} />
        <KpiCard
          label="Última ejecución del agente"
          value={lastRun ? fmtDateTime(lastRun.startedAt) : "—"}
          valueClassName="text-lg sm:text-xl"
          icon={Bot}
          hint={lastRun ? <StatusBadge status={lastRun.status} /> : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Panel title="Detección de tendencias en el tiempo" description="Publicaciones analizadas por el agente y tendencias detectadas por mes" className="lg:col-span-3">
          <div className="p-4 pt-6">
            <ChartContainer config={seriesConfig} className="aspect-auto h-[280px] w-full">
              <ComposedChart data={series} margin={{ left: -8, right: 8 }}>
                <defs>
                  <linearGradient id="fillPubs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--color-publicaciones)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--color-publicaciones)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={fmtMonth} tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis yAxisId="pubs" tickLine={false} axisLine={false} width={44} tickFormatter={(v) => fmtNumber(v)} />
                <YAxis yAxisId="trends" orientation="right" tickLine={false} axisLine={false} width={24} allowDecimals={false} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => fmtMonth(String(v))} />} />
                <Area yAxisId="pubs" dataKey="publicaciones" type="monotone" stroke="var(--color-publicaciones)" strokeWidth={2} fill="url(#fillPubs)" />
                <Bar yAxisId="trends" dataKey="tendencias" fill="var(--color-tendencias)" radius={[4, 4, 0, 0]} barSize={14} />
              </ComposedChart>
            </ChartContainer>
          </div>
        </Panel>

        <Panel title="Distribución por categoría" description={`${trends.length} tendencias activas`} className="lg:col-span-2">
          <div className="grid grid-cols-1 items-center gap-2 p-4 sm:grid-cols-[180px_minmax(0,1fr)] lg:grid-cols-1 xl:grid-cols-[170px_minmax(0,1fr)]">
            <ChartContainer config={pieConfig} className="mx-auto aspect-square h-[180px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent nameKey="category" hideLabel />} />
                <Pie data={byCategory} dataKey="total" nameKey="category" innerRadius={52} outerRadius={82} paddingAngle={2} strokeWidth={0}>
                  {byCategory.map((c) => (
                    <Cell key={c.category} fill={CATEGORY_COLOR[c.category]} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="space-y-2">
              {byCategory.map((c) => (
                <li key={c.category} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="size-2.5 shrink-0 rounded-sm" style={{ background: CATEGORY_COLOR[c.category] }} />
                    <span className="truncate text-foreground">{c.category}</span>
                  </span>
                  <span className="font-mono text-xs tabular text-muted-foreground">{c.total}</span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </div>

      <Panel
        title="Últimas tendencias detectadas"
        description="Las 5 detecciones más recientes del agente"
        action={
          <Button asChild variant="ghost" size="sm" className="text-sky">
            <Link to="/tendencias">Ver todas <ArrowRight /></Link>
          </Button>
        }
      >
        <ul className="divide-y">
          {recent.map((t) => (
            <li key={t.id}>
              <Link
                to="/tendencias"
                search={{ id: t.id }}
                className="group grid grid-cols-1 gap-3 px-5 py-4 transition-colors hover:bg-muted/50 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-foreground group-hover:text-primary">{t.title}</p>
                    <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {fmtDate(t.detectedAt)} · {t.sourceName}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 md:justify-end">
                  <CategoryBadge category={t.category} />
                  <HorizonBadge horizon={t.timeHorizon} />
                  <RelevanceMeter value={t.relevanceScore} className="ml-1" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2 border-t px-5 py-3 text-xs text-muted-foreground">
          <CalendarClock className="size-3.5" />
          {fmtNumber(series.reduce((s, p) => s + p.publicaciones, 0))} publicaciones analizadas en los últimos 12 meses
        </div>
      </Panel>
    </div>
  );
}
