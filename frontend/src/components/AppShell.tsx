import type { PropsWithChildren, ReactNode } from "react";
import {
  BookMarked,
  FileSearch,
  LayoutDashboard,
  LogOut,
  NotebookTabs,
  Settings2,
  Shield,
  SquareTerminal,
  Workflow,
} from "lucide-react";
import type { AuthStatus, ScriptureProgress, SystemSummary } from "../types";

export type ViewMode = "dashboard" | "control" | "nodes" | "notes" | "settings" | "diagnostics";

interface AppShellProps extends PropsWithChildren {
  view: ViewMode;
  onChangeView: (view: ViewMode) => void;
  systemSummary: SystemSummary | null;
  scripture: ScriptureProgress | null;
  dashboardTitle: string;
  authStatus: AuthStatus | null;
  onLogout: () => void;
}

const NAV_ITEMS: Array<{ id: ViewMode; label: string; icon: ReactNode }> = [
  { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { id: "control", label: "Control", icon: <SquareTerminal className="h-4 w-4" /> },
  { id: "nodes", label: "Nodes", icon: <Workflow className="h-4 w-4" /> },
  { id: "notes", label: "Notes", icon: <NotebookTabs className="h-4 w-4" /> },
  { id: "settings", label: "Settings", icon: <Settings2 className="h-4 w-4" /> },
  { id: "diagnostics", label: "Diagnostics", icon: <FileSearch className="h-4 w-4" /> },
];

function navButton(
  label: string,
  icon: ReactNode,
  active: boolean,
  onClick: () => void,
) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
        active
          ? "bg-accent/15 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.12)]"
          : "bg-white/[0.03] text-slate-300 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export function AppShell({
  view,
  onChangeView,
  systemSummary,
  scripture,
  dashboardTitle,
  authStatus,
  onLogout,
  children,
}: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1720px] gap-5 px-3 py-3 sm:px-5 sm:py-5 lg:gap-6 lg:px-8 lg:py-8">
      <aside className="panel hidden w-84 shrink-0 self-start p-6 lg:sticky lg:top-8 lg:block">
        <div>
          <div className="label">Homelab OS</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{dashboardTitle}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Multi-node dashboard, safe utilities, personal routines, and diagnostics in one calm view.
          </p>
        </div>

        <div className="mt-8 grid gap-3">
          {NAV_ITEMS.map((item) =>
            navButton(item.label, item.icon, view === item.id, () => onChangeView(item.id)),
          )}
        </div>

        <div className="mt-8 space-y-4 rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
          <div>
            <div className="label">Host</div>
            <p className="mt-2 text-lg font-semibold text-white">{systemSummary?.hostname ?? "PiOne"}</p>
          </div>
          <div>
            <div className="label">Services Online</div>
            <p className="mt-2 text-lg font-semibold text-white">
              {systemSummary
                ? `${systemSummary.online_service_count}/${systemSummary.service_count}`
                : "0/0"}
            </p>
          </div>
          <div>
            <div className="label">Reading Progress</div>
            <div className="mt-2 flex items-center gap-2 text-white">
              <BookMarked className="h-4 w-4 text-accent/80" />
              <span className="text-lg font-semibold">
                {scripture ? `${scripture.percent_complete}%` : "0%"}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              {scripture?.suggested_next_reference ?? "Ready for the first chapter"}
            </p>
          </div>
          {authStatus?.enabled ? (
            <div>
              <div className="label">Access</div>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-slate-200">
                <Shield className="h-3.5 w-3.5 text-accent/80" />
                {authStatus.username ?? "Authenticated"}
              </div>
            </div>
          ) : null}
        </div>

        {authStatus?.enabled ? (
          <button type="button" className="button-secondary mt-6 w-full" onClick={onLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </button>
        ) : null}
      </aside>

      <main className="min-w-0 flex-1">
        <div className="panel sticky top-3 z-20 mb-5 p-3 lg:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="label">Homelab OS</div>
              <div className="mt-1 text-lg font-semibold text-white">{dashboardTitle}</div>
            </div>
            {authStatus?.enabled ? (
              <button type="button" className="button-secondary px-3 py-2" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
              </button>
            ) : null}
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {NAV_ITEMS.map((item) => (
              <div key={item.id} className="shrink-0">
                {navButton(item.label, item.icon, view === item.id, () => onChangeView(item.id))}
              </div>
            ))}
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
