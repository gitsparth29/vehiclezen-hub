import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Download, Users } from "lucide-react";
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
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { exportToCsv } from "@/lib/csv";
import { daysUntil } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/drivers")({
  component: DriversPage,
});

type Driver = Tables<"drivers">;
type Vehicle = Tables<"vehicles">;

const driverSchema = z.object({
  first_name: z.string().trim().min(1, "Required").max(64),
  last_name: z.string().trim().min(1, "Required").max(64),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z.string().max(32).optional().nullable(),
  license_number: z.string().max(64).optional().nullable(),
  license_category: z.string().max(32).optional().nullable(),
  license_expiry: z.string().optional().nullable(),
  date_of_birth: z.string().optional().nullable(),
  address: z.string().max(255).optional().nullable(),
  emergency_contact: z.string().max(128).optional().nullable(),
  emergency_phone: z.string().max(32).optional().nullable(),
  status: z.enum(Constants.public.Enums.driver_status),
  assigned_vehicle_id: z.string().optional().nullable(),
});

type DriverForm = z.infer<typeof driverSchema>;

function DriversPage() {
  const qc = useQueryClient();
  const { data: tenantId } = useTenantId();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [toDelete, setToDelete] = useState<Driver | null>(null);

  const { data: drivers, isLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Driver[];
    },
  });

  const { data: vehicles } = useQuery({
    queryKey: ["vehicles", "lite"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vehicles")
        .select("id,registration_number,make,model");
      if (error) throw error;
      return data as Pick<Vehicle, "id" | "registration_number" | "make" | "model">[];
    },
  });

  const vehicleMap = useMemo(() => {
    const m = new Map<string, string>();
    (vehicles ?? []).forEach((v) => m.set(v.id, `${v.registration_number} · ${v.make} ${v.model}`));
    return m;
  }, [vehicles]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (drivers ?? []).filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (!q) return true;
      return (
        d.first_name.toLowerCase().includes(q) ||
        d.last_name.toLowerCase().includes(q) ||
        (d.email ?? "").toLowerCase().includes(q) ||
        (d.license_number ?? "").toLowerCase().includes(q)
      );
    });
  }, [drivers, search, statusFilter]);

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("drivers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Driver deleted");
      qc.invalidateQueries({ queryKey: ["drivers"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Drivers</h1>
          <p className="text-sm text-muted-foreground">
            {drivers?.length ?? 0} driver{drivers?.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => exportToCsv("drivers.csv", filtered)}
            disabled={filtered.length === 0}
          >
            <Download className="mr-2 size-4" /> Export
          </Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="mr-2 size-4" /> Add driver
          </Button>
        </div>
      </div>

      <Card className="p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search name, email or license"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Constants.public.Enums.driver_status.map((s) => (
                <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Users className="size-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              {(drivers?.length ?? 0) > 0 ? "No drivers match your filters" : "No drivers yet"}
            </h3>
            {(drivers?.length ?? 0) === 0 && (
              <Button className="mt-4" onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <Plus className="mr-2 size-4" /> Add driver
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Assigned vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => {
                const days = daysUntil(d.license_expiry);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.first_name} {d.last_name}</TableCell>
                    <TableCell>
                      <div className="text-sm">{d.email ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{d.phone ?? ""}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{d.license_number ?? "—"} {d.license_category ? `(${d.license_category})` : ""}</div>
                      {d.license_expiry && (
                        <div className={
                          days != null && days < 0 ? "text-xs text-destructive font-medium"
                          : days != null && days <= 30 ? "text-xs text-amber-600 font-medium"
                          : "text-xs text-muted-foreground"
                        }>
                          exp {d.license_expiry}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {d.assigned_vehicle_id ? vehicleMap.get(d.assigned_vehicle_id) ?? "—" : "—"}
                    </TableCell>
                    <TableCell><StatusBadge status={d.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(d); setDialogOpen(true); }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setToDelete(d)}>
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

      <DriverDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        tenantId={tenantId ?? null}
        vehicles={vehicles ?? []}
      />

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete driver?"
        description={`${toDelete?.first_name ?? ""} ${toDelete?.last_name ?? ""} will be removed permanently.`}
        destructive
        confirmLabel="Delete"
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
      />
    </div>
  );
}

function DriverDialog({
  open, onOpenChange, editing, tenantId, vehicles,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Driver | null;
  tenantId: string | null;
  vehicles: Pick<Vehicle, "id" | "registration_number" | "make" | "model">[];
}) {
  const qc = useQueryClient();
  const form = useForm<DriverForm>({
    resolver: zodResolver(driverSchema),
    values: editing
      ? {
          first_name: editing.first_name,
          last_name: editing.last_name,
          email: editing.email ?? "",
          phone: editing.phone,
          license_number: editing.license_number,
          license_category: editing.license_category,
          license_expiry: editing.license_expiry,
          date_of_birth: editing.date_of_birth,
          address: editing.address,
          emergency_contact: editing.emergency_contact,
          emergency_phone: editing.emergency_phone,
          status: editing.status,
          assigned_vehicle_id: editing.assigned_vehicle_id,
        }
      : {
          first_name: "", last_name: "", email: "", phone: "",
          license_number: "", license_category: "", license_expiry: null,
          date_of_birth: null, address: "", emergency_contact: "", emergency_phone: "",
          status: "active", assigned_vehicle_id: null,
        },
  });

  const mut = useMutation({
    mutationFn: async (values: DriverForm) => {
      const clean = {
        ...values,
        email: values.email || null,
        phone: values.phone || null,
        license_number: values.license_number || null,
        license_category: values.license_category || null,
        license_expiry: values.license_expiry || null,
        date_of_birth: values.date_of_birth || null,
        address: values.address || null,
        emergency_contact: values.emergency_contact || null,
        emergency_phone: values.emergency_phone || null,
        assigned_vehicle_id: values.assigned_vehicle_id || null,
      };
      if (editing) {
        const { error } = await supabase.from("drivers").update(clean).eq("id", editing.id);
        if (error) throw error;
      } else {
        if (!tenantId) throw new Error("Tenant not ready");
        const insert: TablesInsert<"drivers"> = { ...clean, tenant_id: tenantId };
        const { error } = await supabase.from("drivers").insert(insert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Driver updated" : "Driver added");
      qc.invalidateQueries({ queryKey: ["drivers"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit driver" : "Add driver"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name *" error={form.formState.errors.first_name?.message}>
              <Input {...form.register("first_name")} />
            </Field>
            <Field label="Last name *" error={form.formState.errors.last_name?.message}>
              <Input {...form.register("last_name")} />
            </Field>
            <Field label="Email" error={form.formState.errors.email?.message}>
              <Input type="email" {...form.register("email")} />
            </Field>
            <Field label="Phone">
              <Input {...form.register("phone")} />
            </Field>
            <Field label="License number">
              <Input {...form.register("license_number")} />
            </Field>
            <Field label="License category">
              <Input {...form.register("license_category")} placeholder="B, C, D, etc." />
            </Field>
            <Field label="License expiry">
              <Input type="date" {...form.register("license_expiry")} />
            </Field>
            <Field label="Date of birth">
              <Input type="date" {...form.register("date_of_birth")} />
            </Field>
            <Field label="Status">
              <Select
                value={form.watch("status")}
                onValueChange={(v) => form.setValue("status", v as Enums<"driver_status">)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.driver_status.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Assigned vehicle">
              <Select
                value={form.watch("assigned_vehicle_id") ?? "none"}
                onValueChange={(v) => form.setValue("assigned_vehicle_id", v === "none" ? null : v)}
              >
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.registration_number} · {v.make} {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Emergency contact">
              <Input {...form.register("emergency_contact")} />
            </Field>
            <Field label="Emergency phone">
              <Input {...form.register("emergency_phone")} />
            </Field>
          </div>
          <Field label="Address">
            <Input {...form.register("address")} />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? "Saving..." : editing ? "Save changes" : "Add driver"}
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
