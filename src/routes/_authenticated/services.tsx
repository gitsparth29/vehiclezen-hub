import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Download, Wrench, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/hooks/use-tenant";
import type { Tables, TablesInsert, Enums } from "@/integrations/supabase/types";
import { Constants } from "@/integrations/supabase/types";
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

export const Route = createFileRoute("/_authenticated/services")({
  component: ServicesPage,
});

type Service = Tables<"services">;
type Vehicle = Pick<Tables<"vehicles">, "id" | "registration_number" | "make" | "model">;

const schema = z.object({
  vehicle_id: z.string().uuid("Select a vehicle"),
  type: z.enum(Constants.public.Enums.service_type),
  service_date: z.string().min(1, "Required"),
  cost: z.coerce.number().min(0),
  odometer: z.coerce.number().int().min(0).optional().nullable(),
  garage_name: z.string().max(120).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});
type FormVals = z.infer<typeof schema>;

function ServicesPage() {
  const qc = useQueryClient();
  const { data: tenantId } = useTenantId();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [toDelete, setToDelete] = useState<Service | null>(null);

  const { data: services, isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services").select("*").order("service_date", { ascending: false });
      if (error) throw error;
      return data as Service[];
    },
  });
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles", "min"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles").select("id, registration_number, make, model").order("registration_number");
      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const vMap = useMemo(() => {
    const m = new Map<string, Vehicle>();
    (vehicles ?? []).forEach((v) => m.set(v.id, v));
    return m;
  }, [vehicles]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (services ?? []).filter((s) => {
      if (typeFilter !== "all" && s.type !== typeFilter) return false;
      if (!q) return true;
      const v = vMap.get(s.vehicle_id);
      return (
        (v?.registration_number ?? "").toLowerCase().includes(q) ||
        (s.garage_name ?? "").toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q)
      );
    });
  }, [services, search, typeFilter, vMap]);

  const totalCost = filtered.reduce((sum, s) => sum + Number(s.cost ?? 0), 0);

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Service deleted");
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="text-sm text-muted-foreground">
            {services?.length ?? 0} service records · {formatCurrency(totalCost)} total
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCsv("services.csv", filtered)} disabled={filtered.length === 0}>
            <Download className="mr-2 size-4" /> Export
          </Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="mr-2 size-4" /> Log service
          </Button>
        </div>
      </div>

      <Card className="p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search vehicle, garage, type" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Constants.public.Enums.service_type.map((t) => (
                <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <Empty icon={Wrench} hasAny={(services?.length ?? 0) > 0} onAdd={() => { setEditing(null); setDialogOpen(true); }} label="service" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Garage</TableHead>
                <TableHead>Odometer</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const v = vMap.get(s.vehicle_id);
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.service_date}</TableCell>
                    <TableCell>
                      <div className="font-medium">{v?.registration_number ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{v ? `${v.make} ${v.model}` : ""}</div>
                    </TableCell>
                    <TableCell className="capitalize">{s.type.replace(/_/g, " ")}</TableCell>
                    <TableCell>{s.garage_name ?? "—"}</TableCell>
                    <TableCell>{s.odometer != null ? formatNumber(s.odometer) : "—"}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(s.cost))}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(s); setDialogOpen(true); }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setToDelete(s)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <ServiceDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} tenantId={tenantId ?? null} vehicles={vehicles ?? []} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete service record?"
        destructive
        confirmLabel="Delete"
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
      />
    </div>
  );
}

function ServiceDialog({
  open, onOpenChange, editing, tenantId, vehicles,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Service | null;
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
          type: editing.type,
          service_date: editing.service_date,
          cost: Number(editing.cost),
          odometer: editing.odometer,
          garage_name: editing.garage_name,
          notes: editing.notes,
        }
      : {
          vehicle_id: vehicles[0]?.id ?? "",
          type: "oil_change",
          service_date: new Date().toISOString().slice(0, 10),
          cost: 0,
          odometer: null,
          garage_name: "",
          notes: "",
        },
  });

  const mut = useMutation({
    mutationFn: async (values: FormVals) => {
      const clean = {
        ...values,
        garage_name: values.garage_name || null,
        notes: values.notes || null,
        odometer: values.odometer ?? null,
      };
      if (editing) {
        const { error } = await supabase.from("services").update(clean).eq("id", editing.id);
        if (error) throw error;
      } else {
        if (!tenantId) throw new Error("Tenant not ready");
        const insert: TablesInsert<"services"> = { ...clean, tenant_id: tenantId };
        const { error } = await supabase.from("services").insert(insert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Service updated" : "Service logged");
      qc.invalidateQueries({ queryKey: ["services"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit service" : "Log service"}</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vehicle *" error={form.formState.errors.vehicle_id?.message}>
              <Select value={form.watch("vehicle_id")} onValueChange={(v) => form.setValue("vehicle_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.registration_number} — {v.make} {v.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Type">
              <Select value={form.watch("type")} onValueChange={(v) => form.setValue("type", v as Enums<"service_type">)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.service_type.map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Date *" error={form.formState.errors.service_date?.message}>
              <Input type="date" {...form.register("service_date")} />
            </Field>
            <Field label="Cost *" error={form.formState.errors.cost?.message}>
              <Input type="number" step="0.01" {...form.register("cost")} />
            </Field>
            <Field label="Odometer">
              <Input type="number" {...form.register("odometer")} />
            </Field>
            <Field label="Garage">
              <Input {...form.register("garage_name")} placeholder="Joe's Auto" />
            </Field>
          </div>
          <Field label="Notes">
            <textarea {...form.register("notes")} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Saving..." : editing ? "Save changes" : "Log service"}</Button>
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

function Empty({ icon: Icon, hasAny, onAdd, label }: { icon: typeof Wrench; hasAny: boolean; onAdd: () => void; label: string }) {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-7" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{hasAny ? `No ${label} records match` : `No ${label} records yet`}</h3>
      {!hasAny && <Button onClick={onAdd} className="mt-4"><Plus className="mr-2 size-4" /> Add {label}</Button>}
    </div>
  );
}
