import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Download, Route as RouteIcon, Search } from "lucide-react";
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
import { formatNumber } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/trip-logs")({
  component: TripLogsPage,
});

type Trip = Tables<"trip_logs">;
type Vehicle = Pick<Tables<"vehicles">, "id" | "registration_number" | "make" | "model">;
type Driver = Pick<Tables<"drivers">, "id" | "first_name" | "last_name">;

const schema = z.object({
  vehicle_id: z.string().uuid("Select a vehicle"),
  driver_id: z.string().uuid().optional().nullable(),
  start_location: z.string().trim().min(1, "Required").max(160),
  end_location: z.string().trim().min(1, "Required").max(160),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
  distance_km: z.coerce.number().min(0),
  purpose: z.string().max(200).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
}).refine((v) => new Date(v.end_time) > new Date(v.start_time), {
  message: "End time must be after start time",
  path: ["end_time"],
});
type FormVals = z.infer<typeof schema>;

function durationHours(start: string, end: string) {
  return Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60));
}
function fmtDuration(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

function TripLogsPage() {
  const qc = useQueryClient();
  const { data: tenantId } = useTenantId();
  const [search, setSearch] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [toDelete, setToDelete] = useState<Trip | null>(null);

  const { data: trips, isLoading } = useQuery({
    queryKey: ["trip_logs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("trip_logs").select("*").order("start_time", { ascending: false });
      if (error) throw error;
      return data as Trip[];
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
  const { data: drivers } = useQuery({
    queryKey: ["drivers", "min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("drivers").select("id, first_name, last_name").order("first_name");
      if (error) throw error;
      return data as Driver[];
    },
  });
  const vMap = useMemo(() => new Map((vehicles ?? []).map((v) => [v.id, v])), [vehicles]);
  const dMap = useMemo(() => new Map((drivers ?? []).map((d) => [d.id, d])), [drivers]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (trips ?? []).filter((t) => {
      if (vehicleFilter !== "all" && t.vehicle_id !== vehicleFilter) return false;
      if (!q) return true;
      const v = vMap.get(t.vehicle_id);
      return (
        t.start_location.toLowerCase().includes(q) ||
        t.end_location.toLowerCase().includes(q) ||
        (v?.registration_number ?? "").toLowerCase().includes(q) ||
        (t.purpose ?? "").toLowerCase().includes(q)
      );
    });
  }, [trips, search, vehicleFilter, vMap]);

  const totalKm = filtered.reduce((s, t) => s + Number(t.distance_km), 0);

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("trip_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Trip deleted");
      qc.invalidateQueries({ queryKey: ["trip_logs"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trip Logs</h1>
          <p className="text-sm text-muted-foreground">
            {trips?.length ?? 0} trips · {formatNumber(Math.round(totalKm))} km
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCsv("trip-logs.csv", filtered)} disabled={filtered.length === 0}>
            <Download className="mr-2 size-4" /> Export
          </Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="mr-2 size-4" /> Log trip
          </Button>
        </div>
      </div>

      <Card className="p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search location, vehicle, purpose" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
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
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><RouteIcon className="size-7" /></div>
            <h3 className="mt-4 text-lg font-semibold">{(trips?.length ?? 0) > 0 ? "No trips match" : "No trips logged"}</h3>
            {(trips?.length ?? 0) === 0 && (
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="mt-4">
                <Plus className="mr-2 size-4" /> Log trip
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Route</TableHead>
                <TableHead className="text-right">Distance</TableHead>
                <TableHead className="text-right">Duration</TableHead>
                <TableHead className="text-right">Avg speed</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => {
                const v = vMap.get(t.vehicle_id);
                const d = t.driver_id ? dMap.get(t.driver_id) : null;
                const hrs = durationHours(t.start_time, t.end_time);
                const speed = hrs > 0 ? Number(t.distance_km) / hrs : 0;
                return (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs">{new Date(t.start_time).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{v?.registration_number ?? "—"}</TableCell>
                    <TableCell>{d ? `${d.first_name} ${d.last_name}` : "—"}</TableCell>
                    <TableCell>
                      <div className="text-sm">{t.start_location}</div>
                      <div className="text-xs text-muted-foreground">→ {t.end_location}</div>
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(Math.round(Number(t.distance_km)))} km</TableCell>
                    <TableCell className="text-right">{fmtDuration(hrs)}</TableCell>
                    <TableCell className="text-right">{speed.toFixed(0)} km/h</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(t); setDialogOpen(true); }}><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setToDelete(t)}><Trash2 className="size-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <TripDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} tenantId={tenantId ?? null} vehicles={vehicles ?? []} drivers={drivers ?? []} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete trip?"
        destructive
        confirmLabel="Delete"
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
      />
    </div>
  );
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function TripDialog({
  open, onOpenChange, editing, tenantId, vehicles, drivers,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Trip | null;
  tenantId: string | null;
  vehicles: Vehicle[];
  drivers: Driver[];
}) {
  const qc = useQueryClient();
  const now = toLocalInput(new Date().toISOString());
  const form = useForm<FormVals>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    values: editing
      ? {
          vehicle_id: editing.vehicle_id,
          driver_id: editing.driver_id,
          start_location: editing.start_location,
          end_location: editing.end_location,
          start_time: toLocalInput(editing.start_time),
          end_time: toLocalInput(editing.end_time),
          distance_km: Number(editing.distance_km),
          purpose: editing.purpose,
          notes: editing.notes,
        }
      : {
          vehicle_id: vehicles[0]?.id ?? "",
          driver_id: null,
          start_location: "",
          end_location: "",
          start_time: now,
          end_time: now,
          distance_km: 0,
          purpose: "",
          notes: "",
        },
  });

  const startT = form.watch("start_time");
  const endT = form.watch("end_time");
  const dist = form.watch("distance_km");
  const hrs = startT && endT ? durationHours(new Date(startT).toISOString(), new Date(endT).toISOString()) : 0;
  const speed = hrs > 0 ? Number(dist || 0) / hrs : 0;

  const mut = useMutation({
    mutationFn: async (values: FormVals) => {
      const clean = {
        ...values,
        driver_id: values.driver_id || null,
        purpose: values.purpose || null,
        notes: values.notes || null,
        start_time: new Date(values.start_time).toISOString(),
        end_time: new Date(values.end_time).toISOString(),
      };
      if (editing) {
        const { error } = await supabase.from("trip_logs").update(clean).eq("id", editing.id);
        if (error) throw error;
      } else {
        if (!tenantId) throw new Error("Tenant not ready");
        const insert: TablesInsert<"trip_logs"> = { ...clean, tenant_id: tenantId };
        const { error } = await supabase.from("trip_logs").insert(insert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Trip updated" : "Trip logged");
      qc.invalidateQueries({ queryKey: ["trip_logs"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit trip" : "Log trip"}</DialogTitle></DialogHeader>
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
            <Field label="Driver">
              <Select value={form.watch("driver_id") ?? "none"} onValueChange={(v) => form.setValue("driver_id", v === "none" ? null : v)}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Unassigned —</SelectItem>
                  {drivers.map((d) => <SelectItem key={d.id} value={d.id}>{d.first_name} {d.last_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Start location *" error={form.formState.errors.start_location?.message}>
              <Input {...form.register("start_location")} />
            </Field>
            <Field label="End location *" error={form.formState.errors.end_location?.message}>
              <Input {...form.register("end_location")} />
            </Field>
            <Field label="Start time *"><Input type="datetime-local" {...form.register("start_time")} /></Field>
            <Field label="End time *" error={form.formState.errors.end_time?.message}>
              <Input type="datetime-local" {...form.register("end_time")} />
            </Field>
            <Field label="Distance (km) *"><Input type="number" step="0.1" {...form.register("distance_km")} /></Field>
            <Field label="Duration / Avg speed">
              <Input value={`${fmtDuration(hrs)} · ${speed.toFixed(0)} km/h`} readOnly className="bg-muted/50" />
            </Field>
          </div>
          <Field label="Purpose"><Input {...form.register("purpose")} placeholder="Client visit, delivery..." /></Field>
          <Field label="Notes">
            <textarea {...form.register("notes")} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Saving..." : editing ? "Save changes" : "Log trip"}</Button>
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
