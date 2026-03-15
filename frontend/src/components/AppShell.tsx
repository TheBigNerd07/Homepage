import type { PropsWithChildren, ReactNode } from "react";
import { BookMarked, FileSearch, LayoutDashboard, LogOut, Settings2, Shield } from "lucide-react";
import type { AuthStatus, ScriptureProgress, SystemSummary } from "../types";

type ViewMode = "dashboard" | "settings" | "diagnostics";

interface AppShellProps extends PropsWithChildren {
  view: ViewMode;
  onChangeView: (view: ViewMode) => void;
  systemSummary: SystemSummary | null;
  scripture: ScriptureProgress | null;
  dashboardTitle: string;
  authStatus: AuthStatus | null;
  onLogout: () => void;
}

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
          ? "bg-accent/15 text-white shadow-[inset_0_0_0_1px_rgba(94,234,212,0.22)]"
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
    <div className="mx-auto flex min-h-screen w-full max-w-[1640px] gap-6 px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
      <aside className="panel hidden w-80 shrink-0 self-start p-6 lg:sticky lg:top-8 lg:block">
        <div>
          <div className="label">PiOne Homelab</div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">{dashboardTitle}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            A calm command center for services, system health, backups, and daily routines.
          </p>
        </div>

        <div className="mt-8 grid gap-3">
          {navButton(
            "Dashboard",
            <LayoutDashboard className="h-4 w-4" />,
            view === "dashboard",
            () => onChangeView("dashboard"),
          )}
          {navButton(
            "Settings",
            <Settings2 className="h-4 w-4" />,
            view === "settings",
            () => onChangeView("settings"),
          )}
          {navButton(
            "Diagnostics",
            <FileSearch className="h-4 w-4" />,
            view === "diagnostics",
            () => onChangeView("diagnostics"),
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
        <div className="panel mb-6 p-3 lg:hidden">
          <div className="grid gap-3 sm:grid-cols-3">
            {navButton(
              "Dashboard",
              <LayoutDashboard className="h-4 w-4" />,
              view === "dashboard",
              () => onChangeView("dashboard"),
            )}
            {navButton(
              "Settings",
              <Settings2 className="h-4 w-4" />,
              view === "settings",
              () => onChangeView("settings"),
            )}
            {navButton(
              "Diagnostics",
              <FileSearch className="h-4 w-4" />,
              view === "diagnostics",
              () => onChangeView("diagnostics"),
            )}
          </div>
          {authStatus?.enabled ? (
            <button type="button" className="button-secondary mt-3 w-full" onClick={onLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </button>
          ) : null}
        </div>
        {children}
      </main>
    </div>
  );
}
