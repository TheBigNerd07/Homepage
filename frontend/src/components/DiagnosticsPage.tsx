import { Database, ExternalLink, FileSearch, Shield } from "lucide-react";
import type { DiagnosticsSummary } from "../types";
import { Card } from "./Card";
import { StatusBadge } from "./StatusBadge";

function formatBytes(value: number) {
  if (value >= 1024 * 1024) {
    return `${(value / 1024 / 1024).toFixed(1)} MB`;
  }
  if (value >= 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${value} B`;
}

export function DiagnosticsPage({ diagnostics }: { diagnostics: DiagnosticsSummary }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Diagnostics" eyebrow="Application">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
              <div className="label">Version</div>
              <div className="mt-2 text-2xl font-semibold text-white">{diagnostics.app_version}</div>
              <div className="mt-2 text-sm text-slate-400">{diagnostics.environment}</div>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
              <div className="label">Backend</div>
              <div className="mt-2 text-2xl font-semibold text-white">{diagnostics.backend_health}</div>
              <div className="mt-2 text-sm text-slate-400">
                Checked {new Date(diagnostics.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-[24px] border border-white/8 bg-slate-950/30 p-4 text-sm text-slate-300">
            <div className="flex justify-between gap-4">
              <span>Database</span>
              <span className="font-mono text-slate-200">{diagnostics.database_status}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>SQLite Path</span>
              <span className="font-mono text-slate-200">{diagnostics.database_path}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Public URL</span>
              <span className="font-mono text-slate-200">{diagnostics.public_base_url ?? "Not set"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Authentication</span>
              <span className="font-mono text-slate-200">
                {diagnostics.auth_enabled ? diagnostics.auth_username : "Disabled"}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Backups" eyebrow="Exports">
          {diagnostics.last_backup ? (
            <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
              <div className="text-sm font-semibold text-white">{diagnostics.last_backup.filename}</div>
              <div className="mt-2 text-sm text-slate-400">
                {new Date(diagnostics.last_backup.created_at).toLocaleString()}
              </div>
              <div className="mt-2 text-sm text-slate-400">
                {formatBytes(diagnostics.last_backup.size_bytes)}
              </div>
              {diagnostics.last_backup.stored_path ? (
                <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                  Stored at {diagnostics.last_backup.stored_path}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/12 bg-slate-950/30 px-5 py-8 text-sm text-slate-400">
              No export has been created yet.
            </div>
          )}
          <div className="mt-4 rounded-[24px] border border-white/8 bg-slate-950/30 p-4 text-sm text-slate-300">
            <div className="label">Backup Directory</div>
            <div className="mt-2 font-mono text-slate-200">{diagnostics.backup_dir ?? "Disabled"}</div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card title="Service Health" eyebrow="Recent Checks">
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "Online", value: diagnostics.service_health.online, status: "online" },
              { label: "Degraded", value: diagnostics.service_health.degraded, status: "degraded" },
              { label: "Offline", value: diagnostics.service_health.offline, status: "offline" },
              { label: "Unknown", value: diagnostics.service_health.unknown, status: "unknown" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] border border-white/8 bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-transparent p-4"
              >
                <div className="label">{item.label}</div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-2xl font-semibold text-white">{item.value}</span>
                  <StatusBadge status={item.status} />
                </div>
              </div>
            ))}
          </div>

          <details className="mt-5 rounded-[24px] border border-white/8 bg-slate-950/30 p-4" open>
            <summary className="cursor-pointer select-none text-sm font-semibold text-white">
              Recent check history
            </summary>
            <div className="mt-4 space-y-3">
              {diagnostics.service_health.recent_checks.length ? (
                diagnostics.service_health.recent_checks.map((check) => (
                  <div
                    key={check.id}
                    className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="text-sm font-semibold text-white">{check.service_name}</div>
                      <div className="mt-1 text-sm text-slate-400">
                        {new Date(check.checked_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm text-slate-400">
                        {check.response_time_ms !== null ? `${check.response_time_ms} ms` : check.message}
                      </span>
                      <StatusBadge status={check.status} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-400">No health check history has been recorded yet.</div>
              )}
            </div>
          </details>
        </Card>

        <Card title="Integrations" eyebrow="Runtime">
          <div className="space-y-3">
            {diagnostics.integrations.map((integration) => (
              <div
                key={integration.name}
                className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                      {integration.name === "Authentication" ? (
                        <Shield className="h-4 w-4 text-accent/80" />
                      ) : integration.name === "Docker Socket" ? (
                        <Database className="h-4 w-4 text-accent/80" />
                      ) : (
                        <FileSearch className="h-4 w-4 text-accent/80" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{integration.name}</div>
                      <div className="mt-1 text-sm text-slate-400">{integration.detail ?? "No extra detail."}</div>
                    </div>
                  </div>
                  <StatusBadge status={integration.available ? "online" : integration.enabled ? "degraded" : "unknown"} />
                </div>
              </div>
            ))}
          </div>

          {diagnostics.public_base_url ? (
            <a href={diagnostics.public_base_url} target="_blank" rel="noreferrer" className="button-secondary mt-4">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open Public URL
            </a>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
