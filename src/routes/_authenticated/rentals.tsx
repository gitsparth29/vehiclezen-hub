import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Download, CalendarRange, Search } from "lucide-react";
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
import { StatusBadge } from "@/components/shared/StatusBadge";
import { exportToCsv } from "@/lib/csv";
import { formatCurrency } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/rentals")({
  component: RentalsPage,
});

type Rental = Tables<"rentals">;
type Vehicle = Pick<Tables<"vehicles">, "id" | "registration_number" | "make" | "model">;

const schema = z.object({
  vehicle_id: z.string().uuid("Select a vehicle"),
  customer_name: z.string().trim().min(1, "Required").max(120),
  customer_email: z.string().email().optional().or(z.literal("")),
  customer_phone: z.string().max(32).optional().nullable(),
  start_date: z.string().min(1),
  end_date: z.string().min(1),
  daily_price: z.coerce.number().min(0),
  deposit: z.coerce.number().min(0),
  status: z.enum(Constants.public.Enums.rental_status),
  notes: z.string().max(1000).optional().nullable(),
}).refine((v) => new Date(v.end_date) >= new Date(v.start_date), {
  message: "End date must be on or after start date",
  path: ["end_date"],
});
type FormVals = z.infer<typeof schema>;

function daysBetween(a: string, b: string) {
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)) + 1);
}

function RentalsPage() {
  const qc = useQueryClient();
  const { data: tenantId } = useTenantId();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Rental | null>(null);
  const [toDelete, setToDelete] = useState<Rental | null>(null);

  const { data: rentals, isLoading } = useQuery({
    queryKey: ["rentals"],
    queryFn: async () => {
      const { data, error } = await supabase.from("rentals").select("*").order("start_date", { ascending: false });
      if (error) throw error;
      return data as Rental[];
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
    return (rentals ?? []).filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      const v = vMap.get(r.vehicle_id);
      return (
        r.customer_name.toLowerCase().includes(q) ||
        (v?.registration_number ?? "").toLowerCase().includes(q) ||
        (r.customer_email ?? "").toLowerCase().includes(q)
      );
    });
  }, [rentals, search, statusFilter, vMap]);

  const totalRevenue = filtered.reduce((s, r) => s + Number(r.total_amount ?? 0), 0);

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("rentals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Rental deleted");
      qc.invalidateQueries({ queryKey: ["rentals"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rentals</h1>
          <p className="text-sm text-muted-foreground">
            {rentals?.length ?? 0} rentals · {formatCurrency(totalRevenue)} revenue
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCsv("rentals.csv", filtered)} disabled={filtered.length === 0}>
            <Download className="mr-2 size-4" /> Export
          </Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="mr-2 size-4" /> New rental
          </Button>
        </div>
      </div>

      <Card className="p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search customer, vehicle, email" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Constants.public.Enums.rental_status.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="space-y-2 p-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><CalendarRange className="size-7" /></div>
            <h3 className="mt-4 text-lg font-semibold">{(rentals?.length ?? 0) > 0 ? "No rentals match" : "No rentals yet"}</h3>
            {(rentals?.length ?? 0) === 0 && (
              <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="mt-4">
                <Plus className="mr-2 size-4" /> New rental
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Daily</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const v = vMap.get(r.vehicle_id);
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.customer_name}</div>
                      <div className="text-xs text-muted-foreground">{r.customer_email ?? r.customer_phone ?? ""}</div>
                    </TableCell>
                    <TableCell className="font-medium">{v?.registration_number ?? "—"}</TableCell>
                    <TableCell>
                      <div className="text-xs">{r.start_date}</div>
                      <div className="text-xs text-muted-foreground">→ {r.end_date}</div>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(r.daily_price))}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(Number(r.total_amount ?? 0))}</TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setDialogOpen(true); }}><Pencil className="size-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => setToDelete(r)}><Trash2 className="size-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <RentalDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} tenantId={tenantId ?? null} vehicles={vehicles ?? []} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete rental?"
        destructive
        confirmLabel="Delete"
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
      />
    </div>
  );
}

function RentalDialog({
  open, onOpenChange, editing, tenantId, vehicles,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Rental | null;
  tenantId: string | null;
  vehicles: Vehicle[];
}) {
  const qc = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const form = useForm<FormVals>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    values: editing
      ? {
          vehicle_id: editing.vehicle_id,
          customer_name: editing.customer_name,
          customer_email: editing.customer_email ?? "",
          customer_phone: editing.customer_phone,
          start_date: editing.start_date,
          end_date: editing.end_date,
          daily_price: Number(editing.daily_price),
          deposit: Number(editing.deposit ?? 0),
          status: editing.status,
          notes: editing.notes,
        }
      : {
          vehicle_id: vehicles[0]?.id ?? "",
          customer_name: "",
          customer_email: "",
          customer_phone: "",
          start_date: today,
          end_date: today,
          daily_price: 0,
          deposit: 0,
          status: "active",
          notes: "",
        },
  });

  const start = form.watch("start_date");
  const end = form.watch("end_date");
  const daily = form.watch("daily_price");
  const days = start && end ? daysBetween(start, end) : 0;
  const total = days * Number(daily || 0);

  const mut = useMutation({
    mutationFn: async (values: FormVals) => {
      const clean = {
        ...values,
        customer_email: values.customer_email || null,
        customer_phone: values.customer_phone || null,
        notes: values.notes || null,
        total_amount: daysBetween(values.start_date, values.end_date) * Number(values.daily_price),
      };
      if (editing) {
        const { error } = await supabase.from("rentals").update(clean).eq("id", editing.id);
        if (error) throw error;
      } else {
        if (!tenantId) throw new Error("Tenant not ready");
        const insert: TablesInsert<"rentals"> = { ...clean, tenant_id: tenantId };
        const { error } = await supabase.from("rentals").insert(insert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Rental updated" : "Rental created");
      qc.invalidateQueries({ queryKey: ["rentals"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit rental" : "New rental"}</DialogTitle></DialogHeader>
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
            <Field label="Status">
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as Enums<"rental_status">)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.rental_status.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Customer name *" error={form.formState.errors.customer_name?.message}>
              <Input {...form.register("customer_name")} />
            </Field>
            <Field label="Email" error={form.formState.errors.customer_email?.message}>
              <Input type="email" {...form.register("customer_email")} />
            </Field>
            <Field label="Phone"><Input {...form.register("customer_phone")} /></Field>
            <Field label="Deposit"><Input type="number" step="0.01" {...form.register("deposit")} /></Field>
            <Field label="Start date *"><Input type="date" {...form.register("start_date")} /></Field>
            <Field label="End date *" error={form.formState.errors.end_date?.message}>
              <Input type="date" {...form.register("end_date")} />
            </Field>
            <Field label="Daily price *"><Input type="number" step="0.01" {...form.register("daily_price")} /></Field>
            <Field label={`Total (${days} day${days === 1 ? "" : "s"})`}>
              <Input value={formatCurrency(total)} readOnly className="bg-muted/50 font-medium" />
            </Field>
          </div>
          <Field label="Notes">
            <textarea {...form.register("notes")} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Saving..." : editing ? "Save changes" : "Create rental"}</Button>
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
