import { toast } from "sonner";

export function exportToCsv<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  headers?: { key: keyof T; label: string }[],
) {
  if (!rows || rows.length === 0) {
    toast.info("Nothing to export yet.");
    return;
  }
  const cols = headers ?? (Object.keys(rows[0]).map((k) => ({ key: k as keyof T, label: k })));
  const escape = (v: unknown) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    cols.map((c) => c.label).join(","),
    ...rows.map((r) => cols.map((c) => escape(r[c.key])).join(",")),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast.success(`Exported ${rows.length} row${rows.length === 1 ? "" : "s"}`);
}
