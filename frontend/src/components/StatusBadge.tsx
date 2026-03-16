import clsx from "clsx";

const statusStyles: Record<string, string> = {
  online: "border-emerald-400/25 bg-emerald-400/12 text-emerald-200",
  degraded: "border-amber-400/25 bg-amber-400/12 text-amber-200",
  offline: "border-rose-400/25 bg-rose-400/12 text-rose-200",
  unknown: "border-slate-400/20 bg-slate-400/10 text-slate-300",
};

export function StatusBadge({ status }: { status: string }) {
  const normalized = statusStyles[status] ? status : "unknown";
  return (
    <span
      className={clsx(
        "inline-flex shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-[0.18em]",
        statusStyles[normalized],
      )}
    >
      {normalized}
    </span>
  );
}
