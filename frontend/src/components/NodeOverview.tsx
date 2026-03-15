import { Cpu, Server } from "lucide-react";
import type { Node } from "../types";
import { Card } from "./Card";
import { Sparkline } from "./Sparkline";
import { StatusBadge } from "./StatusBadge";

export function NodeOverview({
  nodes,
  onSelectNode,
}: {
  nodes: Node[];
  onSelectNode: (nodeId: number) => void;
}) {
  return (
    <Card title="Multi-Node Overview" eyebrow={`${nodes.length} nodes`}>
      <div className="space-y-3">
        {nodes.length ? (
          nodes.map((node) => (
            <button
              key={node.id}
              type="button"
              onClick={() => onSelectNode(node.id)}
              className="w-full rounded-[24px] border border-white/8 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent p-4 text-left transition hover:border-accent/25 hover:bg-white/[0.07]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-accent/80" />
                    <span className="text-lg font-semibold text-white">{node.name}</span>
                    {node.is_local ? (
                      <span className="rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.18em] text-accent/80">
                        Local
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {node.role} • {node.hostname}
                  </p>
                </div>
                <StatusBadge status={node.status} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_132px]">
                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/8 bg-slate-950/30 px-3 py-3">
                    <div className="label">Services</div>
                    <div className="mt-2 text-lg font-semibold text-white">{node.service_count}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-slate-950/30 px-3 py-3">
                    <div className="label">Online</div>
                    <div className="mt-2 text-lg font-semibold text-white">{node.online_service_count}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-slate-950/30 px-3 py-3">
                    <div className="label">CPU</div>
                    <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
                      <Cpu className="h-4 w-4 text-accent/80" />
                      {node.cpu_usage_percent !== null ? `${node.cpu_usage_percent}%` : "N/A"}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-950/30 px-3 py-2">
                  <Sparkline points={node.cpu_trend.map((item) => item.value)} />
                </div>
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/12 bg-slate-950/30 px-6 py-10 text-center text-sm text-slate-400">
            No nodes are configured yet.
          </div>
        )}
      </div>
    </Card>
  );
}
