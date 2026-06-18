import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Truck,
  CircleCheck,
  Clock,
  AlertTriangle,
  Wrench,
  Gauge,
  FileWarning,
  Calendar,
  ArrowUpRight,
  Search,
  Filter,
  Bell,
  ShieldCheck,
  TrendingUp,
  MapPin,
} from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Fleet Health Dashboard — FleetPilot" },
      {
        name: "description",
        content:
          "Real-time fleet health: fit vs unfit vehicles, upcoming document and service expiries, and cost overview.",
      },
    ],
  }),
  component: DashboardPage,
});

// ---------- Mock data (replace with server fns once Cloud is wired) ----------

type VehicleStatus = "fit" | "service_due" | "expired" | "maintenance";

interface Vehicle {
  id: string;
  reg: string;
  make: string;
  model: string;
  type: string;
  status: VehicleStatus;
  health: number;
  driver: string;
  odometer: number;
  nextEvent: string;
  nextDays: number;
}

interface Expiry {
  id: string;
  vehicleReg: string;
  type: string;
  category: "document" | "service" | "license";
  expiresIn: number; // days, negative = expired
  date: string;
}

const VEHICLES: Vehicle[] = [
  { id: "1", reg: "MH-12-AB-3401", make: "Tata", model: "Ace", type: "Mini Truck", status: "expired", health: 42, driver: "R. Sharma", odometer: 84210, nextEvent: "Insurance expired", nextDays: -2 },
  { id: "2", reg: "DL-3C-XY-7820", make: "Mahindra", model: "Bolero", type: "Pickup", status: "service_due", health: 68, driver: "A. Khan", odometer: 142100, nextEvent: "Service due", nextDays: 7 },
  { id: "3", reg: "KA-05-MN-1188", make: "Ashok Leyland", model: "Dost", type: "LCV", status: "service_due", health: 71, driver: "S. Iyer", odometer: 98700, nextEvent: "License renewal", nextDays: 12 },
  { id: "4", reg: "GJ-01-QR-9912", make: "Tata", model: "Prima", type: "Heavy Truck", status: "maintenance", health: 55, driver: "—", odometer: 312800, nextEvent: "In workshop", nextDays: 0 },
  { id: "5", reg: "TN-22-PL-4503", make: "Eicher", model: "Pro 2049", type: "Truck", status: "fit", health: 96, driver: "M. Pillai", odometer: 56400, nextEvent: "All clear", nextDays: 84 },
  { id: "6", reg: "HR-26-FG-2210", make: "Maruti", model: "Eeco", type: "Van", status: "fit", health: 92, driver: "P. Gupta", odometer: 41200, nextEvent: "Service in 60d", nextDays: 60 },
  { id: "7", reg: "RJ-14-ZX-7701", make: "Force", model: "Traveller", type: "School Bus", status: "expired", health: 38, driver: "K. Verma", odometer: 178300, nextEvent: "Fitness expired", nextDays: -8 },
  { id: "8", reg: "MH-04-LM-5566", make: "Tata", model: "Yodha", type: "Pickup", status: "fit", health: 88, driver: "D. Singh", odometer: 67900, nextEvent: "PUC in 45d", nextDays: 45 },
  { id: "9", reg: "UP-32-DK-1133", make: "Mahindra", model: "Jeeto", type: "LCV", status: "service_due", health: 64, driver: "V. Yadav", odometer: 119500, nextEvent: "Oil change", nextDays: 3 },
  { id: "10", reg: "KL-07-BN-9988", make: "Volvo", model: "FM 460", type: "Heavy Truck", status: "fit", health: 94, driver: "T. Nair", odometer: 88300, nextEvent: "All clear", nextDays: 120 },
  { id: "11", reg: "WB-20-RT-4422", make: "Tata", model: "407", type: "Truck", status: "maintenance", health: 60, driver: "—", odometer: 201400, nextEvent: "Brake service", nextDays: 0 },
  { id: "12", reg: "AP-09-QW-3344", make: "Bharat Benz", model: "1217C", type: "Truck", status: "fit", health: 90, driver: "N. Reddy", odometer: 73600, nextEvent: "All clear", nextDays: 90 },
];

const UPCOMING: Expiry[] = [
  { id: "e1", vehicleReg: "MH-12-AB-3401", type: "Insurance", category: "document", expiresIn: -2, date: "Expired 2 days ago" },
  { id: "e2", vehicleReg: "RJ-14-ZX-7701", type: "Fitness Certificate", category: "document", expiresIn: -8, date: "Expired 8 days ago" },
  { id: "e3", vehicleReg: "UP-32-DK-1133", type: "Oil change", category: "service", expiresIn: 3, date: "in 3 days" },
  { id: "e4", vehicleReg: "DL-3C-XY-7820", type: "Full service", category: "service", expiresIn: 7, date: "in 7 days" },
  { id: "e5", vehicleReg: "KA-05-MN-1188", type: "Driver license", category: "license", expiresIn: 12, date: "in 12 days" },
  { id: "e6", vehicleReg: "MH-04-LM-5566", type: "PUC certificate", category: "document", expiresIn: 18, date: "in 18 days" },
  { id: "e7", vehicleReg: "TN-22-PL-4503", type: "Road tax", category: "document", expiresIn: 27, date: "in 27 days" },
];

// ---------- Page ----------

const STATUS_META: Record<
  VehicleStatus,
  { label: string; dot: string; chip: string; badge: string }
> = {
  fit: {
    label: "Fit",
    dot: "bg-success",
    chip: "bg-success/10 text-success border-success/20",
    badge: "border-success/30 bg-success/10 text-success",
  },
  service_due: {
    label: "Service Due",
    dot: "bg-warning",
    chip: "bg-warning/10 text-warning border-warning/20",
    badge: "border-warning/30 bg-warning/10 text-warning",
  },
  expired: {
    label: "Expired Docs",
    dot: "bg-destructive",
    chip: "bg-destructive/10 text-destructive border-destructive/20",
    badge: "border-destructive/30 bg-destructive/10 text-destructive",
  },
  maintenance: {
    label: "Maintenance",
    dot: "bg-primary",
    chip: "bg-primary/10 text-primary border-primary/20",
    badge: "border-primary/30 bg-primary/10 text-primary",
  },
};

function DashboardPage() {
  const [filter, setFilter] = useState<VehicleStatus | "all">("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const c: Record<VehicleStatus, number> = { fit: 0, service_due: 0, expired: 0, maintenance: 0 };
    for (const v of VEHICLES) c[v.status]++;
    return c;
  }, []);

  const total = VEHICLES.length;
  const healthScore = Math.round(VEHICLES.reduce((s, v) => s + v.health, 0) / total);

  const filtered = useMemo(() => {
    return VEHICLES.filter((v) => {
      if (filter !== "all" && v.status !== filter) return false;
      if (query && !`${v.reg} ${v.make} ${v.model} ${v.driver}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [filter, query]);

  return (
    <div className="min-h-screen bg-surface">
      <DashHeader />
      <PreviewBanner />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Fleet Health</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Real-time status across all vehicles in your tenant.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-accent">
              <Calendar className="h-4 w-4" /> Last 30 days
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-gradient-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-soft hover:opacity-90">
              <ArrowUpRight className="h-4 w-4" /> Export report
            </button>
          </div>
        </div>

        {/* Top row: health score + status cards */}
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <HealthScoreCard score={healthScore} total={total} />
          <div className="grid grid-cols-2 gap-4 lg:col-span-2">
            <StatusCard tone="fit" count={counts.fit} total={total} />
            <StatusCard tone="service_due" count={counts.service_due} total={total} />
            <StatusCard tone="expired" count={counts.expired} total={total} />
            <StatusCard tone="maintenance" count={counts.maintenance} total={total} />
          </div>
        </div>

        {/* Mid: upcoming + breakdown */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <UpcomingExpiries />
          </div>
          <BreakdownCard counts={counts} total={total} />
        </div>

        {/* Vehicle table */}
        <section className="mt-8 rounded-2xl border border-border bg-card shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="text-base font-semibold">Vehicles</h2>
              <p className="text-xs text-muted-foreground">
                {filtered.length} of {total} shown
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search reg, driver…"
                  className="w-56 rounded-lg border border-border bg-background py-2 pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <FilterChips value={filter} onChange={setFilter} counts={counts} total={total} />
            </div>
          </div>
          <VehicleTable rows={filtered} />
        </section>
      </main>
    </div>
  );
}

// ---------- Pieces ----------

function DashHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-primary">
            <Truck className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight">FleetPilot</span>
          <span className="ml-2 hidden rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline">
            DEMO
          </span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <span className="font-medium text-foreground">Dashboard</span>
          <span>Vehicles</span>
          <span>Documents</span>
          <span>Drivers</span>
          <span>Reports</span>
        </nav>
        <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-destructive" />
        </button>
      </div>
    </header>
  );
}

function PreviewBanner() {
  return (
    <div className="border-b border-primary/20 bg-primary/5">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-6 py-2 text-xs text-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        <span>
          UI preview with sample data. Wire to your real fleet by enabling Cloud & onboarding —{" "}
          <Link to="/" className="font-medium text-primary hover:underline">back to landing</Link>.
        </span>
      </div>
    </div>
  );
}

function HealthScoreCard({ score, total }: { score: number; total: number }) {
  const tone = score >= 85 ? "text-success" : score >= 70 ? "text-warning" : "text-destructive";
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Fleet Health Score</div>
          <div className={`mt-2 text-5xl font-semibold tracking-tight ${tone}`}>
            {score}
            <span className="ml-1 text-2xl text-muted-foreground">/100</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-success">
            <TrendingUp className="h-3 w-3" /> +4 vs last week
          </div>
        </div>
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-primary text-primary-foreground">
          <Gauge className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-6">
        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-gradient-primary" style={{ width: `${score}%` }} />
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{total} vehicles tracked</span>
          <span>Updated just now</span>
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  tone,
  count,
  total,
}: {
  tone: VehicleStatus;
  count: number;
  total: number;
}) {
  const meta = STATUS_META[tone];
  const pct = Math.round((count / total) * 100);
  const Icon = tone === "fit" ? CircleCheck : tone === "service_due" ? Clock : tone === "expired" ? AlertTriangle : Wrench;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${meta.chip} border`}>
          <Icon className="h-5 w-5" />
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${meta.badge}`}>
          {pct}%
        </span>
      </div>
      <div className="mt-4 text-3xl font-semibold tracking-tight">{count}</div>
      <div className="text-xs text-muted-foreground">{meta.label}</div>
    </div>
  );
}

function UpcomingExpiries() {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-base font-semibold">Upcoming expiries</h2>
          <p className="text-xs text-muted-foreground">Next 30 days, sorted by urgency</p>
        </div>
        <button className="text-xs font-medium text-primary hover:underline">View all</button>
      </div>
      <ul className="divide-y divide-border">
        {UPCOMING.map((e) => {
          const expired = e.expiresIn < 0;
          const urgent = !expired && e.expiresIn <= 7;
          const Icon = e.category === "document" ? FileWarning : e.category === "service" ? Wrench : ShieldCheck;
          const tone = expired
            ? "text-destructive bg-destructive/10 border-destructive/20"
            : urgent
              ? "text-warning bg-warning/10 border-warning/20"
              : "text-primary bg-primary/10 border-primary/20";
          return (
            <li key={e.id} className="flex items-center gap-4 px-5 py-3.5">
              <div className={`grid h-9 w-9 flex-none place-items-center rounded-lg border ${tone}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{e.vehicleReg}</span>
                  <span className="text-sm font-medium">{e.type}</span>
                </div>
                <div className={`text-xs ${expired ? "text-destructive" : urgent ? "text-warning" : "text-muted-foreground"}`}>
                  {e.date}
                </div>
              </div>
              <button className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-accent">
                Action
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BreakdownCard({ counts, total }: { counts: Record<VehicleStatus, number>; total: number }) {
  const items: { tone: VehicleStatus; value: number }[] = [
    { tone: "fit", value: counts.fit },
    { tone: "service_due", value: counts.service_due },
    { tone: "expired", value: counts.expired },
    { tone: "maintenance", value: counts.maintenance },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="text-base font-semibold">Status breakdown</h2>
      <p className="text-xs text-muted-foreground">Share of total fleet</p>

      <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full">
        {items.map((it) => (
          <div
            key={it.tone}
            className={STATUS_META[it.tone].dot}
            style={{ width: `${(it.value / total) * 100}%` }}
            title={`${STATUS_META[it.tone].label}: ${it.value}`}
          />
        ))}
      </div>

      <ul className="mt-5 space-y-3">
        {items.map((it) => {
          const meta = STATUS_META[it.tone];
          const pct = Math.round((it.value / total) * 100);
          return (
            <li key={it.tone} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                <span className="text-foreground">{meta.label}</span>
              </span>
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{it.value}</span> · {pct}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FilterChips({
  value,
  onChange,
  counts,
  total,
}: {
  value: VehicleStatus | "all";
  onChange: (v: VehicleStatus | "all") => void;
  counts: Record<VehicleStatus, number>;
  total: number;
}) {
  const opts: { v: VehicleStatus | "all"; label: string; n: number }[] = [
    { v: "all", label: "All", n: total },
    { v: "fit", label: "Fit", n: counts.fit },
    { v: "service_due", label: "Service Due", n: counts.service_due },
    { v: "expired", label: "Expired", n: counts.expired },
    { v: "maintenance", label: "Maintenance", n: counts.maintenance },
  ];
  return (
    <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
      <Filter className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
      {opts.map((o) => {
        const active = value === o.v;
        return (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label} <span className="ml-1 opacity-70">{o.n}</span>
          </button>
        );
      })}
    </div>
  );
}

function VehicleTable({ rows }: { rows: Vehicle[] }) {
  if (rows.length === 0) {
    return (
      <div className="px-5 py-16 text-center text-sm text-muted-foreground">
        No vehicles match your filter.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-surface text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-5 py-3 text-left font-medium">Vehicle</th>
            <th className="px-5 py-3 text-left font-medium">Status</th>
            <th className="px-5 py-3 text-left font-medium">Driver</th>
            <th className="px-5 py-3 text-right font-medium">Odometer</th>
            <th className="px-5 py-3 text-left font-medium">Health</th>
            <th className="px-5 py-3 text-left font-medium">Next event</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((v) => {
            const meta = STATUS_META[v.status];
            const healthTone =
              v.health >= 85 ? "bg-success" : v.health >= 65 ? "bg-warning" : "bg-destructive";
            const eventTone =
              v.nextDays < 0 ? "text-destructive" : v.nextDays <= 7 ? "text-warning" : "text-muted-foreground";
            return (
              <tr key={v.id} className="hover:bg-accent/40">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-secondary">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="font-mono text-xs">{v.reg}</div>
                      <div className="text-xs text-muted-foreground">{v.make} {v.model} · {v.type}</div>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.badge}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                </td>
                <td className="px-5 py-3 text-foreground">{v.driver}</td>
                <td className="px-5 py-3 text-right font-mono text-xs text-muted-foreground">
                  {v.odometer.toLocaleString()} km
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-secondary">
                      <div className={`h-full ${healthTone}`} style={{ width: `${v.health}%` }} />
                    </div>
                    <span className="text-xs tabular-nums text-muted-foreground">{v.health}</span>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className={`text-xs ${eventTone}`}>{v.nextEvent}</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
