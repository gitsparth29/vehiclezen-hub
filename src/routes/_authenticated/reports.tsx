import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from "recharts";
import { format, subMonths, startOfMonth } from "date-fns";
import { formatCurrency, formatNumber } from "@/lib/format";
import { exportToCsv } from "@/lib/csv";

export const Route = createFileRoute("/_authenticated/reports")({
  component: ReportsPage,
});

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2, 220 70% 50%))", "hsl(var(--chart-3, 160 60% 45%))", "hsl(var(--chart-4, 30 80% 55%))", "hsl(var(--chart-5, 280 65% 60%))"];

async function fetchReports() {
  const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5)).toISOString().slice(0, 10);
  const [services, fuel, maint, trips, drivers, vehicles] = await Promise.all([
    supabase.from("services").select("service_date,cost,service_type").gte("service_date", sixMonthsAgo),
    supabase.from("fuel_logs").select("log_date,total_cost,liters,vehicle_id").gte("log_date", sixMonthsAgo),
    supabase.from("maintenance").select("cost,status,priority"),
    supabase.from("trip_logs").select("distance_km,driver_id"),
    supabase.from("drivers").select("id,first_name,last_name"),
    supabase.from("vehicles").select("id,make,model,registration_number,status"),
  ]);

  // Monthly cost trend
  const buckets = new Map<string, { month: string; services: number; fuel: number; maintenance: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    const key = format(d, "yyyy-MM");
    buckets.set(key, { month: format(d, "MMM"), services: 0, fuel: 0, maintenance: 0 });
  }
  services.data?.forEach((s: any) => {
    const k = (s.service_date as string).slice(0, 7);
    const b = buckets.get(k); if (b) b.services += Number(s.cost || 0);
  });
  fuel.data?.forEach((f: any) => {
    const k = (f.log_date as string).slice(0, 7);
    const b = buckets.get(k); if (b) b.fuel += Number(f.total_cost || 0);
  });
  const monthlyTrend = Array.from(buckets.values());

  // Cost by category
  const catMap = new Map<string, number>();
  services.data?.forEach((s: any) => {
    const k = String(s.service_type || "other");
    catMap.set(k, (catMap.get(k) || 0) + Number(s.cost || 0));
  });
  const costByCategory = Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));

  // Fuel consumption per vehicle
  const fuelPerVehicle = new Map<string, number>();
  fuel.data?.forEach((f: any) => {
    fuelPerVehicle.set(f.vehicle_id, (fuelPerVehicle.get(f.vehicle_id) || 0) + Number(f.liters || 0));
  });
  const fuelChart = Array.from(fuelPerVehicle.entries())
    .map(([vid, liters]) => {
      const v = vehicles.data?.find((x: any) => x.id === vid);
      return { vehicle: v ? `${v.registration_number}` : "—", liters: Math.round(liters) };
    })
    .sort((a, b) => b.liters - a.liters).slice(0, 8);

  // Driver performance
  const driverKm = new Map<string, number>();
  trips.data?.forEach((t: any) => {
    if (!t.driver_id) return;
    driverKm.set(t.driver_id, (driverKm.get(t.driver_id) || 0) + Number(t.distance_km || 0));
  });
  const driverPerf = Array.from(driverKm.entries()).map(([did, km]) => {
    const d = drivers.data?.find((x: any) => x.id === did);
    return {
      name: d ? `${d.first_name} ${d.last_name}` : "Unknown",
      trips: trips.data?.filter((t: any) => t.driver_id === did).length || 0,
      distance: Math.round(km),
    };
  }).sort((a, b) => b.distance - a.distance);

  // Totals
  const totalServiceCost = services.data?.reduce((a: number, s: any) => a + Number(s.cost || 0), 0) || 0;
  const totalFuelCost = fuel.data?.reduce((a: number, f: any) => a + Number(f.total_cost || 0), 0) || 0;
  const totalMaintCost = maint.data?.reduce((a: number, m: any) => a + Number(m.cost || 0), 0) || 0;

  // Vehicle status distribution
  const statusMap = new Map<string, number>();
  vehicles.data?.forEach((v: any) => {
    statusMap.set(v.status, (statusMap.get(v.status) || 0) + 1);
  });
  const statusChart = Array.from(statusMap.entries()).map(([name, value]) => ({ name, value }));

  return {
    monthlyTrend, costByCategory, fuelChart, driverPerf,
    statusChart, totalServiceCost, totalFuelCost, totalMaintCost,
    totalVehicles: vehicles.data?.length || 0,
  };
}

function ReportsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["reports"], queryFn: fetchReports });

  if (isLoading || !data) {
    return <div className="space-y-4"><Skeleton className="h-8 w-64" /><div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-32" /><Skeleton className="h-32" /><Skeleton className="h-32" /></div><Skeleton className="h-80" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Last 6 months of fleet activity</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => exportToCsv("driver-performance.csv", data.driverPerf)}>
          <Download className="mr-2 size-4" /> Export Drivers CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Total Fleet</p><p className="mt-1 text-2xl font-semibold">{formatNumber(data.totalVehicles)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Service Costs</p><p className="mt-1 text-2xl font-semibold">{formatCurrency(data.totalServiceCost)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Fuel Costs</p><p className="mt-1 text-2xl font-semibold">{formatCurrency(data.totalFuelCost)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Maintenance</p><p className="mt-1 text-2xl font-semibold">{formatCurrency(data.totalMaintCost)}</p></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-4 text-sm font-medium">Monthly Cost Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
              <Line type="monotone" dataKey="services" stroke={COLORS[0]} />
              <Line type="monotone" dataKey="fuel" stroke={COLORS[1]} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="mb-4 text-sm font-medium">Service Cost by Category</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.costByCategory} dataKey="value" nameKey="name" outerRadius={90} label>
                {data.costByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="mb-4 text-sm font-medium">Top Fuel Consumers (Liters)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.fuelChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="vehicle" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Bar dataKey="liters" fill={COLORS[2]} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="mb-4 text-sm font-medium">Fleet Status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.statusChart} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} label>
                {data.statusChart.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="mb-4 text-sm font-medium">Driver Performance</h3>
        {data.driverPerf.length === 0 ? (
          <p className="text-sm text-muted-foreground">No trip data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="pb-2">Driver</th><th className="pb-2">Trips</th><th className="pb-2">Distance (km)</th></tr>
              </thead>
              <tbody>
                {data.driverPerf.map((d, i) => (
                  <tr key={i} className="border-t border-border/60">
                    <td className="py-2 font-medium">{d.name}</td>
                    <td className="py-2">{d.trips}</td>
                    <td className="py-2">{formatNumber(d.distance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
