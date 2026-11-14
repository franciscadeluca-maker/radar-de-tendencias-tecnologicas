import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-sky">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold text-foreground sm:text-[1.7rem]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, description, action, children, className = "" }: { title?: string; description?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border bg-card shadow-card ${className}`}>
      {(title || action) && (
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="text-[0.95rem] font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
          </div>
          {action}
        </header>
      )}
      {children}
    </section>
  );
}
