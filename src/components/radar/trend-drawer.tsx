import { CalendarDays, ExternalLink, Gauge, Hourglass, Sparkles, Tag } from "lucide-react";

import { CategoryBadge, HorizonBadge } from "@/components/radar/badges";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { fmtDateTime } from "@/lib/radar/format";
import type { Trend } from "@/services/types";

export function TrendDrawer({ trend, onOpenChange }: { trend: Trend | null; onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={!!trend} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-lg">
        {trend && (
          <>
            <SheetHeader className="space-y-3 border-b bg-grid px-6 pb-5 pt-6 text-left">
              <div className="flex flex-wrap items-center gap-2 pr-8">
                <CategoryBadge category={trend.category} />
                <HorizonBadge horizon={trend.timeHorizon} />
              </div>
              <SheetTitle className="font-display text-xl leading-snug text-foreground">{trend.title}</SheetTitle>
              <SheetDescription className="font-mono text-xs text-muted-foreground">ID {trend.id}</SheetDescription>
            </SheetHeader>

            <div className="flex-1 space-y-6 px-6 py-6">
              <section>
                <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky">
                  <Sparkles className="size-3.5" /> Resumen ejecutivo · Gemini
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground">{trend.summary}</p>
                {trend.insights && trend.insights.length > 0 && (
                  <ul className="mt-4 space-y-2">
                    {trend.insights.map((i) => (
                      <li key={i} className="flex gap-2.5 text-sm text-foreground">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-sky" />
                        {i}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="rounded-lg border bg-muted/40 p-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Gauge className="size-3.5" /> Índice de relevancia
                  </span>
                  <span className="font-display text-2xl font-semibold tabular text-primary">
                    {trend.relevanceScore}
                    <span className="text-sm text-muted-foreground">/100</span>
                  </span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-border">
                  <div className="h-full rounded-full bg-gradient-sky" style={{ width: `${trend.relevanceScore}%` }} />
                </div>
              </section>

              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
                <Meta icon={CalendarDays} label="Detectada" value={fmtDateTime(trend.detectedAt)} />
                <Meta icon={Hourglass} label="Horizonte temporal" value={trend.timeHorizon} />
                <Meta icon={ExternalLink} label="Fuente" value={trend.sourceName} />
                {trend.keywords && trend.keywords.length > 0 && (
                  <Meta icon={Tag} label="Palabras clave" value={trend.keywords.join(", ")} />
                )}
              </dl>
            </div>

            <div className="sticky bottom-0 border-t bg-card px-6 py-4">
              <Button asChild variant="sky" size="xl" className="w-full">
                <a href={trend.sourceUrl} target="_blank" rel="noopener noreferrer">
                  Abrir fuente original <ExternalLink />
                </a>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Meta({ icon: Icon, label, value }: { icon: typeof Tag; label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" /> {label}
      </dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}
