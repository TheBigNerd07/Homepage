import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ExternalLink, Heart, Search } from "lucide-react";
import type { Node, Service, SettingsData } from "../types";
import { iconForName } from "../lib/icons";
import { Card } from "./Card";
import { StatusBadge } from "./StatusBadge";

type StatusFilter = "all" | "online" | "degraded" | "offline" | "unknown";
type GroupingMode = "category" | "node" | "favorites";

interface ServiceLauncherProps {
  services: Service[];
  nodes: Node[];
  settings: Pick<SettingsData, "density_mode" | "service_grouping">;
}

function buildGroups(services: Service[], groupingMode: GroupingMode) {
  return services.reduce<Record<string, Service[]>>((groups, service) => {
    const key =
      groupingMode === "node"
        ? service.node_name || "Unassigned"
        : groupingMode === "favorites"
          ? service.is_favorite
            ? "Favorites"
            : "Other Services"
          : service.category || "General";
    groups[key] = groups[key] ?? [];
    groups[key].push(service);
    return groups;
  }, {});
}

export function ServiceLauncher({ services, nodes, settings }: ServiceLauncherProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [groupingMode, setGroupingMode] = useState<GroupingMode>(settings.service_grouping);
  const [nodeFilter, setNodeFilter] = useState("all");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    setGroupingMode(settings.service_grouping);
  }, [settings.service_grouping]);

  const filteredServices = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    return services.filter((service) => {
      if (!service.is_enabled) {
        return false;
      }
      if (statusFilter !== "all" && service.status !== statusFilter) {
        return false;
      }
      if (nodeFilter !== "all" && String(service.node_id ?? "unassigned") !== nodeFilter) {
        return false;
      }
      if (!normalized) {
        return groupingMode !== "favorites" || service.is_favorite;
      }
      const haystack = [
        service.name,
        service.description,
        service.category,
        service.node_name ?? "",
        ...(service.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized) && (groupingMode !== "favorites" || service.is_favorite);
    });
  }, [deferredQuery, groupingMode, nodeFilter, services, statusFilter]);

  const grouped = useMemo(() => buildGroups(filteredServices, groupingMode), [filteredServices, groupingMode]);

  const cardPadding = settings.density_mode === "compact" ? "p-4" : "p-5";

  function ServiceCard({ service }: { service: Service }) {
    const Icon = iconForName(service.icon);
    return (
      <a
        href={service.url}
        target={service.open_in_new_tab ? "_blank" : "_self"}
        rel="noreferrer"
        className={`group rounded-[24px] border border-white/8 bg-gradient-to-br from-white/[0.06] via-white/[0.025] to-transparent transition hover:-translate-y-1 hover:border-accent/25 hover:bg-white/[0.07] ${cardPadding}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
            <Icon className="h-5 w-5 text-accent/90" />
          </div>
          <StatusBadge status={service.status} />
        </div>
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">{service.name}</h3>
              {service.is_favorite ? <Heart className="h-3.5 w-3.5 fill-accent/80 text-accent/80" /> : null}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{service.description}</p>
          </div>
          <ExternalLink className="h-4 w-4 text-slate-500 transition group-hover:text-accent/80" />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {service.node_name ? (
            <span className="rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1 text-[0.7rem] uppercase tracking-[0.16em] text-accent/80">
              {service.node_name}
            </span>
          ) : null}
          {service.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[0.7rem] uppercase tracking-[0.16em] text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <span>{service.has_health_check ? "Active check" : "Manual status"}</span>
          <span>
            {service.last_checked_at
              ? `Checked ${new Date(service.last_checked_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
              : service.status_reason || "No recent sample"}
          </span>
        </div>
      </a>
    );
  }

  return (
    <Card
      title="Service Launcher"
      eyebrow={`${filteredServices.length} services visible`}
      action={
        <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-center xl:justify-end">
          <div className="relative w-full xl:max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search services"
              className="input pl-10"
            />
          </div>
          <select className="input xl:w-36" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}>
            <option value="all">All statuses</option>
            <option value="online">Online</option>
            <option value="degraded">Degraded</option>
            <option value="offline">Offline</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      }
    >
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <select className="input" value={groupingMode} onChange={(event) => setGroupingMode(event.target.value as GroupingMode)}>
          <option value="category">Group by category</option>
          <option value="node">Group by node</option>
          <option value="favorites">Favorites only</option>
        </select>
        <select className="input" value={nodeFilter} onChange={(event) => setNodeFilter(event.target.value)}>
          <option value="all">All nodes</option>
          <option value="unassigned">Unassigned</option>
          {nodes.map((node) => (
            <option key={node.id} value={String(node.id)}>
              {node.name}
            </option>
          ))}
        </select>
        <div className="rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3 text-sm text-slate-300">
          Default grouping: <span className="font-medium text-white">{settings.service_grouping}</span>
        </div>
      </div>

      {Object.keys(grouped).length ? (
        <div className="space-y-6">
          {Object.keys(grouped)
            .sort()
            .map((group) => (
              <div key={group}>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div className="label">{group}</div>
                  <span className="text-xs text-slate-400">
                    {grouped[group].length} service{grouped[group].length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {grouped[group].map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-white/12 bg-slate-950/30 px-6 py-10 text-center text-sm text-slate-400">
          No services matched the current filters.
        </div>
      )}
    </Card>
  );
}
