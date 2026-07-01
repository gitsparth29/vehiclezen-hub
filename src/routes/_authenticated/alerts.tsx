import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, Trash2, Search, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Constants } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/alerts")({
  component: AlertsPage,
});

type Alert = Tables<"alerts">;

const severityStyle: Record<string, { cls: string; icon: typeof Bell }> = {
  high: { cls: "border-rose-500/30 bg-rose-500/10 text-rose-600", icon: AlertCircle },
  medium: { cls: "border-amber-500/30 bg-amber-500/10 text-amber-600", icon: AlertTriangle },
  warning: { cls: "border-amber-500/30 bg-amber-500/10 text-amber-600", icon: AlertTriangle },
  info: { cls: "border-sky-500/30 bg-sky-500/10 text-sky-600", icon: Info },
};

function AlertsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");

  const { data: alerts, isLoading } = useQuery({
    queryKey: ["alerts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("alerts").select("*").order("alert_date", { ascending: false });
      if (error) throw error;
      return data as Alert[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (alerts ?? []).filter((a) => {
      if (severity !== "all" && a.severity !== severity) return false;
      if (readFilter === "unread" && a.is_read) return false;
      if (readFilter === "read" && !a.is_read) return false;
      if (!q) return true;
      return a.title.toLowerCase().includes(q) || (a.description ?? "").toLowerCase().includes(q);
    });
  }, [alerts, search, severity, readFilter]);

  const unreadCount = (alerts ?? []).filter((a) => !a.is_read).length;

  const toggleRead = useMutation({
    mutationFn: async ({ id, is_read }: { id: string; is_read: boolean }) => {
      const { error } = await supabase.from("alerts").update({ is_read }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("alerts").update({ is_read: true }).eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("All alerts marked as read");
      qc.invalidateQueries({ queryKey: ["alerts"] });
    },
  });
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("alerts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Alerts</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount} unread · {alerts?.length ?? 0} total
          </p>
        </div>
        <Button variant="outline" disabled={unreadCount === 0} onClick={() => markAllRead.mutate()}>
          <Check className="mr-2 size-4" /> Mark all read
        </Button>
      </div>

      <Card className="p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search alerts" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All severities</SelectItem>
              {Constants.public.Enums.alert_severity.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={readFilter} onValueChange={(v) => setReadFilter(v as typeof readFilter)}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <Card className="p-4 space-y-2 shadow-soft">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</Card>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center shadow-soft">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Bell className="size-7" /></div>
          <h3 className="mt-4 text-lg font-semibold">{(alerts?.length ?? 0) > 0 ? "No alerts match your filters" : "You're all caught up"}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {(alerts?.length ?? 0) === 0 ? "Alerts for expired documents and service due dates will appear here." : "Try clearing the filters."}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const sev = severityStyle[a.severity] ?? severityStyle.info;
            const Icon = sev.icon;
            return (
              <Card key={a.id} className={cn("p-4 shadow-soft transition-colors", !a.is_read && "border-l-4 border-l-primary")}>
                <div className="flex items-start gap-3">
                  <div className={cn("grid size-9 shrink-0 place-items-center rounded-lg border", sev.cls)}>
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-medium">{a.title}</div>
                        {a.description && <div className="mt-0.5 text-sm text-muted-foreground">{a.description}</div>}
                        <div className="mt-1 text-xs text-muted-foreground">
                          {new Date(a.alert_date).toLocaleString()} · {a.source ?? "system"}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="icon" variant="ghost"
                          onClick={() => toggleRead.mutate({ id: a.id, is_read: !a.is_read })}
                          title={a.is_read ? "Mark unread" : "Mark read"}
                        >
                          <Check className={cn("size-4", a.is_read && "text-emerald-600")} />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => del.mutate(a.id)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
