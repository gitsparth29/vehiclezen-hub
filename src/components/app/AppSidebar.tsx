import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Truck,
  FileText,
  Wrench,
  Settings2,
  Users,
  Fuel,
  CalendarRange,
  Route as RouteIcon,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  ChevronsLeft,
  Gauge,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { signOutCleanly } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/vehicles", label: "Vehicles", icon: Truck },
  { to: "/documents", label: "Documents", icon: FileText },
  { to: "/services", label: "Services", icon: Wrench },
  { to: "/maintenance", label: "Maintenance", icon: Settings2 },
  { to: "/drivers", label: "Drivers", icon: Users },
  { to: "/fuel-logs", label: "Fuel Logs", icon: Fuel },
  { to: "/rentals", label: "Rentals", icon: CalendarRange },
  { to: "/trip-logs", label: "Trip Logs", icon: RouteIcon },
  { to: "/alerts", label: "Alerts", icon: Bell },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const queryClient = useQueryClient();
  const router = useRouter();

  async function handleSignOut() {
    try {
      await signOutCleanly(queryClient, router);
      toast.success("Signed out");
    } catch (e) {
      toast.error("Failed to sign out");
    }
  }

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-surface md:flex transition-[width] duration-200",
        sidebarCollapsed ? "w-[68px]" : "w-[240px]",
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-soft">
          <Gauge className="size-5" />
        </div>
        {!sidebarCollapsed && (
          <span className="truncate text-lg font-bold tracking-tight">FleetPilot</span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.to || pathname.startsWith(item.to + "/");
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    sidebarCollapsed && "justify-center px-2",
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="size-4 shrink-0" />
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t p-2 space-y-1">
        <button
          onClick={handleSignOut}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive",
            sidebarCollapsed && "justify-center px-2",
          )}
          title={sidebarCollapsed ? "Logout" : undefined}
        >
          <LogOut className="size-4 shrink-0" />
          {!sidebarCollapsed && <span>Logout</span>}
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground",
            sidebarCollapsed && "justify-center px-2",
          )}
        >
          <ChevronsLeft
            className={cn(
              "size-4 shrink-0 transition-transform",
              sidebarCollapsed && "rotate-180",
            )}
          />
          {!sidebarCollapsed && <span>Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}
