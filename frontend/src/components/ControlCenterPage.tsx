import { Copy, Star } from "lucide-react";
import type { ControlCenterSummary, ControlItem, LogView } from "../types";
import { iconForName } from "../lib/icons";
import { Card } from "./Card";
import { StatusBadge } from "./StatusBadge";

interface ControlCenterPageProps {
  summary: ControlCenterSummary;
  logs: LogView | null;
  logSource: string;
  autoRefreshLogs: boolean;
  busy: boolean;
  onInvokeItem: (item: ControlItem) => void;
  onChangeLogSource: (source: string) => void;
  onToggleAutoRefreshLogs: (next: boolean) => void;
  onToggleFavoriteCommand: (commandKey: string) => void;
}

export function ControlCenterPage({
  summary,
  logs,
  logSource,
  autoRefreshLogs,
  busy,
  onInvokeItem,
  onChangeLogSource,
  onToggleAutoRefreshLogs,
  onToggleFavoriteCommand,
}: ControlCenterPageProps) {
  const groupedActions = summary.actions.reduce<Record<string, ControlItem[]>>((groups, item) => {
    groups[item.category] = groups[item.category] ?? [];
    groups[item.category].push(item);
    return groups;
  }, {});

  return (
    <div className="space-y-6">
      <Card title="Control Center" eyebrow="Safe Utilities">
        <div className="space-y-5">
          {Object.entries(groupedActions).map(([category, items]) => (
            <div key={category}>
              <div className="mb-3 label">{category}</div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((item) => {
                  const Icon = iconForName(item.icon);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onInvokeItem(item)}
                      className="rounded-[24px] border border-white/8 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent p-4 text-left transition hover:border-accent/25 hover:bg-white/[0.07]"
                    >
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                        <Icon className="h-4 w-4 text-accent/90" />
                      </div>
                      <div className="mt-4 text-sm font-semibold text-white">{item.title}</div>
                      <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card title="Command Utility" eyebrow="Whitelisted Commands">
          <div className="space-y-3">
            {summary.commands.map((command) => {
              const Icon = iconForName(command.icon);
              return (
                <div
                  key={command.id}
                  className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                        <Icon className="h-4 w-4 text-accent/90" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{command.title}</div>
                        <div className="mt-1 text-sm text-slate-400">{command.description}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className={`rounded-full border px-2.5 py-1 ${
                        command.is_favorite
                          ? "border-accent/25 bg-accent/10 text-accent/80"
                          : "border-white/10 bg-white/[0.04] text-slate-400"
                      }`}
                      onClick={() => command.command_key && onToggleFavoriteCommand(command.command_key)}
                    >
                      <Star className={`h-3.5 w-3.5 ${command.is_favorite ? "fill-current" : ""}`} />
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="button-primary"
                      disabled={busy}
                      onClick={() => onInvokeItem(command)}
                    >
                      Run
                    </button>
                    {command.requires_confirmation ? (
                      <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-amber-200">
                        Confirmed
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Read-Only Logs" eyebrow="Safe Sources">
          <div className="flex flex-col gap-3 sm:flex-row">
            <select className="input" value={logSource} onChange={(event) => onChangeLogSource(event.target.value)}>
              {summary.log_sources.map((source) => (
                <option key={source.id} value={source.id} disabled={!source.available}>
                  {source.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={autoRefreshLogs}
                onChange={(event) => onToggleAutoRefreshLogs(event.target.checked)}
                className="h-4 w-4 rounded border-white/10 bg-slate-950/40 text-accent focus:ring-accent/40"
              />
              Auto refresh
            </label>
          </div>
          <div className="mt-4 overflow-hidden rounded-[24px] border border-white/8 bg-slate-950/60">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3 text-xs uppercase tracking-[0.18em] text-slate-500">
              <span>{logs?.source ?? logSource}</span>
              <button
                type="button"
                className="inline-flex items-center gap-2 text-slate-400 transition hover:text-white"
                onClick={async () => {
                  if (!logs) {
                    return;
                  }
                  await navigator.clipboard.writeText(logs.lines.join("\n"));
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
            </div>
            <pre className="max-h-[420px] overflow-auto px-4 py-4 text-xs leading-6 text-slate-200">
              {(logs?.lines ?? ["Loading logs..."]).join("\n")}
            </pre>
          </div>
        </Card>
      </div>

      <Card title="Recent Action History" eyebrow="Audit Trail">
        <div className="space-y-3">
          {summary.recent_history.length ? (
            summary.recent_history.map((entry) => (
              <div
                key={entry.id}
                className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{entry.title}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {entry.category} • {new Date(entry.created_at).toLocaleString()}
                    </div>
                  </div>
                  <StatusBadge status={entry.status === "success" ? "online" : "offline"} />
                </div>
                <pre className="mt-3 overflow-x-auto rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-slate-200">
                  {entry.output}
                </pre>
              </div>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/12 bg-slate-950/30 px-6 py-10 text-center text-sm text-slate-400">
              Command and action history will appear here after the first run.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
