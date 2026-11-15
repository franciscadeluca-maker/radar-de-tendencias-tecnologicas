import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowUpRight, Bot, ChevronRight, Hourglass, Inbox, Layers, Radar, Sparkles } from "lucide-react";
import { Cell, Pie, PieChart } from "recharts";

import { CategoryBadge, HorizonBadge, RelevanceMeter, StatusBadge } from "@/components/radar/badges";
import { KpiCard } from "@/components/radar/kpi-card";
import { PageHeader, Panel } from "@/components/radar/page-header";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtDate, fmtDateTime, fmtNumber } from "@/lib/radar/format";
import { categoryDistribution, detectedThisMonth, detectedWithin, dominantCategory, horizonBreakdown } from "@/lib/radar/stats";
import { logsQuery, trendsQuery } from "@/services/queries";
import { CATEGORY_COLOR } from "@/services/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · EnergVision Radar Tecnológico" },
      { name: "description", content: "Resumen y análisis de la vigilancia tecnológica: tendencias detectadas, distribución por categoría y por horizonte temporal." },
      { property: "og:title", content: "Dashboard · EnergVision Radar Tecnológico" },
      { property: "og:description", content: "Resumen y análisis de las tendencias tecnológicas del sector energético." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(trendsQuery), context.queryClient.ensureQueryData(logsQuery)]),
  pendingMs: 150,
  pendingComponent: DashboardSkeleton,
  component: Dashboard,
});

const HEADER = {
  eyebrow: "Panel de vigilancia",
  title: "Dashboard",
  description: "Resumen y análisis de las tendencias identificadas por el agente de n8n + Gemini.",
};

function Dashboard() {
  const { data: trends } = useSuspenseQuery(trendsQuery);
  const { data: logs } = useSuspenseQuery(logsQuery);
  const navigate = useNavigate();

  // Todas las secciones se calculan a partir de la misma lista `trends`, así los totales siempre coinciden.
  const total = trends.length;
  const now = new Date();
  const weekly = detectedWithin(trends, 7, now);
  const previousWeek = detectedWithin(trends, 14, now).length - weekly.length;
  const thisMonth = detectedThisMonth(trends, now).length;
  const dominant = dominantCategory(trends);
  const lastRun = logs.find((l) => l.status !== "En proceso");
  const byCategory = categoryDistribution(trends);
  const horizons = horizonBreakdown(trends);
  const recent = [...trends].sort((a, b) => b.detectedAt.localeCompare(a.detectedAt)).slice(0, 5);
  const weekDelta = weekly.length - previousWeek;
  const maxHorizon = Math.max(1, ...horizons.map((h) => h.total));

  const pieConfig = Object.fromEntries(byCategory.map((c) => [c.category, { label: c.category, color: CATEGORY_COLOR[c.category] }])) satisfies ChartConfig;

  return (
    <div className="space-y-6">
      <PageHeader
        {...HEADER}
        actions={
          <Button asChild variant="outline">
            <Link to="/tendencias">
              Explorar tendencias <ArrowRight />
            </Link>
          </Button>
        }
      />

      {/* a) Resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Tendencias detectadas" value={fmtNumber(total)} icon={Radar} trend={{ value: `+${thisMonth}`, positive: true }} hint="detectadas este mes" />
        <KpiCard label="Nuevas esta semana" value={weekly.length} icon={Sparkles} trend={{ value: `${weekDelta >= 0 ? "+" : ""}${weekDelta}`, positive: weekDelta >= 0 }} hint="vs. semana anterior" />
        <KpiCard label="Categoría dominante" value={dominant?.category ?? "—"} valueClassName="text-lg leading-snug sm:text-xl" icon={Layers} hint={dominant ? `${dominant.total} tendencias · ${byCategory[0]?.pct ?? 0}% del total` : "Sin datos"} />
        <KpiCard
          label="Última ejecución del agente"
          value={lastRun ? fmtDateTime(lastRun.startedAt) : "—"}
          valueClassName="text-lg sm:text-xl"
          icon={Bot}
          hint={lastRun ? <StatusBadge status={lastRun.status} /> : "Sin ejecuciones registradas"}
        />
      </div>

      {/* b) Distribución por categoría */}
      <Panel title="Distribución por categoría" description={`${fmtNumber(total)} tendencias · tocá una categoría para verla en el Explorador`}>
        {byCategory.length === 0 ? (
          <EmptyState text="Todavía no hay tendencias para clasificar por categoría." />
        ) : (
          <div className="grid grid-cols-1 items-center gap-6 p-5 md:grid-cols-[240px_minmax(0,1fr)] lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10 lg:px-8">
            <div className="relative mx-auto aspect-square w-full max-w-[240px] lg:max-w-[280px]">
              <ChartContainer config={pieConfig} className="aspect-square w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent nameKey="category" hideLabel />} />
                  <Pie
                    data={byCategory}
                    dataKey="total"
                    nameKey="category"
                    innerRadius="62%"
                    outerRadius="100%"
                    paddingAngle={2}
                    strokeWidth={0}
                    className="cursor-pointer"
                    onClick={(d: { category?: string }) => {
                      const c = byCategory.find((x) => x.category === d.category);
                      if (c) navigate({ to: "/tendencias", search: { categoria: c.category } });
                    }}
                  >
                    {byCategory.map((c) => (
                      <Cell key={c.category} fill={CATEGORY_COLOR[c.category]} />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <p className="font-display text-3xl font-semibold tabular text-foreground">{fmtNumber(total)}</p>
                  <p className="text-xs text-muted-foreground">tendencias</p>
                </div>
              </div>
            </div>

            <ul className="grid w-full max-w-2xl grid-cols-1 gap-1.5">
              {byCategory.map((c) => (
                <li key={c.category}>
                  <Link
                    to="/tendencias"
                    search={{ categoria: c.category }}
                    className="group block rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/60"
                    aria-label={`Ver ${c.total} tendencias de ${c.category} en el Explorador`}
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="size-2.5 shrink-0 rounded-sm" style={{ background: CATEGORY_COLOR[c.category] }} />
                        <span className="truncate font-medium text-foreground group-hover:text-primary">{c.category}</span>
                      </span>
                      <span className="flex items-center gap-2 font-mono text-xs tabular">
                        <span className="text-foreground">{c.total}</span>
                        <span className="w-10 text-right text-muted-foreground">{c.pct}%</span>
                        <ChevronRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: CATEGORY_COLOR[c.category] }} />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Panel>

      {/* c) Horizonte temporal */}
      <Panel title="Horizonte temporal" description={`Plazo estimado de impacto de las ${fmtNumber(total)} tendencias, por categoría · tocá un horizonte para filtrar`}>
        {total === 0 ? (
          <EmptyState text="Todavía no hay tendencias con horizonte temporal asignado." />
        ) : (
          <div className="p-5 lg:px-8">
            <ul className="space-y-2">
              {horizons.map((h) => (
                <li key={h.horizon}>
                  <Link
                    to="/tendencias"
                    search={{ horizonte: h.horizon }}
                    className="group grid grid-cols-1 gap-2 rounded-lg px-3 py-3 transition-colors hover:bg-muted/60 sm:grid-cols-[150px_minmax(0,1fr)_auto] sm:items-center sm:gap-4"
                    aria-label={`Ver ${h.total} tendencias de ${h.horizon} en el Explorador`}
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground group-hover:text-primary">
                      <Hourglass className="size-3.5 text-sky" />
                      {h.horizon}
                    </span>
                    <div className="flex h-6 overflow-hidden rounded-md bg-muted">
                      {h.total === 0 ? (
                        <span className="px-2 text-[11px] leading-6 text-muted-foreground">Sin tendencias</span>
                      ) : (
                        h.byCategory.map((c) => (
                          <div
                            key={c.category}
                            className="h-full border-r border-card last:border-r-0"
                            style={{ width: `${(c.total / maxHorizon) * 100}%`, background: CATEGORY_COLOR[c.category] }}
                            title={`${c.category}: ${c.total}`}
                          />
                        ))
                      )}
                    </div>
                    <span className="flex items-center gap-3 font-mono text-xs tabular sm:justify-end">
                      <span className="text-foreground">{h.total}</span>
                      <span className="w-10 text-right text-muted-foreground">{h.pct}%</span>
                      <span className="hidden text-muted-foreground md:inline">Relev. {h.avgRelevance || "—"}</span>
                      <ChevronRight className="size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-t px-3 pt-4">
              {byCategory.map((c) => (
                <span key={c.category} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2 rounded-sm" style={{ background: CATEGORY_COLOR[c.category] }} />
                  {c.category}
                </span>
              ))}
            </div>
          </div>
        )}
      </Panel>

      {/* d) Últimas tendencias */}
      <Panel
        title="Últimas tendencias detectadas"
        description="Las 5 detecciones más recientes del agente"
        action={
          <Button asChild variant="ghost" size="sm" className="text-sky">
            <Link to="/tendencias">Ver todas <ArrowRight /></Link>
          </Button>
        }
      >
        {recent.length === 0 ? (
          <EmptyState text="El agente todavía no detectó tendencias. Ejecutá una búsqueda desde Actualizaciones." />
        ) : (
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
                    <p className="mt-0.5 font-mono text-xs text-muted-foreground">{fmtDate(t.detectedAt)}</p>
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
        )}
      </Panel>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <Inbox className="size-8 text-muted-foreground" />
      <p className="font-medium text-foreground">Sin datos todavía</p>
      <p className="max-w-sm text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando dashboard">
      <PageHeader {...HEADER} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-xl border bg-card p-5 shadow-card">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="mt-4 h-8 w-20" />
            <Skeleton className="mt-3 h-3 w-32" />
          </div>
        ))}
      </div>
      <Panel title="Distribución por categoría">
        <div className="grid grid-cols-1 items-center gap-6 p-5 md:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
          <Skeleton className="mx-auto aspect-square w-full max-w-[240px] rounded-full" />
          <div className="space-y-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </div>
      </Panel>
      <Panel title="Horizonte temporal">
        <div className="space-y-3 p-5 lg:px-8">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </Panel>
      <Panel title="Últimas tendencias detectadas">
        <div className="divide-y">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="space-y-2 px-5 py-4">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
