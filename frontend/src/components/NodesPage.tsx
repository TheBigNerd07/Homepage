import { Cpu, HardDrive, Server } from "lucide-react";
import { useMemo, useState } from "react";
import type { Node, Service } from "../types";
import { Card } from "./Card";
import { ServiceLauncher } from "./ServiceLauncher";
import { Sparkline } from "./Sparkline";
import { StatusBadge } from "./StatusBadge";

export function NodesPage({
  nodes,
  services,
}: {
  nodes: Node[];
  services: Service[];
}) {
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(nodes[0]?.id ?? null);
  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? nodes[0] ?? null,
    [nodes, selectedNodeId],
  );
  const nodeServices = useMemo(
    () => services.filter((service) => service.node_id === selectedNode?.id),
    [selectedNode?.id, services],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card title="Nodes" eyebrow={`${nodes.length} configured`}>
          <div className="space-y-3">
            {nodes.map((node) => (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedNodeId(node.id)}
                className={`w-full rounded-[24px] border p-4 text-left transition ${
                  selectedNode?.id === node.id
                    ? "border-accent/25 bg-accent/10"
                    : "border-white/8 bg-slate-950/30 hover:border-white/15 hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
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
              </button>
            ))}
          </div>
        </Card>

        <Card title={selectedNode?.name ?? "Node Details"} eyebrow={selectedNode?.hostname ?? "No selection"}>
          {selectedNode ? (
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
                  <Server className="h-4 w-4 text-accent/80" />
                  <div className="mt-3 text-2xl font-semibold text-white">{selectedNode.service_count}</div>
                  <div className="mt-1 text-sm text-slate-400">Assigned services</div>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
                  <Cpu className="h-4 w-4 text-accent/80" />
                  <div className="mt-3 text-2xl font-semibold text-white">
                    {selectedNode.cpu_usage_percent !== null ? `${selectedNode.cpu_usage_percent}%` : "N/A"}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">Current CPU</div>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
                  <HardDrive className="h-4 w-4 text-accent/80" />
                  <div className="mt-3 text-2xl font-semibold text-white">
                    {selectedNode.disk_used_percent !== null ? `${selectedNode.disk_used_percent}%` : "N/A"}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">Disk usage</div>
                </div>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
                  <div className="label">CPU Trend</div>
                  <div className="mt-3">
                    <Sparkline points={selectedNode.cpu_trend.map((item) => item.value)} />
                  </div>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
                  <div className="label">Memory Trend</div>
                  <div className="mt-3">
                    <Sparkline points={selectedNode.memory_trend.map((item) => item.value)} />
                  </div>
                </div>
              </div>
              <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4 text-sm text-slate-300">
                <div className="label">Description</div>
                <p className="mt-2 leading-6 text-slate-200">{selectedNode.description || "No description provided."}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/12 bg-slate-950/30 px-6 py-10 text-center text-sm text-slate-400">
              Select a node to view details.
            </div>
          )}
        </Card>
      </div>

      {selectedNode ? (
        <ServiceLauncher
          services={nodeServices}
          nodes={nodes}
          settings={{ density_mode: "compact", service_grouping: "node" }}
        />
      ) : null}
    </div>
  );
}
