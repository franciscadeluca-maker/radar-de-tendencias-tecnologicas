import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, LayoutDashboard, RefreshCw, Telescope } from "lucide-react";

import { BrandMark, BrandWordmark } from "@/components/radar/brand";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { fmtDateTime } from "@/lib/radar/format";
import { agentStatusQuery, logsQuery } from "@/services/queries";

const NAV = [
  { title: "Dashboard", to: "/", icon: LayoutDashboard },
  { title: "Explorador de Tendencias", to: "/tendencias", icon: Telescope },
  { title: "Actualizaciones", to: "/actualizaciones", icon: RefreshCw },
] as const;

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { data: status } = useQuery(agentStatusQuery);
  const { data: logs } = useQuery(logsQuery);
  const last = logs?.find((l) => l.status !== "En proceso");
  const running = logs?.some((l) => l.status === "En proceso");

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2.5">
          <BrandMark />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <BrandWordmark className="text-sidebar-accent-foreground" />
              <p className="truncate text-[11px] text-sidebar-foreground/70">Radar Tecnológico</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/50">
            Vigilancia
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {NAV.map((item) => {
                const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                return (
                  <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.title}
                    className="h-10 text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-[inset_3px_0_0_var(--sidebar-primary)]"
                  >
                    <Link to={item.to} onClick={() => isMobile && setOpenMobile(false)}>
                      <item.icon className={active ? "text-sidebar-primary" : ""} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {collapsed ? (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={`Agente ${running ? "procesando" : (status?.state ?? "")}`} className="text-sidebar-primary">
                <Link to="/actualizaciones">
                  <Activity />
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        ) : (
          <Link to="/actualizaciones" className="block rounded-lg border border-sidebar-border bg-sidebar-accent/60 p-3 transition-colors hover:bg-sidebar-accent">
            <div className="flex items-center gap-2">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-sidebar-primary opacity-60" />
                <span className="relative inline-flex size-2 rounded-full bg-sidebar-primary" />
              </span>
              <span className="text-xs font-semibold text-sidebar-accent-foreground">
                Agente {running ? "procesando…" : (status?.state ?? "—")}
              </span>
            </div>
            <p className="mt-1.5 text-[11px] leading-snug text-sidebar-foreground/70">
              n8n + {status?.model ?? "Gemini"}
            </p>
            {last && <p className="mt-0.5 font-mono text-[10px] text-sidebar-foreground/60">Última: {fmtDateTime(last.startedAt)}</p>}
          </Link>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
