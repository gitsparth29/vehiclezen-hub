import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileWarning,
  Wrench,
  Plus,
  Truck,
} from "lucide-react";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { HealthGauge } from "@/components/dashboard/HealthGauge";
import { CostBarChart, type CostPoint } from "@/components/dashboard/CostBarChart";
import { FleetStatusDonut } from "@/components/dashboard/FleetStatusDonut";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { format, subMonths, startOfMonth } from "date-fns";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

interface DashboardData {
  vehicles: { id: string; status: "fit" | "service_due" | "maintenance" | "inactive" }[];
  expiredDocs: number;
  costPoints: CostPoint[];
}

async function fetchDashboard(): Promise<DashboardData> {
  const today = new Date().toISOString().slice(0, 10);
  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5)).toISOString().slice(0, 10);

  const [vehiclesRes, docsRes, servicesRes, fuelRes] = await Promise.all([
    supabase.from("vehicles").select("id,status"),
    supabase.from("documents").select("id", { count: "exact", head: true }).lt("expiry_date", today),
    supabase.from("services").select("service_date,cost").gte("service_date", sixMonthsAgo),
    supabase.from("fuel_logs").select("log_date,total_cost").gte("log_date", sixMonthsAgo),
  ]);

  if (vehiclesRes.error) throw vehiclesRes.error;

  // Build monthly cost points
  const buckets = new Map<string, { service: number; fuel: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    buckets.set(format(d, "yyyy-MM"), { service: 0, fuel: 0 });
  }
  for (const row of servicesRes.data ?? []) {
    const key = format(new Date(row.service_date), "yyyy-MM");
    const b = buckets.get(key);
    if (b) b.service += Number(row.cost ?? 0);
  }
  for (const row of fuelRes.data ?? []) {
    const key = format(new Date(row.log_date), "yyyy-MM");
    const b = buckets.get(key);
    if (b) b.fuel += Number(row.total_cost ?? 0);
  }
  const costPoints: CostPoint[] = Array.from(buckets.entries()).map(([k, v]) => ({
    month: format(new Date(k + "-01"), "MMM"),
    service: Math.round(v.service),
    fuel: Math.round(v.fuel),
  }));

  return {
    vehicles: (vehiclesRes.data ?? []) as DashboardData["vehicles"],
    expiredDocs: docsRes.count ?? 0,
    costPoints,
  };
}

function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
  });

  if (isLoading) return <DashboardSkeleton />;

  const vehicles = data?.vehicles ?? [];
  const counts = {
    fit: vehicles.filter((v) => v.status === "fit").length,
    service_due: vehicles.filter((v) => v.status === "service_due").length,
    maintenance: vehicles.filter((v) => v.status === "maintenance").length,
    inactive: vehicles.filter((v) => v.status === "inactive").length,
  };
  const total = vehicles.length;
  const health = total === 0 ? 0 : Math.round((counts.fit / total) * 100);
  const totalCost = (data?.costPoints ?? []).reduce((s, p) => s + p.service + p.fuel, 0);

  if (total === 0) return <EmptyFleet />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        <KpiCard label="Fleet Health" value={`${health}%`} icon={Activity} tone="primary" />
        <KpiCard label="Fit Vehicles" value={counts.fit} icon={CheckCircle2} tone="success" />
        <KpiCard label="Service Due" value={counts.service_due} icon={AlertTriangle} tone="warning" />
        <KpiCard label="Expired Docs" value={data?.expiredDocs ?? 0} icon={FileWarning} tone="destructive" />
        <KpiCard label="In Maintenance" value={counts.maintenance} icon={Wrench} tone="default" hint={`${total} total vehicles`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <HealthGauge score={health} />
        <div className="lg:col-span-2">
          <CostBarChart data={data?.costPoints ?? []} />
          <div className="mt-2 text-xs text-muted-foreground">
            Total operating cost (last 6 months):{" "}
            <span className="font-semibold text-foreground">{formatCurrency(totalCost)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <FleetStatusDonut
          data={[
            { name: "Fit", value: counts.fit, color: "var(--success)" },
            { name: "Service Due", value: counts.service_due, color: "var(--warning)" },
            { name: "Maintenance", value: counts.maintenance, color: "var(--primary)" },
            { name: "Inactive", value: counts.inactive, color: "var(--muted-foreground)" },
          ]}
        />
        <Card className="p-5 shadow-soft lg:col-span-2">
          <div className="text-sm font-semibold">Quick actions</div>
          <div className="mt-1 text-xs text-muted-foreground">
            Jump into the modules you use most.
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
            {[
              { to: "/vehicles", label: "Add vehicle", icon: Truck },
              { to: "/drivers", label: "Add driver", icon: Plus },
              { to: "/documents", label: "Upload document", icon: FileWarning },
              { to: "/services", label: "Log service", icon: Wrench },
              { to: "/fuel-logs", label: "Log fuel", icon: Plus },
              { to: "/alerts", label: "View alerts", icon: AlertTriangle },
            ].map((a) => (
              <Button key={a.to} asChild variant="outline" className="justify-start gap-2 h-11">
                <Link to={a.to}>
                  <a.icon className="size-4" /> {a.label}
                </Link>
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-[112px] rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[280px] rounded-xl" />
        <Skeleton className="h-[280px] rounded-xl lg:col-span-2" />
      </div>
    </div>
  );
}

function EmptyFleet() {
  return (
    <Card className="mx-auto max-w-xl p-10 text-center shadow-soft">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Truck className="size-7" />
      </div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight">Welcome to FleetPilot</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Your dashboard will light up as soon as you add your first vehicle. We'll
        track health, expiries and costs automatically from there.
      </p>
      <Button asChild className="mt-6">
        <Link to="/vehicles">
          <Plus className="mr-2 size-4" /> Add your first vehicle
        </Link>
      </Button>
    </Card>
  );
}
