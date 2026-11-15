import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowUpDown, ExternalLink, Search, SearchX, X } from "lucide-react";
import { useMemo, useState } from "react";

import { CategoryBadge, HorizonBadge, RelevanceMeter } from "@/components/radar/badges";
import { PageHeader, Panel } from "@/components/radar/page-header";
import { TrendDrawer } from "@/components/radar/trend-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtDate } from "@/lib/radar/format";
import { filterTrends, parseExplorerSearch, sortTrends, type SortDir, type SortField } from "@/lib/radar/stats";
import { cn } from "@/lib/utils";
import { trendsQuery } from "@/services/queries";
import { CATEGORIES, TIME_HORIZONS, type TimeHorizon, type TrendCategory } from "@/services/types";

export const Route = createFileRoute("/tendencias")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { id?: string | undefined; categoria?: TrendCategory | undefined; horizonte?: TimeHorizon | undefined } =>
    parseExplorerSearch(search),
  head: () => ({
    meta: [
      { title: "Explorador de Tendencias · EnergVision" },
      { name: "description", content: "Listado completo de tendencias tecnológicas detectadas, con búsqueda, filtros por categoría y horizonte temporal, y enlace a la fuente original." },
      { property: "og:title", content: "Explorador de Tendencias · EnergVision" },
      { property: "og:description", content: "Buscá y filtrá las tendencias tecnológicas detectadas por el agente." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(trendsQuery),
  component: Explorer,
});

const COLUMNS: { field: SortField; label: string; className?: string }[] = [
  { field: "title", label: "Nombre" },
  { field: "category", label: "Categoría" },
  { field: "timeHorizon", label: "Horizonte" },
  { field: "detectedAt", label: "Fecha" },
  { field: "sourceName", label: "Fuente" },
  { field: "relevanceScore", label: "Relevancia" },
];

function Explorer() {
  const { data: trends } = useSuspenseQuery(trendsQuery);
  const { id, categoria, horizonte } = Route.useSearch();
  const navigate = useNavigate({ from: "/tendencias" });

  const [q, setQ] = useState("");
  // Categoría y horizonte viven en la URL para que el Dashboard pueda abrir el Explorador ya filtrado.
  const category: TrendCategory | "todas" = categoria ?? "todas";
  const horizon: TimeHorizon | "todos" = horizonte ?? "todos";
  const setCategory = (v: TrendCategory | "todas") =>
    navigate({ search: (prev) => ({ ...prev, categoria: v === "todas" ? undefined : v }), replace: true, resetScroll: false });
  const setHorizon = (v: TimeHorizon | "todos") =>
    navigate({ search: (prev) => ({ ...prev, horizonte: v === "todos" ? undefined : v }), replace: true, resetScroll: false });
  const [sort, setSort] = useState<{ field: SortField; dir: SortDir }>({ field: "detectedAt", dir: "desc" });

  const rows = useMemo(
    () => sortTrends(filterTrends(trends, { q, category, horizon }), sort.field, sort.dir),
    [trends, q, category, horizon, sort],
  );
  const selected = trends.find((t) => t.id === id) ?? null;
  const hasFilters = q !== "" || category !== "todas" || horizon !== "todos";

  const open = (trendId: string) => navigate({ search: (prev) => ({ ...prev, id: trendId }), resetScroll: false });
  const close = () => navigate({ search: (prev) => ({ ...prev, id: undefined }), resetScroll: false });

  const toggleSort = (field: SortField) =>
    setSort((s) => (s.field === field ? { field, dir: s.dir === "asc" ? "desc" : "asc" } : { field, dir: field === "title" || field === "sourceName" || field === "category" ? "asc" : "desc" }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Inteligencia tecnológica"
        title="Explorador de Tendencias"
        description="Consultá cada tendencia identificada por el agente, con su clasificación, horizonte temporal y fuente original."
      />

      <Panel>
        <div className="grid grid-cols-1 gap-3 border-b p-4 md:grid-cols-[minmax(0,1fr)_220px_200px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o palabra clave…" className="h-10 pl-9" aria-label="Buscar tendencias" />
          </div>
          <Select value={category} onValueChange={(v) => setCategory(v as TrendCategory | "todas")}>
            <SelectTrigger className="h-10" aria-label="Categoría">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las categorías</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={horizon} onValueChange={(v) => setHorizon(v as TimeHorizon | "todos")}>
            <SelectTrigger className="h-10" aria-label="Horizonte temporal">
              <SelectValue placeholder="Horizonte temporal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los horizontes</SelectItem>
              {TIME_HORIZONS.map((h) => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" className="h-10 text-muted-foreground" disabled={!hasFilters} onClick={() => { setQ(""); navigate({ search: (prev) => ({ ...prev, categoria: undefined, horizonte: undefined }), replace: true, resetScroll: false }); }}>
            <X /> Limpiar
          </Button>
        </div>

        <div className="flex items-center justify-between px-5 py-2.5 text-xs text-muted-foreground">
          <span>
            <span className="font-mono font-medium text-foreground">{rows.length}</span> de {trends.length} tendencias
          </span>
          <span className="hidden sm:inline">Hacé clic en una fila para ver el resumen completo</span>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 border-t px-6 py-16 text-center">
            <SearchX className="size-8 text-muted-foreground" />
            <p className="font-medium text-foreground">Sin resultados</p>
            <p className="text-sm text-muted-foreground">Probá con otra palabra clave o quitá algún filtro.</p>
          </div>
        ) : (
          <>
            {/* Tabla: escritorio */}
            <div className="hidden overflow-x-auto border-t lg:block">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    {COLUMNS.map((c) => (
                      <th key={c.field} className="px-4 py-2.5 text-left first:pl-5">
                        <button onClick={() => toggleSort(c.field)} className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground">
                          {c.label}
                          {sort.field === c.field ? (sort.dir === "asc" ? <ArrowUp className="size-3 text-sky" /> : <ArrowDown className="size-3 text-sky" />) : <ArrowUpDown className="size-3 opacity-40" />}
                        </button>
                      </th>
                    ))}
                    <th className="w-12 px-4 py-2.5"><span className="sr-only">Enlace</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {rows.map((t) => (
                    <tr key={t.id} onClick={() => open(t.id)} className={cn("cursor-pointer transition-colors hover:bg-sky-soft/50", t.id === id && "bg-sky-soft/60")}>
                      <td className="max-w-[340px] py-3 pl-5 pr-4">
                        <p className="truncate font-medium text-foreground">{t.title}</p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{t.summary}</p>
                      </td>
                      <td className="px-4 py-3"><CategoryBadge category={t.category} /></td>
                      <td className="px-4 py-3"><HorizonBadge horizon={t.timeHorizon} /></td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">{fmtDate(t.detectedAt)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-foreground">{t.sourceName}</td>
                      <td className="px-4 py-3"><RelevanceMeter value={t.relevanceScore} /></td>
                      <td className="px-4 py-3">
                        <a href={t.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-card hover:text-sky" aria-label={`Abrir fuente de ${t.title}`}>
                          <ExternalLink className="size-4" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tarjetas: móvil y tablet */}
            <ul className="grid grid-cols-1 gap-3 border-t p-4 sm:grid-cols-2 lg:hidden">
              {rows.map((t) => (
                <li key={t.id}>
                  <button onClick={() => open(t.id)} className="w-full rounded-lg border bg-card p-4 text-left shadow-card transition-colors hover:border-sky">
                    <div className="flex flex-wrap gap-1.5">
                      <CategoryBadge category={t.category} />
                      <HorizonBadge horizon={t.timeHorizon} />
                    </div>
                    <p className="mt-2.5 font-medium leading-snug text-foreground">{t.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{t.summary}</p>
                    <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="min-w-0 truncate">{fmtDate(t.detectedAt)} · {t.sourceName}</span>
                      <RelevanceMeter value={t.relevanceScore} className="shrink-0" />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>

      <TrendDrawer trend={selected} onOpenChange={(o) => !o && close()} />
    </div>
  );
}
