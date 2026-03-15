import { useDeferredValue, useMemo, useState } from "react";
import { ExternalLink, Heart, Search } from "lucide-react";
import type { Service } from "../types";
import { iconForName } from "../lib/icons";
import { Card } from "./Card";
import { StatusBadge } from "./StatusBadge";

function groupServices(services: Service[]) {
  return services.reduce<Record<string, Service[]>>((groups, service) => {
    const key = service.category || "General";
    groups[key] = groups[key] ?? [];
    groups[key].push(service);
    return groups;
  }, {});
}

type StatusFilter = "all" | "online" | "degraded" | "offline" | "unknown";

interface ServiceLauncherProps {
  services: Service[];
  densityMode: "comfortable" | "compact";
}

export function ServiceLauncher({ services, densityMode }: ServiceLauncherProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const deferredQuery = useDeferredValue(query);

  const categories = useMemo(
    () => ["all", ...new Set(services.filter((service) => service.is_enabled).map((service) => service.category))],
    [services],
  );

  const filteredServices = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    return services.filter((service) => {
      if (!service.is_enabled) {
        return false;
      }
      if (statusFilter !== "all" && service.status !== statusFilter) {
        return false;
      }
      if (categoryFilter !== "all" && service.category !== categoryFilter) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      const haystack = [service.name, service.description, service.category, ...(service.tags ?? [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [categoryFilter, deferredQuery, services, statusFilter]);

  const favorites = useMemo(
    () => filteredServices.filter((service) => service.is_favorite),
    [filteredServices],
  );
  const grouped = useMemo(
    () => groupServices(filteredServices.filter((service) => !service.is_favorite)),
    [filteredServices],
  );

  const cardPadding = densityMode === "compact" ? "p-4" : "p-5";

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
            {service.last_response_time_ms !== null
              ? `${service.last_response_time_ms} ms`
              : service.status_reason || "No recent sample"}
          </span>
        </div>
      </a>
    );
  }

  return (
    <Card
      title="Service Launcher"
      eyebrow={`${filteredServices.length} services ready`}
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
      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.18em] transition ${
              categoryFilter === category
                ? "border border-accent/25 bg-accent/10 text-white"
                : "border border-white/10 bg-white/[0.04] text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => setCategoryFilter(category)}
          >
            {category === "all" ? "All categories" : category}
          </button>
        ))}
      </div>

      {favorites.length ? (
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="label">Favorites</div>
            <span className="text-xs text-slate-400">{favorites.length} pinned</span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {favorites.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      ) : null}

      {Object.keys(grouped).length ? (
        <div className="space-y-6">
          {Object.keys(grouped)
            .sort()
            .map((category) => (
              <div key={category}>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <div className="label">{category}</div>
                  <span className="text-xs text-slate-400">
                    {grouped[category].length} card{grouped[category].length === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {grouped[category].map((service) => (
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
