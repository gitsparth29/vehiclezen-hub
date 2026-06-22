import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  fit: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  service_due: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  maintenance: "bg-sky-500/15 text-sky-600 border-sky-500/30",
  inactive: "bg-muted text-muted-foreground border-border",
  active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  suspended: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  on_leave: "bg-amber-500/15 text-amber-600 border-amber-500/30",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = styles[status] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        cls,
      )}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
