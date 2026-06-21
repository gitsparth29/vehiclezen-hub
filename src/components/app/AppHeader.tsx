import { useRouterState } from "@tanstack/react-router";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/vehicles": "Vehicles",
  "/documents": "Documents",
  "/services": "Services",
  "/maintenance": "Maintenance",
  "/drivers": "Drivers",
  "/fuel-logs": "Fuel Logs",
  "/rentals": "Rentals",
  "/trip-logs": "Trip Logs",
  "/alerts": "Alerts",
  "/reports": "Reports & Analytics",
  "/settings": "Settings",
};

export function AppHeader() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const title = titles[pathname] ?? "FleetPilot";

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-6">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">
          {title}
        </h1>
      </div>

      <div className="relative hidden md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search vehicles, drivers…"
          className="h-9 w-[280px] pl-9"
        />
      </div>

      <Button variant="ghost" size="icon" aria-label="Notifications">
        <Bell className="size-4" />
      </Button>
      <ThemeToggle />
      <UserMenu />
    </header>
  );
}
