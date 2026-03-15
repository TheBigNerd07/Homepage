import { useEffect, useMemo, useState } from "react";
import { Command, Search } from "lucide-react";
import { iconForName } from "../lib/icons";

export interface CommandPaletteItem {
  id: string;
  label: string;
  description: string;
  icon: string;
  keywords: string;
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  items: CommandPaletteItem[];
  onClose: () => void;
}

export function CommandPalette({ open, items, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return items.slice(0, 10);
    }
    return items
      .filter((item) =>
        `${item.label} ${item.description} ${item.keywords}`.toLowerCase().includes(normalized),
      )
      .slice(0, 12);
  }, [items, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/70 px-4 py-12 backdrop-blur-md" onClick={onClose}>
      <div
        className="panel w-full max-w-3xl p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 rounded-[24px] border border-white/8 bg-slate-950/40 px-4 py-3">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search services, pages, widgets, or actions"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-slate-400 sm:inline-flex">
            <Command className="h-3 w-3" />
            Cmd / Ctrl + K
          </div>
        </div>
        <div className="mt-4 max-h-[60vh] space-y-2 overflow-auto">
          {filtered.length ? (
            filtered.map((item) => {
              const Icon = iconForName(item.icon);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.onSelect();
                    onClose();
                  }}
                  className="flex w-full items-center gap-3 rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition hover:border-accent/25 hover:bg-white/[0.06]"
                >
                  <div className="rounded-2xl border border-white/10 bg-slate-950/40 p-3">
                    <Icon className="h-4 w-4 text-accent/90" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{item.label}</div>
                    <div className="mt-1 text-sm text-slate-400">{item.description}</div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/12 bg-slate-950/30 px-6 py-10 text-center text-sm text-slate-400">
              No results matched the current query.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
