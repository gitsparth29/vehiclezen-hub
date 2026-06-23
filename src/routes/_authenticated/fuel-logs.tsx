import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Download, Fuel, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/hooks/use-tenant";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { exportToCsv } from "@/lib/csv";
import { formatCurrency, formatNumber } from "@/lib/format";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/fuel-logs")({
  component: FuelLogsPage,
});

type Log = Tables<"fuel_logs">;
type Vehicle = Pick<Tables<"vehicles">, "id" | "registration_number" | "make" | "model">;

const schema = z.object({
  vehicle_id: z.string().uuid("Select a vehicle"),
  log_date: z.string().min(1),
  odometer: z.coerce.number().int().min(0).optional().nullable(),
  litres: z.coerce.number().min(0.01, "Required"),
  price_per_litre: z.coerce.number().min(0),
  station: z.string().max(120).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});
type FormVals = z.infer<typeof schema>;

function FuelLogsPage() {
  const qc = useQueryClient();
  const { data: tenantId } = useTenantId();
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Log | null>(null);
  const [toDelete, setToDelete] = useState<Log | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ["fuel_logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fuel_logs").select("*").order("log_date", { ascending: false });
      if (error) throw error;
      return data as Log[];
    },
  });
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles", "min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("id, registration_number, make, model").order("registration_number");
      if (error) throw error;
      return data as Vehicle[];
    },
  });
  const vMap = useMemo(() => new Map((vehicles ?? []).map((v) => [v.id, v])), [vehicles]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (logs ?? []).filter((l) => {
      if (vehicleFilter !== "all" && l.vehicle_id !== vehicleFilter) return false;
      if (!q) return true;
      const v = vMap.get(l.vehicle_id);
      return (
        (v?.registration_number ?? "").toLowerCase().includes(q) ||
        (l.station ?? "").toLowerCase().includes(q)
      );
    });
  }, [logs, search, vehicleFilter, vMap]);

  const monthly = useMemo(() => {
    const map = new Map<string, number>();
    (logs ?? []).forEach((l) => {
      const m = (l.log_date ?? "").slice(0, 7);
      if (!m) return;
      const cost = Number(l.total_cost ?? Number(l.litres) * Number(l.price_per_litre));
      map.set(m, (map.get(m) ?? 0) + cost);
    });
    const months: { month: string; cost: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        month: d.toLocaleDateString("en-US", { month: "short" }),
        cost: Math.round(map.get(key) ?? 0),
      });
    }
    return months;
  }, [logs]);

  const totalCost = filtered.reduce((s, l) => s + Number(l.total_cost ?? Number(l.litres) * Number(l.price_per_litre)), 0);
  const totalLitres = filtered.reduce((s, l) => s + Number(l.litres), 0);

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fuel_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Log deleted");
      qc.invalidateQueries({ queryKey: ["fuel_logs"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fuel Logs</h1>
          <p className="text-sm text-muted-foreground">
            {logs?.length ?? 0} entries · {formatNumber(Math.round(totalLitres))} L · {formatCurrency(totalCost)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCsv("fuel-logs.csv", filtered)} disabled={filtered.length === 0}>
            <Download className="mr-2 size-4" /> Export
          </Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="mr-2 size-4" /> Log fill-up
          </Button>
        </div>
      </div>

      <Card className="p-4 shadow-soft">
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Monthly fuel cost (last 6 months)</h3>
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip
                contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                formatter={(v: number) => formatCurrency(v)}
              />
              <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search vehicle or station" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-[220px]"><SelectValue placeholder="Vehicle" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All vehicles</SelectItem>
              {(vehicles ?? []).map((v) => <SelectItem key={v.id} value={v.id}>{v.registration_number}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Fuel className="size-7" /></div>
            <h3 className="mt-4 text-lg font-semibold">{(logs?.length ?? 0) > 0 ? "No logs match" : "No fuel logs yet"}</h3>
            {(logs?.length ?? 0) === 0 && (
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="mt-4">
                <Plus className="mr-2 size-4" /> Log fill-up
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Odometer</TableHead>
                <TableHead className="text-right">Litres</TableHead>
                <TableHead className="text-right">£/L</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Station</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => {
                const v = vMap.get(l.vehicle_id);
                const total = Number(l.total_cost ?? Number(l.litres) * Number(l.price_per_litre));
                return (
                  <TableRow key={l.id}>
                    <TableCell>{l.log_date}</TableCell>
                    <TableCell className="font-medium">{v?.registration_number ?? "—"}</TableCell>
                    <TableCell>{l.odometer != null ? formatNumber(l.odometer) : "—"}</TableCell>
                    <TableCell className="text-right">{Number(l.litres).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{Number(l.price_per_litre).toFixed(2)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                    <TableCell>{l.station ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(l); setDialogOpen(true); }}><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setToDelete(l)}><Trash2 className="size-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <FuelDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} tenantId={tenantId ?? null} vehicles={vehicles ?? []} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete fuel log?"
        destructive
        confirmLabel="Delete"
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
      />
    </div>
  );
}

function FuelDialog({
  open, onOpenChange, editing, tenantId, vehicles,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Log | null;
  tenantId: string | null;
  vehicles: Vehicle[];
}) {
  const qc = useQueryClient();
  const form = useForm<FormVals>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    values: editing
      ? {
          vehicle_id: editing.vehicle_id,
          log_date: editing.log_date,
          odometer: editing.odometer,
          litres: Number(editing.litres),
          price_per_litre: Number(editing.price_per_litre),
          station: editing.station,
          notes: editing.notes,
        }
      : {
          vehicle_id: vehicles[0]?.id ?? "",
          log_date: new Date().toISOString().slice(0, 10),
          odometer: null,
          litres: 0,
          price_per_litre: 0,
          station: "",
          notes: "",
        },
  });

  const litres = form.watch("litres");
  const ppl = form.watch("price_per_litre");
  const total = Number(litres || 0) * Number(ppl || 0);

  const mut = useMutation({
    mutationFn: async (values: FormVals) => {
      const clean = {
        ...values,
        odometer: values.odometer ?? null,
        station: values.station || null,
        notes: values.notes || null,
        total_cost: Number(values.litres) * Number(values.price_per_litre),
      };
      if (editing) {
        const { error } = await supabase.from("fuel_logs").update(clean).eq("id", editing.id);
        if (error) throw error;
      } else {
        if (!tenantId) throw new Error("Tenant not ready");
        const insert: TablesInsert<"fuel_logs"> = { ...clean, tenant_id: tenantId };
        const { error } = await supabase.from("fuel_logs").insert(insert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Log updated" : "Fill-up logged");
      qc.invalidateQueries({ queryKey: ["fuel_logs"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit fuel log" : "Log fill-up"}</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vehicle *" error={form.formState.errors.vehicle_id?.message}>
              <Select value={form.watch("vehicle_id")} onValueChange={(v) => form.setValue("vehicle_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => <SelectItem key={v.id} value={v.id}>{v.registration_number} — {v.make} {v.model}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date *"><Input type="date" {...form.register("log_date")} /></Field>
            <Field label="Odometer"><Input type="number" {...form.register("odometer")} /></Field>
            <Field label="Litres *" error={form.formState.errors.litres?.message}>
              <Input type="number" step="0.01" {...form.register("litres")} />
            </Field>
            <Field label="Price per litre *" error={form.formState.errors.price_per_litre?.message}>
              <Input type="number" step="0.01" {...form.register("price_per_litre")} />
            </Field>
            <Field label="Total cost">
              <Input value={formatCurrency(total)} readOnly className="bg-muted/50" />
            </Field>
            <Field label="Station"><Input {...form.register("station")} placeholder="Shell, BP..." /></Field>
          </div>
          <Field label="Notes">
            <textarea {...form.register("notes")} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Saving..." : editing ? "Save changes" : "Log fill-up"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
