import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
  default: "bg-slate-100 text-slate-700",
};

export function Badge({ status, children }: { status?: string; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status ?? "default"] ?? styles.default
      )}
    >
      {children}
    </span>
  );
}
