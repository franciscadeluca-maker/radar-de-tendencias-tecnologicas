import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function KpiCard({ label, value, icon: Icon, hint, trend, valueClassName }: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  hint?: ReactNode;
  trend?: { value: string; positive?: boolean };
  valueClassName?: string;
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border bg-card p-5 shadow-card transition-shadow hover:shadow-elevated">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-sky-soft text-sky">
          <Icon className="size-4" />
        </div>
      </div>
      <div className={cn("mt-3 font-display text-3xl font-semibold tabular text-foreground", valueClassName)}>{value}</div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {trend && (
          <span className={cn("rounded px-1.5 py-0.5 font-mono font-medium", trend.positive === false ? "bg-destructive-soft text-destructive" : "bg-success-soft text-success")}>
            {trend.value}
          </span>
        )}
        {hint}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 bg-gradient-sky transition-transform duration-300 group-hover:scale-x-100" />
    </div>
  );
}
