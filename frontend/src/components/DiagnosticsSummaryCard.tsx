import type { DashboardDiagnostics } from "../types";
import { Card } from "./Card";

export function DiagnosticsSummaryCard({
  diagnostics,
  onOpenDiagnostics,
}: {
  diagnostics: DashboardDiagnostics;
  onOpenDiagnostics: () => void;
}) {
  return (
    <Card
      title="Diagnostics Summary"
      eyebrow="Runtime"
      action={
        <button type="button" className="button-secondary" onClick={onOpenDiagnostics}>
          Open Diagnostics
        </button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
          <div className="label">Backend / Database</div>
          <div className="mt-2 text-lg font-semibold text-white">
            {diagnostics.backend_health} / {diagnostics.database_status}
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Last health sample{" "}
            {diagnostics.last_health_check_at
              ? new Date(diagnostics.last_health_check_at).toLocaleString()
              : "not available"}
          </p>
        </div>
        <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
          <div className="label">Integrations</div>
          <div className="mt-2 text-lg font-semibold text-white">
            {diagnostics.integrations_available_count}/{diagnostics.integrations_total_count}
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Latest backup{" "}
            {diagnostics.last_backup_at
              ? new Date(diagnostics.last_backup_at).toLocaleString()
              : "has not been created yet"}
          </p>
        </div>
      </div>
    </Card>
  );
}
