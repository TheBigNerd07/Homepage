import { ArrowUpRight } from "lucide-react";
import type { DashboardAction } from "../types";
import { iconForName } from "../lib/icons";
import { Card } from "./Card";

interface QuickActionsProps {
  actions: DashboardAction[];
  busy: boolean;
  onInvoke: (action: DashboardAction) => void;
}

export function QuickActions({ actions, onInvoke, busy }: QuickActionsProps) {
  return (
    <Card title="Quick Actions" eyebrow="Control Center">
      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => {
          const Icon = iconForName(action.icon);
          const content = (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                  <Icon className="h-4 w-4 text-accent/90" />
                </div>
                {action.kind === "link" ? (
                  <ArrowUpRight className="h-4 w-4 text-slate-500" />
                ) : null}
              </div>
              <div className="mt-4">
                <div className="text-sm font-semibold text-white">{action.name}</div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{action.description}</p>
              </div>
            </>
          );

          if (action.kind === "link" && action.url) {
            return (
              <a
                key={action.id}
                href={action.url}
                target={action.open_in_new_tab ? "_blank" : "_self"}
                rel="noreferrer"
                className="rounded-[24px] border border-white/8 bg-gradient-to-br from-white/[0.06] via-white/[0.025] to-transparent p-4 transition hover:-translate-y-0.5 hover:border-accent/20 hover:bg-white/[0.07]"
              >
                {content}
              </a>
            );
          }

          return (
            <button
              key={action.id}
              type="button"
              disabled={busy}
              onClick={() => onInvoke(action)}
              className="rounded-[24px] border border-white/8 bg-gradient-to-br from-white/[0.06] via-white/[0.025] to-transparent p-4 text-left transition hover:-translate-y-0.5 hover:border-accent/20 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {content}
            </button>
          );
        })}
      </div>
      <div className="mt-4 rounded-[24px] border border-dashed border-white/12 bg-slate-950/30 px-4 py-4 text-sm text-slate-400">
        Safe links are configurable in settings. Backend actions stay tightly scoped to avoid turning the dashboard into a remote shell.
      </div>
    </Card>
  );
}
