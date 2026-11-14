import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AppSidebar } from "@/components/radar/app-sidebar";
import { BrandMark } from "@/components/radar/brand";
import { Badge } from "@/components/ui/badge";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isLiveMode } from "@/services/n8nService";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <p className="font-mono text-sm text-sky">Error 404</p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">Página no encontrada</h1>
        <p className="mt-2 text-sm text-muted-foreground">La sección que buscás no existe o fue movida.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Volver al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">No se pudo cargar la página</h1>
        <p className="mt-2 text-sm text-muted-foreground">Ocurrió un error. Podés reintentar o volver al inicio.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Reintentar
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EnergVision · Radar Tecnológico" },
      { name: "description", content: "Plataforma de vigilancia e inteligencia tecnológica para el sector energético." },
      { property: "og:title", content: "EnergVision · Radar Tecnológico" },
      { property: "og:description", content: "Plataforma de vigilancia e inteligencia tecnológica para el sector energético." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={150}>
        <SidebarProvider>
          <div className="flex min-h-screen w-full">
            <AppSidebar />
            <SidebarInset>
              <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur sm:px-6">
                <SidebarTrigger className="-ml-1 text-muted-foreground" />
                <div className="flex items-center gap-2 md:hidden">
                  <BrandMark className="size-7 rounded-md" />
                  <span className="font-display text-sm font-bold text-primary">
                    Energ<span className="text-sky">Vision</span>
                  </span>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {isLiveMode() ? (
                    <Badge variant="success" className="font-mono text-[10px] uppercase tracking-wider">Conectado a n8n</Badge>
                  ) : (
                    <Badge variant="warning" className="font-mono text-[10px] uppercase tracking-wider">Datos de ejemplo</Badge>
                  )}
                </div>
              </header>
              <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
                <Outlet />
              </main>
            </SidebarInset>
          </div>
        </SidebarProvider>
        <Toaster position="bottom-right" richColors closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
