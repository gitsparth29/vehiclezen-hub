import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Download, Settings2, Search, LayoutGrid, List } from "lucide-react";
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
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/maintenance")({
  component: MaintenancePage,
});

type Item = Tables<"maintenance">;
type Vehicle = Pick<Tables<"vehicles">, "id" | "registration_number" | "make" | "model">;

const schema = z.object({
  vehicle_id: z.string().uuid("Select a vehicle"),
  issue: z.string().trim().min(1, "Required").max(200),
  description: z.string().max(2000).optional().nullable(),
  priority: z.enum(Constants.public.Enums.maintenance_priority),
  status: z.enum(Constants.public.Enums.maintenance_status),
  reported_date: z.string().min(1),
  completed_date: z.string().optional().nullable(),
  cost: z.coerce.number().min(0).optional().nullable(),
  assigned_to: z.string().max(120).optional().nullable(),
});
type FormVals = z.infer<typeof schema>;

const priorityColor: Record<string, string> = {
  high: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  medium: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  low: "bg-sky-500/15 text-sky-600 border-sky-500/30",
};

function MaintenancePage() {
  const qc = useQueryClient();
  const { data: tenantId } = useTenantId();
  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [toDelete, setToDelete] = useState<Item | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["maintenance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("maintenance").select("*").order("reported_date", { ascending: false });
      if (error) throw error;
      return data as Item[];
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
  const vMap = useMemo(() => new Map((vehicles ?? []).map((v) => [v.id, v])), [vehicles]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (items ?? []).filter((it) => {
      if (statusFilter !== "all" && it.status !== statusFilter) return false;
      if (!q) return true;
      const v = vMap.get(it.vehicle_id);
      return (
        it.issue.toLowerCase().includes(q) ||
        (v?.registration_number ?? "").toLowerCase().includes(q) ||
        (it.assigned_to ?? "").toLowerCase().includes(q)
      );
    });
  }, [items, search, statusFilter, vMap]);

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("maintenance").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Item deleted");
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const statusMut = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Enums<"maintenance_status"> }) => {
      const { error } = await supabase.from("maintenance").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["maintenance"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-sm text-muted-foreground">{items?.length ?? 0} issues</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-md border bg-background p-0.5">
            <Button size="sm" variant={view === "table" ? "secondary" : "ghost"} onClick={() => setView("table")}>
              <List className="size-4" />
            </Button>
            <Button size="sm" variant={view === "kanban" ? "secondary" : "ghost"} onClick={() => setView("kanban")}>
              <LayoutGrid className="size-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={() => exportToCsv("maintenance.csv", filtered)} disabled={filtered.length === 0}>
            <Download className="mr-2 size-4" /> Export
          </Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="mr-2 size-4" /> Report issue
          </Button>
        </div>
      </div>

      <Card className="p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search issue, vehicle, assignee" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {Constants.public.Enums.maintenance_status.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <Card className="p-4 shadow-soft space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center shadow-soft">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Settings2 className="size-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">{(items?.length ?? 0) > 0 ? "No issues match" : "No maintenance issues"}</h3>
          {(items?.length ?? 0) === 0 && (
            <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="mt-4">
              <Plus className="mr-2 size-4" /> Report issue
            </Button>
          )}
        </Card>
      ) : view === "table" ? (
        <Card className="shadow-soft overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reported</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead className="text-right">Cost</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => {
                const v = vMap.get(m.vehicle_id);
                return (
                  <TableRow key={m.id}>
                    <TableCell>{m.reported_date}</TableCell>
                    <TableCell className="font-medium">{v?.registration_number ?? "—"}</TableCell>
                    <TableCell>
                      <div className="font-medium">{m.issue}</div>
                      {m.description && <div className="text-xs text-muted-foreground line-clamp-1">{m.description}</div>}
                    </TableCell>
                    <TableCell>
                      <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize", priorityColor[m.priority])}>
                        {m.priority}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Select value={m.status} onValueChange={(s) => statusMut.mutate({ id: m.id, status: s as Enums<"maintenance_status"> })}>
                        <SelectTrigger className="h-8 w-[140px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Constants.public.Enums.maintenance_status.map((s) => (
                            <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>{m.assigned_to ?? "—"}</TableCell>
                    <TableCell className="text-right">{m.cost != null ? formatCurrency(Number(m.cost)) : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditing(m); setDialogOpen(true); }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setToDelete(m)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {Constants.public.Enums.maintenance_status.map((status) => {
            const col = filtered.filter((m) => m.status === status);
            return (
              <Card key={status} className="p-3 shadow-soft">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold capitalize">{status.replace(/_/g, " ")}</h3>
                  <span className="text-xs text-muted-foreground">{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.map((m) => {
                    const v = vMap.get(m.vehicle_id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => { setEditing(m); setDialogOpen(true); }}
                        className="w-full rounded-lg border bg-background p-3 text-left hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-medium">{m.issue}</div>
                          <span className={cn("shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium capitalize", priorityColor[m.priority])}>
                            {m.priority}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {v?.registration_number ?? "—"} · {m.reported_date}
                        </div>
                      </button>
                    );
                  })}
                  {col.length === 0 && <div className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">No items</div>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <MaintenanceDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} tenantId={tenantId ?? null} vehicles={vehicles ?? []} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete maintenance item?"
        destructive
        confirmLabel="Delete"
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
      />
    </div>
  );
}

function MaintenanceDialog({
  open, onOpenChange, editing, tenantId, vehicles,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Item | null;
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
          issue: editing.issue,
          description: editing.description,
          priority: editing.priority,
          status: editing.status,
          reported_date: editing.reported_date,
          completed_date: editing.completed_date,
          cost: editing.cost != null ? Number(editing.cost) : null,
          assigned_to: editing.assigned_to,
        }
      : {
          vehicle_id: vehicles[0]?.id ?? "",
          issue: "",
          description: "",
          priority: "medium",
          status: "pending",
          reported_date: new Date().toISOString().slice(0, 10),
          completed_date: null,
          cost: null,
          assigned_to: "",
        },
  });

  const mut = useMutation({
    mutationFn: async (values: FormVals) => {
      const clean = {
        ...values,
        description: values.description || null,
        assigned_to: values.assigned_to || null,
        completed_date: values.completed_date || null,
        cost: values.cost ?? null,
      };
      if (editing) {
        const { error } = await supabase.from("maintenance").update(clean).eq("id", editing.id);
        if (error) throw error;
      } else {
        if (!tenantId) throw new Error("Tenant not ready");
        const insert: TablesInsert<"maintenance"> = { ...clean, tenant_id: tenantId };
        const { error } = await supabase.from("maintenance").insert(insert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Item updated" : "Issue reported");
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{editing ? "Edit issue" : "Report issue"}</DialogTitle></DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Vehicle *" error={form.formState.errors.vehicle_id?.message}>
              <Select value={form.watch("vehicle_id")} onValueChange={(v) => form.setValue("vehicle_id", v)}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.registration_number} — {v.make} {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Issue *" error={form.formState.errors.issue?.message}>
              <Input {...form.register("issue")} placeholder="Brake noise" />
            </Field>
            <Field label="Priority">
              <Select value={form.watch("priority")} onValueChange={(v) => form.setValue("priority", v as Enums<"maintenance_priority">)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.maintenance_priority.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.watch("status")} onValueChange={(v) => form.setValue("status", v as Enums<"maintenance_status">)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.maintenance_status.map((s) => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Reported date *">
              <Input type="date" {...form.register("reported_date")} />
            </Field>
            <Field label="Completed date">
              <Input type="date" {...form.register("completed_date")} />
            </Field>
            <Field label="Assigned to">
              <Input {...form.register("assigned_to")} placeholder="Mechanic / vendor" />
            </Field>
            <Field label="Cost">
              <Input type="number" step="0.01" {...form.register("cost")} />
            </Field>
          </div>
          <Field label="Description">
            <textarea {...form.register("description")} rows={3} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending}>{mut.isPending ? "Saving..." : editing ? "Save changes" : "Report issue"}</Button>
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
