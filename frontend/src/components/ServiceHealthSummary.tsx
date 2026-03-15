import type { ServiceAvailability } from "../types";
import { Card } from "./Card";
import { StatusBadge } from "./StatusBadge";

export function ServiceHealthSummary({
  services,
}: {
  services: ServiceAvailability[];
}) {
  return (
    <Card title="Service Health" eyebrow="Availability">
      <div className="space-y-3">
        {services.length ? (
          services.map((service) => {
            const status =
              service.uptime_percent >= 95
                ? "online"
                : service.uptime_percent >= 60
                  ? "degraded"
                  : "offline";
            return (
              <div
                key={service.service_id}
                className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{service.service_name}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {service.node_name ?? "Unassigned"} •{" "}
                      {service.last_checked_at
                        ? new Date(service.last_checked_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
                        : "No recent sample"}
                    </div>
                  </div>
                  <StatusBadge status={status} />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/6">
                    <div
                      className="h-full rounded-full bg-accent/85"
                      style={{ width: `${Math.max(service.uptime_percent, 6)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-white">{service.uptime_percent}%</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {service.recent_statuses.map((statusValue, index) => (
                    <span
                      key={`${service.service_id}-${index}`}
                      className={`h-2.5 w-5 rounded-full ${
                        statusValue === "online"
                          ? "bg-emerald-400/70"
                          : statusValue === "degraded"
                            ? "bg-amber-400/70"
                            : statusValue === "offline"
                              ? "bg-rose-400/75"
                              : "bg-slate-500/60"
                      }`}
                    />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/12 bg-slate-950/30 px-6 py-10 text-center text-sm text-slate-400">
            Availability history will appear once health checks have been recorded.
          </div>
        )}
      </div>
    </Card>
  );
}
