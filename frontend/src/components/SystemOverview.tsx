import { Activity, Cpu, HardDrive, Thermometer, TimerReset, Wifi } from "lucide-react";
import type { SystemSummary } from "../types";
import { Card } from "./Card";
import { Sparkline } from "./Sparkline";

const integerFormatter = new Intl.NumberFormat();

function formatRate(value: number | null) {
  if (value === null) {
    return "Unavailable";
  }
  if (value >= 1024 * 1024) {
    return `${(value / 1024 / 1024).toFixed(1)} MB/s`;
  }
  if (value >= 1024) {
    return `${(value / 1024).toFixed(1)} KB/s`;
  }
  return `${value.toFixed(0)} B/s`;
}

export function SystemOverview({ summary }: { summary: SystemSummary }) {
  const metrics = [
    {
      label: "CPU",
      value: summary.cpu_usage_percent !== null ? `${summary.cpu_usage_percent}%` : "Gathering",
      note: summary.load_average.length ? `Load ${summary.load_average.join(" / ")}` : "Load unavailable",
      icon: <Cpu className="h-4 w-4 text-accent/80" />,
      trend: summary.cpu_trend.map((item) => item.value),
    },
    {
      label: "Memory",
      value: summary.memory.used_percent !== null ? `${summary.memory.used_percent}%` : "Unavailable",
      note:
        summary.memory.used_mb !== null && summary.memory.total_mb !== null
          ? `${integerFormatter.format(summary.memory.used_mb)} / ${integerFormatter.format(summary.memory.total_mb)} MB`
          : "Memory stats unavailable",
      icon: <Activity className="h-4 w-4 text-accent/80" />,
      trend: summary.memory_trend.map((item) => item.value),
    },
    {
      label: "Disk",
      value: summary.disk.used_percent !== null ? `${summary.disk.used_percent}%` : "Unavailable",
      note:
        summary.disk.used_gb !== null && summary.disk.total_gb !== null
          ? `${summary.disk.used_gb} / ${summary.disk.total_gb} GB`
          : "Disk stats unavailable",
      icon: <HardDrive className="h-4 w-4 text-accent/80" />,
      trend: summary.disk_trend.map((item) => item.value),
    },
  ];

  return (
    <Card title="System Overview" eyebrow={summary.hostname}>
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(12rem,1fr))]">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="min-w-0 rounded-[24px] border border-white/8 bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-transparent p-4"
          >
            <div className="flex items-center justify-between text-slate-300">
              <span className="label">{metric.label}</span>
              {metric.icon}
            </div>
            <div className="mt-3 break-words text-xl font-semibold leading-tight text-white sm:text-2xl">
              {metric.value}
            </div>
            <div className="mt-2 break-words text-sm leading-6 text-slate-400">{metric.note}</div>
            <div className="mt-4">
              <Sparkline points={metric.trend} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(16rem,1fr))]">
        <div className="min-w-0 rounded-[24px] border border-white/8 bg-slate-950/30 p-4 text-sm text-slate-300">
          <div className="mb-4 flex items-center gap-2 text-slate-200">
            <Wifi className="h-4 w-4 text-accent/80" />
            <span className="label">Network</span>
          </div>
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(10rem,1fr))]">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Receive</div>
              <div className="mt-2 break-words text-base font-semibold leading-tight text-white sm:text-lg">
                {formatRate(summary.network.rx_bytes_per_second)}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Transmit</div>
              <div className="mt-2 break-words text-base font-semibold leading-tight text-white sm:text-lg">
                {formatRate(summary.network.tx_bytes_per_second)}
              </div>
            </div>
          </div>
        </div>

        <div className="min-w-0 rounded-[24px] border border-white/8 bg-slate-950/30 p-4 text-sm text-slate-300">
          <div className="mb-4 flex items-center gap-2 text-slate-200">
            <Thermometer className="h-4 w-4 text-accent/80" />
            <span className="label">Runtime</span>
          </div>
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(10rem,1fr))]">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Uptime</div>
              <div className="mt-2 flex flex-wrap items-center gap-2 break-words text-base font-semibold leading-tight text-white sm:text-lg">
                <TimerReset className="h-4 w-4 text-accent/80" />
                {summary.uptime_label ?? "Unavailable"}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Temperature</div>
              <div className="mt-2 break-words text-base font-semibold leading-tight text-white sm:text-lg">
                {summary.temperature_c !== null ? `${summary.temperature_c} C` : "Unavailable"}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Containers</div>
              <div className="mt-2 break-words text-base font-semibold leading-tight text-white sm:text-lg">
                {summary.docker.running_count ?? "Unavailable"}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Healthy / Unhealthy</div>
              <div className="mt-2 break-words text-base font-semibold leading-tight text-white sm:text-lg">
                {summary.docker.available
                  ? `${summary.docker.healthy_count ?? 0} / ${summary.docker.unhealthy_count ?? 0}`
                  : "Socket off"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-[24px] border border-white/8 bg-slate-950/30 p-4 text-sm text-slate-300 [grid-template-columns:repeat(auto-fit,minmax(11rem,1fr))]">
        <div className="min-w-0 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Online Services</div>
          <div className="mt-2 break-words font-mono text-slate-200">
            {summary.online_service_count}/{summary.service_count}
          </div>
        </div>
        <div className="min-w-0 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Degraded</div>
          <div className="mt-2 break-words font-mono text-slate-200">{summary.degraded_service_count}</div>
        </div>
        <div className="min-w-0 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Offline</div>
          <div className="mt-2 break-words font-mono text-slate-200">{summary.offline_service_count}</div>
        </div>
        <div className="min-w-0 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Updated</div>
          <div className="mt-2 break-words font-mono text-slate-200">
            {summary.last_updated_at ? new Date(summary.last_updated_at).toLocaleTimeString() : "Now"}
          </div>
        </div>
      </div>
    </Card>
  );
}
