import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarClock, Clock, Cpu, Database, Loader2, Play, Timer, Webhook } from "lucide-react";
import { useState } from "react";

import mascota from "@/assets/energvision-mascota.png.asset.json";
import { StatusBadge } from "@/components/radar/badges";
import { KpiCard } from "@/components/radar/kpi-card";
import { PageHeader, Panel } from "@/components/radar/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRunSearch } from "@/hooks/use-agent";
import { fmtDateTime, fmtDuration } from "@/lib/radar/format";
import { isLiveMode } from "@/services/n8nService";
import { agentStatusQuery, logsQuery } from "@/services/queries";

export const Route = createFileRoute("/actualizaciones")({
  head: () => ({
    meta: [
      { title: "Actualizaciones del agente · EnergVision" },
      { name: "description", content: "Estado del flujo n8n + Gemini, última ejecución del agente, historial de búsquedas y solicitud de una nueva búsqueda." },
      { property: "og:title", content: "Actualizaciones del agente · EnergVision" },
      { property: "og:description", content: "Controlá el agente de vigilancia tecnológica y consultá su historial de ejecuciones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) =>
    Promise.all([context.queryClient.ensureQueryData(logsQuery), context.queryClient.ensureQueryData(agentStatusQuery)]),
  component: Updates,
});

function Updates() {
  const { data: logs } = useSuspenseQuery(logsQuery);
  const { data: status } = useSuspenseQuery(agentStatusQuery);
  const run = useRunSearch();
  const [query, setQuery] = useState("");

  const finished = logs.filter((l) => l.status !== "En proceso");
  const last = finished[0];
  const ok = finished.filter((l) => l.status === "Completado");
  const successRate = finished.length ? Math.round((ok.length / finished.length) * 100) : 0;
  const avgDuration = ok.length ? Math.round(ok.reduce((s, l) => s + l.durationSeconds, 0) / ok.length) : 0;
  const totalNew = finished.reduce((s, l) => s + l.newTrends, 0);
  const busy = run.isPending;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Control del agente n8n" title="Actualizaciones" description="Consultá el estado del flujo de vigilancia y solicitá una nueva búsqueda cuando lo necesites." />

      <section className="relative overflow-hidden rounded-xl border bg-card shadow-card">
        <div className="absolute inset-0 bg-grid opacity-70" />
        <div className="relative grid grid-cols-1 gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex min-w-0 gap-5">
            <div className="relative hidden size-28 shrink-0 sm:block">
              <div className="absolute inset-2 rounded-full bg-sky-soft" />
              {busy && <div className="absolute inset-0 rounded-full border-2 border-dashed border-sky animate-radar" />}
              <img src={mascota.url} alt="Mascota del agente EnergVision" className="relative size-28 object-contain" />
            </div>
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-foreground">{status.workflowName}</h2>
                {busy ? (
                  <Badge variant="sky" className="gap-1.5"><Loader2 className="size-3 animate-spin" /> Procesando</Badge>
                ) : (
                  <Badge variant={status.state === "Activo" ? "success" : "muted"} className="gap-1.5">
                    <span className="size-1.5 rounded-full bg-current animate-pulse-dot" /> {status.state}
                  </Badge>
                )}
              </div>
              <dl className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                <Meta icon={CalendarClock} label="Última ejecución" value={last ? fmtDateTime(last.startedAt) : "—"} />
                <Meta icon={Clock} label="Programación" value={status.schedule} />
                <Meta icon={Cpu} label="Modelo de análisis" value={status.model} />
                <Meta icon={Database} label="Fuentes configuradas" value={`${status.sourcesConfigured} fuentes`} />
              </dl>
            </div>
          </div>

          <form
            className="flex w-full flex-col gap-2 lg:w-80"
            onSubmit={(e) => {
              e.preventDefault();
              run.mutate(query.trim() || undefined);
            }}
          >
            <label htmlFor="consulta" className="text-xs font-medium text-muted-foreground">Enfoque de la búsqueda (opcional)</label>
            <Input id="consulta" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ej.: almacenamiento de larga duración" maxLength={200} disabled={busy} className="h-10 bg-card" />
            <Button type="submit" variant="sky" size="xl" disabled={busy} className="w-full">
              {busy ? <><Loader2 className="animate-spin" /> Analizando fuentes con Gemini...</> : <><Play /> Ejecutar Nueva Búsqueda</>}
            </Button>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Webhook className="size-3" />
              {isLiveMode() ? "Se enviará al webhook de n8n configurado." : "Modo demostración: la búsqueda es simulada."}
            </p>
          </form>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="Tasa de éxito" value={`${successRate}%`} icon={Cpu} hint={`${ok.length} de ${finished.length} ejecuciones`} />
        <KpiCard label="Duración promedio" value={fmtDuration(avgDuration)} icon={Timer} hint="ejecuciones completadas" valueClassName="text-2xl" />
        <KpiCard label="Tendencias nuevas" value={totalNew} icon={CalendarClock} hint="en el historial reciente" />
      </div>

      <Panel title="Historial de ejecuciones" description="Registro de las búsquedas programadas y manuales del agente">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="py-2.5 pl-5 pr-4">Fecha y hora</th>
                <th className="px-4 py-2.5">Estado</th>
                <th className="px-4 py-2.5">Disparador</th>
                <th className="px-4 py-2.5 text-right">Fuentes</th>
                <th className="px-4 py-2.5 text-right">Nuevas</th>
                <th className="px-4 py-2.5 pr-5 text-right">Duración</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((l) => (
                <tr key={l.id} className={l.status === "En proceso" ? "bg-sky-soft/50" : "hover:bg-muted/40"}>
                  <td className="py-3 pl-5 pr-4">
                    <p className="font-mono text-xs text-foreground">{fmtDateTime(l.startedAt)}</p>
                    {l.errorMessage && <p className="mt-0.5 text-xs text-destructive">{l.errorMessage}</p>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={l.status} /></td>
                  <td className="px-4 py-3 text-muted-foreground">{l.trigger}</td>
                  <td className="px-4 py-3 text-right font-mono tabular">{l.status === "En proceso" ? "—" : l.sourcesScanned}</td>
                  <td className="px-4 py-3 text-right font-mono tabular">
                    {l.status === "En proceso" ? "—" : l.newTrends > 0 ? <span className="font-semibold text-sky">+{l.newTrends}</span> : 0}
                  </td>
                  <td className="px-4 py-3 pr-5 text-right font-mono text-xs tabular text-muted-foreground">{l.status === "En proceso" ? "…" : fmtDuration(l.durationSeconds)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="divide-y md:hidden">
          {logs.map((l) => (
            <li key={l.id} className="space-y-2 px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-foreground">{fmtDateTime(l.startedAt)}</span>
                <StatusBadge status={l.status} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <span>Fuentes: <b className="font-mono text-foreground">{l.sourcesScanned}</b></span>
                <span>Nuevas: <b className="font-mono text-foreground">{l.newTrends}</b></span>
                <span>{fmtDuration(l.durationSeconds)}</span>
              </div>
              {l.errorMessage && <p className="text-xs text-destructive">{l.errorMessage}</p>}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-sky" />
      <div className="min-w-0">
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="font-medium text-foreground">{value}</dd>
      </div>
    </div>
  );
}
