import icono from "@/assets/energvision-icono.png.asset.json";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <div className={cn("grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-sidebar-foreground/95 ring-1 ring-sidebar-primary/40", className)}>
      <img src={icono.url} alt="" className="size-9 object-cover" />
    </div>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-display text-lg font-bold tracking-tight", className)}>
      Energ<span className="text-sidebar-primary">Vision</span>
    </span>
  );
}
