import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CATEGORY_COLOR, type ExecutionStatus, type TimeHorizon, type TrendCategory } from "@/services/types";

export function CategoryBadge({ category, className }: { category: TrendCategory; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border bg-card px-2 py-0.5 text-xs font-medium text-foreground", className)}>
      <span className="size-2 shrink-0 rounded-full" style={{ background: CATEGORY_COLOR[category] }} />
      {category}
    </span>
  );
}

const HORIZON_VARIANT: Record<TimeHorizon, "sky" | "navy" | "muted"> = {
  "Corto Plazo": "sky",
  "Mediano Plazo": "navy",
  "Largo Plazo": "muted",
};

export function HorizonBadge({ horizon }: { horizon: TimeHorizon }) {
  return (
    <Badge variant={HORIZON_VARIANT[horizon]} className="whitespace-nowrap font-medium">
      {horizon}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: ExecutionStatus }) {
  if (status === "Completado")
    return (
      <Badge variant="success" className="gap-1 font-medium">
        <CheckCircle2 className="size-3" /> Completado
      </Badge>
    );
  if (status === "En proceso")
    return (
      <Badge variant="sky" className="gap-1 font-medium">
        <Loader2 className="size-3 animate-spin" /> En proceso
      </Badge>
    );
  return (
    <Badge variant="danger" className="gap-1 font-medium">
      <XCircle className="size-3" /> Error
    </Badge>
  );
}

export function RelevanceMeter({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-gradient-sky" style={{ width: `${value}%` }} />
      </div>
      <span className="font-mono text-xs tabular text-foreground">{value}</span>
    </div>
  );
}
