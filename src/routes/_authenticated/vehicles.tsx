import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Download, Truck } from "lucide-react";
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
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { exportToCsv } from "@/lib/csv";
import { daysUntil, formatNumber } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/vehicles")({
  component: VehiclesPage,
});

type Vehicle = Tables<"vehicles">;

const vehicleSchema = z.object({
  registration_number: z.string().trim().min(1, "Required").max(32),
  make: z.string().trim().min(1, "Required").max(64),
  model: z.string().trim().min(1, "Required").max(64),
  year: z.coerce.number().int().min(1900).max(2100).optional().nullable(),
  color: z.string().max(32).optional().nullable(),
  vin: z.string().max(64).optional().nullable(),
  fuel_type: z.enum(Constants.public.Enums.fuel_type),
  transmission: z.enum(Constants.public.Enums.transmission_type),
  status: z.enum(Constants.public.Enums.vehicle_status),
  mileage: z.coerce.number().int().min(0).optional().nullable(),
  insurance_expiry: z.string().optional().nullable(),
  mot_expiry: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

type VehicleForm = z.infer<typeof vehicleSchema>;

function VehiclesPage() {
  const qc = useQueryClient();
  const { data: tenantId } = useTenantId();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [toDelete, setToDelete] = useState<Vehicle | null>(null);

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Vehicle[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (vehicles ?? []).filter((v) => {
      if (statusFilter !== "all" && v.status !== statusFilter) return false;
      if (!q) return true;
      return (
        v.registration_number.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        (v.vin ?? "").toLowerCase().includes(q)
      );
    });
  }, [vehicles, search, statusFilter]);

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vehicles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Vehicle deleted");
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function openAdd() {
    setEditing(null);
    setDialogOpen(true);
  }
  function openEdit(v: Vehicle) {
    setEditing(v);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-sm text-muted-foreground">
            {vehicles?.length ?? 0} vehicle{vehicles?.length === 1 ? "" : "s"} in your fleet
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportToCsv("vehicles.csv", filtered)}
            disabled={filtered.length === 0}
          >
            <Download className="mr-2 size-4" /> Export
          </Button>
          <Button onClick={openAdd}>
            <Plus className="mr-2 size-4" /> Add vehicle
          </Button>
        </div>
      </div>

      <Card className="p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search registration, make, model, VIN"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Constants.public.Enums.vehicle_status.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onAdd={openAdd} hasAny={(vehicles?.length ?? 0) > 0} />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Registration</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Mileage</TableHead>
                <TableHead>Insurance</TableHead>
                <TableHead>MOT</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id}>
                  <TableCell className="font-medium">{v.registration_number}</TableCell>
                  <TableCell>
                    <div className="font-medium">{v.make} {v.model}</div>
                    <div className="text-xs text-muted-foreground">
                      {v.year ?? "—"} · {v.fuel_type ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell><StatusBadge status={v.status} /></TableCell>
                  <TableCell>{v.mileage != null ? `${formatNumber(v.mileage)} mi` : "—"}</TableCell>
                  <TableCell><ExpiryCell date={v.insurance_expiry} /></TableCell>
                  <TableCell><ExpiryCell date={v.mot_expiry} /></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(v)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setToDelete(v)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <VehicleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        tenantId={tenantId ?? null}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete vehicle?"
        description={`${toDelete?.make ?? ""} ${toDelete?.model ?? ""} (${toDelete?.registration_number ?? ""}) will be removed permanently. Linked documents and logs will also be deleted.`}
        destructive
        confirmLabel="Delete"
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
      />
    </div>
  );
}

function ExpiryCell({ date }: { date: string | null }) {
  if (!date) return <span className="text-muted-foreground">—</span>;
  const days = daysUntil(date);
  const cls =
    days == null ? ""
    : days < 0 ? "text-destructive font-medium"
    : days <= 30 ? "text-amber-600 font-medium"
    : "text-foreground";
  return (
    <div className={cls}>
      {date}
      {days != null && (
        <div className="text-xs opacity-80">
          {days < 0 ? `${Math.abs(days)}d overdue` : `in ${days}d`}
        </div>
      )}
    </div>
  );
}

function EmptyState({ onAdd, hasAny }: { onAdd: () => void; hasAny: boolean }) {
  return (
    <div className="p-12 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Truck className="size-7" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">
        {hasAny ? "No vehicles match your filters" : "No vehicles yet"}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {hasAny ? "Try clearing the search or status filter." : "Add your first vehicle to start tracking fleet health."}
      </p>
      {!hasAny && (
        <Button onClick={onAdd} className="mt-4">
          <Plus className="mr-2 size-4" /> Add vehicle
        </Button>
      )}
    </div>
  );
}

function VehicleDialog({
  open, onOpenChange, editing, tenantId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Vehicle | null;
  tenantId: string | null;
}) {
  const qc = useQueryClient();
  const form = useForm<VehicleForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(vehicleSchema) as any,
    values: editing
      ? {
          registration_number: editing.registration_number,
          make: editing.make,
          model: editing.model,
          year: editing.year,
          color: editing.color,
          vin: editing.vin,
          fuel_type: (editing.fuel_type ?? "petrol") as Enums<"fuel_type">,
          transmission: (editing.transmission ?? "manual") as Enums<"transmission_type">,
          status: editing.status,
          mileage: editing.mileage,
          insurance_expiry: editing.insurance_expiry,
          mot_expiry: editing.mot_expiry,
          notes: editing.notes,
        }
      : {
          registration_number: "",
          make: "",
          model: "",
          year: null,
          color: "",
          vin: "",
          fuel_type: "petrol",
          transmission: "manual",
          status: "fit",
          mileage: 0,
          insurance_expiry: null,
          mot_expiry: null,
          notes: "",
        },
  });

  const mut = useMutation({
    mutationFn: async (values: VehicleForm) => {
      const clean = {
        ...values,
        color: values.color || null,
        vin: values.vin || null,
        notes: values.notes || null,
        insurance_expiry: values.insurance_expiry || null,
        mot_expiry: values.mot_expiry || null,
        year: values.year ?? null,
        mileage: values.mileage ?? null,
      };
      if (editing) {
        const { error } = await supabase.from("vehicles").update(clean).eq("id", editing.id);
        if (error) throw error;
      } else {
        if (!tenantId) throw new Error("Tenant not ready");
        const insert: TablesInsert<"vehicles"> = { ...clean, tenant_id: tenantId };
        const { error } = await supabase.from("vehicles").insert(insert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Vehicle updated" : "Vehicle added");
      qc.invalidateQueries({ queryKey: ["vehicles"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit vehicle" : "Add vehicle"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Registration *" error={form.formState.errors.registration_number?.message}>
              <Input {...form.register("registration_number")} placeholder="AB12 CDE" />
            </Field>
            <Field label="Status">
              <Select
                value={form.watch("status")}
                onValueChange={(v) => form.setValue("status", v as Enums<"vehicle_status">)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.vehicle_status.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Make *" error={form.formState.errors.make?.message}>
              <Input {...form.register("make")} placeholder="Ford" />
            </Field>
            <Field label="Model *" error={form.formState.errors.model?.message}>
              <Input {...form.register("model")} placeholder="Transit" />
            </Field>
            <Field label="Year">
              <Input type="number" {...form.register("year")} placeholder="2022" />
            </Field>
            <Field label="Color">
              <Input {...form.register("color")} placeholder="White" />
            </Field>
            <Field label="VIN">
              <Input {...form.register("vin")} />
            </Field>
            <Field label="Mileage">
              <Input type="number" {...form.register("mileage")} />
            </Field>
            <Field label="Fuel type">
              <Select
                value={form.watch("fuel_type")}
                onValueChange={(v) => form.setValue("fuel_type", v as Enums<"fuel_type">)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.fuel_type.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Transmission">
              <Select
                value={form.watch("transmission")}
                onValueChange={(v) => form.setValue("transmission", v as Enums<"transmission_type">)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.transmission_type.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Insurance expiry">
              <Input type="date" {...form.register("insurance_expiry")} />
            </Field>
            <Field label="MOT expiry">
              <Input type="date" {...form.register("mot_expiry")} />
            </Field>
          </div>
          <Field label="Notes">
            <textarea
              {...form.register("notes")}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? "Saving..." : editing ? "Save changes" : "Add vehicle"}
            </Button>
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
