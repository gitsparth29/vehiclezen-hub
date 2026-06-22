import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Download, FileText } from "lucide-react";
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
import { daysUntil } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/documents")({
  component: DocumentsPage,
});

type Doc = Tables<"documents">;
type Vehicle = Tables<"vehicles">;

const docSchema = z.object({
  name: z.string().trim().min(1, "Required").max(128),
  type: z.enum(Constants.public.Enums.document_type),
  vehicle_id: z.string().optional().nullable(),
  driver_id: z.string().optional().nullable(),
  expiry_date: z.string().optional().nullable(),
});
type DocForm = z.infer<typeof docSchema>;

function DocumentsPage() {
  const qc = useQueryClient();
  const { data: tenantId } = useTenantId();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Doc | null>(null);
  const [toDelete, setToDelete] = useState<Doc | null>(null);

  const { data: docs, isLoading } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      const { data, error } = await supabase.from("documents").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Doc[];
    },
  });
  const { data: vehicles } = useQuery({
    queryKey: ["vehicles", "lite"],
    queryFn: async () => {
      const { data, error } = await supabase.from("vehicles").select("id,registration_number,make,model");
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
    return (docs ?? []).filter((d) => {
      if (typeFilter !== "all" && d.type !== typeFilter) return false;
      if (!q) return true;
      return d.name.toLowerCase().includes(q);
    });
  }, [docs, search, typeFilter]);

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Document deleted");
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setToDelete(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Track expiries for insurance, MOT, registration, tax and permits.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportToCsv("documents.csv", filtered)} disabled={filtered.length === 0}>
            <Download className="mr-2 size-4" /> Export
          </Button>
          <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
            <Plus className="mr-2 size-4" /> Add document
          </Button>
        </div>
      </div>

      <Card className="p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {Constants.public.Enums.document_type.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
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
              <FileText className="size-7" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">
              {(docs?.length ?? 0) > 0 ? "No documents match your filters" : "No documents yet"}
            </h3>
            {(docs?.length ?? 0) === 0 && (
              <Button className="mt-4" onClick={() => { setEditing(null); setDialogOpen(true); }}>
                <Plus className="mr-2 size-4" /> Add document
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => {
                const days = daysUntil(d.expiry_date);
                return (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="capitalize">{d.type}</TableCell>
                    <TableCell className="text-sm">
                      {d.vehicle_id ? vehicleMap.get(d.vehicle_id) ?? "—" : "—"}
                    </TableCell>
                    <TableCell>
                      {d.expiry_date ? (
                        <div className={
                          days != null && days < 0 ? "text-destructive font-medium"
                          : days != null && days <= 30 ? "text-amber-600 font-medium"
                          : ""
                        }>
                          {d.expiry_date}
                          {days != null && (
                            <div className="text-xs opacity-80">
                              {days < 0 ? `${Math.abs(days)}d overdue` : `in ${days}d`}
                            </div>
                          )}
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
                    </TableCell>
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

      <DocDialog open={dialogOpen} onOpenChange={setDialogOpen} editing={editing} tenantId={tenantId ?? null} vehicles={vehicles ?? []} />
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete document?"
        description={`"${toDelete?.name ?? ""}" will be removed.`}
        destructive
        confirmLabel="Delete"
        onConfirm={() => toDelete && deleteMut.mutate(toDelete.id)}
      />
    </div>
  );
}

function DocDialog({
  open, onOpenChange, editing, tenantId, vehicles,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Doc | null;
  tenantId: string | null;
  vehicles: Pick<Vehicle, "id" | "registration_number" | "make" | "model">[];
}) {
  const qc = useQueryClient();
  const form = useForm<DocForm>({
    resolver: zodResolver(docSchema),
    values: editing
      ? {
          name: editing.name,
          type: editing.type,
          vehicle_id: editing.vehicle_id,
          driver_id: editing.driver_id,
          expiry_date: editing.expiry_date,
        }
      : { name: "", type: "insurance", vehicle_id: null, driver_id: null, expiry_date: null },
  });

  const mut = useMutation({
    mutationFn: async (values: DocForm) => {
      const clean = {
        ...values,
        vehicle_id: values.vehicle_id || null,
        driver_id: values.driver_id || null,
        expiry_date: values.expiry_date || null,
      };
      if (editing) {
        const { error } = await supabase.from("documents").update(clean).eq("id", editing.id);
        if (error) throw error;
      } else {
        if (!tenantId) throw new Error("Tenant not ready");
        const insert: TablesInsert<"documents"> = { ...clean, tenant_id: tenantId };
        const { error } = await supabase.from("documents").insert(insert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Document updated" : "Document added");
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit document" : "Add document"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Name *</Label>
            <Input {...form.register("name")} placeholder="e.g. Insurance certificate" />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Type</Label>
              <Select
                value={form.watch("type")}
                onValueChange={(v) => form.setValue("type", v as Enums<"document_type">)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Constants.public.Enums.document_type.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Expiry date</Label>
              <Input type="date" {...form.register("expiry_date")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium">Vehicle</Label>
              <Select
                value={form.watch("vehicle_id") ?? "none"}
                onValueChange={(v) => form.setValue("vehicle_id", v === "none" ? null : v)}
              >
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.registration_number} · {v.make} {v.model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? "Saving..." : editing ? "Save changes" : "Add document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
