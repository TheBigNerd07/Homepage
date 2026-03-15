import { startTransition, useEffect, useState } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { ApiError, api } from "./lib/api";
import { hexToRgbTuple } from "./lib/color";
import { AppShell } from "./components/AppShell";
import { DailyBriefingCard } from "./components/DailyBriefingCard";
import { DiagnosticsPage } from "./components/DiagnosticsPage";
import { LoginScreen } from "./components/LoginScreen";
import { NavidromeWidget } from "./components/NavidromeWidget";
import { QuickActions } from "./components/QuickActions";
import { RemindersCard } from "./components/RemindersCard";
import { ScriptureTracker } from "./components/ScriptureTracker";
import { ServiceLauncher } from "./components/ServiceLauncher";
import { SettingsPanel } from "./components/SettingsPanel";
import { SystemOverview } from "./components/SystemOverview";
import { TimeCard } from "./components/TimeCard";
import type {
  AuthStatus,
  DashboardSummary,
  DiagnosticsSummary,
  QuickActionLink,
  Reminder,
  Service,
  SettingsData,
  ScriptureChapter,
} from "./types";

type ViewMode = "dashboard" | "settings" | "diagnostics";

function LoadingState() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="panel animate-pulse p-6">
          <div className="h-4 w-24 rounded-full bg-white/8" />
          <div className="mt-4 h-10 w-2/3 rounded-full bg-white/6" />
          <div className="mt-6 h-36 rounded-[24px] bg-white/5" />
        </div>
      ))}
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
}

export default function App() {
  const [view, setView] = useState<ViewMode>("dashboard");
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [settingsData, setSettingsData] = useState<SettingsData | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [quickActions, setQuickActions] = useState<QuickActionLink[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [chapters, setChapters] = useState<ScriptureChapter[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsSummary | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [loading, setLoading] = useState(true);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const accentColor = settingsData?.accent_color ?? dashboard?.settings.accent_color ?? "#5EEAD4";
  const dashboardTitle = settingsData?.dashboard_title ?? dashboard?.settings.dashboard_title ?? "PiOne Command Center";

  function showNotice(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(null), 2600);
  }

  async function handleApiError(actionError: unknown, fallbackMessage: string): Promise<boolean> {
    if (actionError instanceof ApiError && actionError.status === 401) {
      try {
        const nextAuthStatus = await api.getAuthStatus();
        setAuthStatus(nextAuthStatus);
      } catch {
        setAuthStatus({ enabled: true, authenticated: false, username: null });
      }
      setDashboard(null);
      setSettingsData(null);
      setDiagnostics(null);
      setLoading(false);
      setBootstrapping(false);
      return true;
    }
    setError(actionError instanceof Error ? actionError.message : fallbackMessage);
    return false;
  }

  async function loadDashboard(initial = false) {
    if (initial) {
      setLoading(true);
    }
    try {
      const [summary, nextChapters] = await Promise.all([
        api.getDashboardSummary(),
        api.getScriptureChapters(),
      ]);
      startTransition(() => {
        setDashboard(summary);
        setChapters(nextChapters);
        setError(null);
        setLoading(false);
      });
    } catch (loadError) {
      const handled = await handleApiError(loadError, "Failed to load dashboard.");
      if (!handled) {
        setLoading(false);
      }
    }
  }

  async function loadSettingsWorkspace() {
    try {
      setSettingsLoading(true);
      const [nextSettings, nextServices, nextQuickActions, nextReminders, nextChapters, nextDiagnostics] =
        await Promise.all([
          api.getSettings(),
          api.getServices(),
          api.getQuickActions(),
          api.getReminders("all"),
          api.getScriptureChapters(),
          api.getDiagnosticsSummary(),
        ]);
      startTransition(() => {
        setSettingsData(nextSettings);
        setServices(nextServices);
        setQuickActions(nextQuickActions);
        setReminders(nextReminders);
        setChapters(nextChapters);
        setDiagnostics(nextDiagnostics);
      });
    } catch (loadError) {
      await handleApiError(loadError, "Failed to load settings workspace.");
    } finally {
      setSettingsLoading(false);
    }
  }

  async function loadDiagnostics() {
    try {
      setDiagnosticsLoading(true);
      const nextDiagnostics = await api.getDiagnosticsSummary();
      setDiagnostics(nextDiagnostics);
    } catch (loadError) {
      await handleApiError(loadError, "Failed to load diagnostics.");
    } finally {
      setDiagnosticsLoading(false);
    }
  }

  async function refreshCurrentWorkspace() {
    await Promise.all([
      loadDashboard(),
      view === "settings" ? loadSettingsWorkspace() : Promise.resolve(),
      view === "diagnostics" ? loadDiagnostics() : Promise.resolve(),
    ]);
  }

  async function withBusy(action: () => Promise<void>) {
    try {
      setBusy(true);
      await action();
    } catch (actionError) {
      await handleApiError(actionError, "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  async function bootstrap() {
    try {
      const nextAuthStatus = await api.getAuthStatus();
      setAuthStatus(nextAuthStatus);
      if (nextAuthStatus.authenticated) {
        await Promise.all([loadDashboard(true), loadDiagnostics()]);
      } else {
        setLoading(false);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to initialize the app.");
      setLoading(false);
    } finally {
      setBootstrapping(false);
    }
  }

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    if (!authStatus?.authenticated) {
      return;
    }
    if (view === "settings" && !settingsData && !settingsLoading) {
      void loadSettingsWorkspace();
    }
    if (view === "diagnostics" && !diagnostics && !diagnosticsLoading) {
      void loadDiagnostics();
    }
  }, [authStatus?.authenticated, diagnostics, diagnosticsLoading, settingsData, settingsLoading, view]);

  useEffect(() => {
    if (!authStatus?.authenticated || view !== "dashboard") {
      return;
    }
    const interval = window.setInterval(() => {
      void loadDashboard();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [authStatus?.authenticated, view]);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent-rgb", hexToRgbTuple(accentColor));
  }, [accentColor]);

  const nextChapterId = chapters.find((chapter) => !chapter.is_completed)?.id;

  if (bootstrapping) {
    return (
      <div className="mx-auto flex min-h-screen max-w-[1600px] items-center justify-center px-4 py-8">
        <div className="panel flex items-center gap-3 px-6 py-5 text-slate-200">
          <LoaderCircle className="h-5 w-5 animate-spin text-accent/80" />
          Preparing PiOne Command Center...
        </div>
      </div>
    );
  }

  if (authStatus?.enabled && !authStatus.authenticated) {
    return (
      <LoginScreen
        username={authStatus.username ?? "admin"}
        busy={loginBusy}
        error={loginError}
        onLogin={async (password) => {
          try {
            setLoginBusy(true);
            setLoginError(null);
            const nextAuthStatus = await api.login(authStatus.username ?? "admin", password);
            setAuthStatus(nextAuthStatus);
            await Promise.all([loadDashboard(true), loadDiagnostics()]);
            setView("dashboard");
          } catch (loginActionError) {
            setLoginError(
              loginActionError instanceof Error ? loginActionError.message : "Sign-in failed.",
            );
          } finally {
            setLoginBusy(false);
          }
        }}
      />
    );
  }

  return (
    <AppShell
      view={view}
      onChangeView={setView}
      systemSummary={dashboard?.system_summary ?? null}
      scripture={dashboard?.scripture ?? null}
      dashboardTitle={dashboardTitle}
      authStatus={authStatus}
      onLogout={() => {
        void withBusy(async () => {
          const nextAuthStatus = await api.logout();
          setAuthStatus(nextAuthStatus);
          setDashboard(null);
          setSettingsData(null);
          setDiagnostics(null);
          setLoading(false);
        });
      }}
    >
      {error ? (
        <div className="mb-6 flex items-start gap-3 rounded-[24px] border border-rose-400/20 bg-rose-400/10 px-4 py-4 text-sm text-rose-100">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      {notice ? (
        <div className="mb-6 rounded-[24px] border border-accent/20 bg-accent/10 px-4 py-4 text-sm text-accent/90">
          {notice}
        </div>
      ) : null}

      {loading || !dashboard ? (
        <LoadingState />
      ) : view === "dashboard" ? (
        <div className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <DailyBriefingCard briefing={dashboard.daily_briefing} />
            <TimeCard />
          </div>

          <div className="grid gap-6 2xl:grid-cols-[1.45fr_0.75fr]">
            <ServiceLauncher
              services={dashboard.services}
              densityMode={dashboard.settings.density_mode}
            />
            <div className="space-y-6">
              <SystemOverview summary={dashboard.system_summary} />
              <QuickActions
                actions={dashboard.quick_actions}
                busy={busy}
                onInvoke={(action) => {
                  if (action.requires_confirmation && !window.confirm(action.confirmation_message ?? "Continue?")) {
                    return;
                  }
                  if (action.kind === "view") {
                    setView(action.action_key === "open_settings" ? "settings" : "diagnostics");
                    if (action.action_key === "open_diagnostics") {
                      void loadDiagnostics();
                    }
                    return;
                  }
                  if (action.kind === "download") {
                    void withBusy(async () => {
                      const exportResult = await api.exportBackup();
                      downloadBlob(exportResult.blob, exportResult.filename);
                      await Promise.all([loadDiagnostics(), loadSettingsWorkspace()]);
                      showNotice("Backup exported.");
                    });
                    return;
                  }
                  if (action.kind === "backend" && action.action_key) {
                    const actionKey = action.action_key;
                    void withBusy(async () => {
                      const result = await api.runAction(actionKey);
                      await Promise.all([refreshCurrentWorkspace(), loadDiagnostics()]);
                      showNotice(result.message);
                    });
                  }
                }}
              />
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <NavidromeWidget widget={dashboard.navidrome} />
            <ScriptureTracker
              progress={dashboard.scripture}
              chapters={chapters}
              busy={busy}
              onCompleteChapter={async (chapterId) => {
                await withBusy(async () => {
                  await api.completeChapter(chapterId);
                  await Promise.all([loadDashboard(), settingsData ? loadSettingsWorkspace() : Promise.resolve()]);
                  showNotice("Reading progress updated.");
                });
              }}
            />
          </div>

          <RemindersCard
            reminders={dashboard.reminders}
            defaultReminderTime={dashboard.settings.default_reminder_time}
            busy={busy}
            onToggleReminder={async (reminderId, completed) => {
              await withBusy(async () => {
                await api.toggleReminder(reminderId, completed);
                await Promise.all([loadDashboard(), settingsData ? loadSettingsWorkspace() : Promise.resolve()]);
              });
            }}
            onCreateReminder={async (payload) => {
              await withBusy(async () => {
                await api.createReminder(payload);
                await Promise.all([loadDashboard(), settingsData ? loadSettingsWorkspace() : Promise.resolve()]);
                showNotice("Reminder added.");
              });
            }}
          />
        </div>
      ) : view === "settings" ? (
        settingsData ? (
          settingsLoading ? (
            <div className="panel flex items-center justify-center gap-3 px-6 py-12 text-slate-300">
              <LoaderCircle className="h-5 w-5 animate-spin text-accent/80" />
              Loading settings workspace...
            </div>
          ) : (
            <SettingsPanel
              settings={settingsData}
              services={services}
              quickActions={quickActions}
              reminders={reminders}
              diagnostics={diagnostics}
              busy={busy}
              onSaveSettings={async (payload) => {
                await withBusy(async () => {
                  await api.updateSettings(payload);
                  await Promise.all([loadDashboard(), loadSettingsWorkspace()]);
                  showNotice("Settings saved.");
                });
              }}
              onSaveService={async (serviceId, payload) => {
                await withBusy(async () => {
                  if (serviceId) {
                    await api.updateService(serviceId, payload);
                  } else {
                    await api.createService(payload);
                  }
                  await Promise.all([loadDashboard(), loadSettingsWorkspace()]);
                  showNotice(serviceId ? "Service updated." : "Service added.");
                });
              }}
              onDeleteService={async (serviceId) => {
                await withBusy(async () => {
                  await api.deleteService(serviceId);
                  await Promise.all([loadDashboard(), loadSettingsWorkspace()]);
                  showNotice("Service removed.");
                });
              }}
              onReorderServices={async (orderedIds) => {
                await withBusy(async () => {
                  await api.reorderServices(orderedIds);
                  await Promise.all([loadDashboard(), loadSettingsWorkspace()]);
                });
              }}
              onSaveQuickAction={async (actionId, payload) => {
                await withBusy(async () => {
                  if (actionId) {
                    await api.updateQuickAction(actionId, payload);
                  } else {
                    await api.createQuickAction(payload);
                  }
                  await Promise.all([loadDashboard(), loadSettingsWorkspace()]);
                  showNotice(actionId ? "Quick action updated." : "Quick action added.");
                });
              }}
              onDeleteQuickAction={async (actionId) => {
                await withBusy(async () => {
                  await api.deleteQuickAction(actionId);
                  await Promise.all([loadDashboard(), loadSettingsWorkspace()]);
                  showNotice("Quick action removed.");
                });
              }}
              onReorderQuickActions={async (orderedIds) => {
                await withBusy(async () => {
                  await api.reorderQuickActions(orderedIds);
                  await Promise.all([loadDashboard(), loadSettingsWorkspace()]);
                });
              }}
              onSaveReminder={async (reminderId, payload) => {
                await withBusy(async () => {
                  if (reminderId) {
                    await api.updateReminder(reminderId, payload);
                  } else {
                    await api.createReminder(payload);
                  }
                  await Promise.all([loadDashboard(), loadSettingsWorkspace()]);
                  showNotice(reminderId ? "Reminder updated." : "Reminder added.");
                });
              }}
              onDeleteReminder={async (reminderId) => {
                await withBusy(async () => {
                  await api.deleteReminder(reminderId);
                  await Promise.all([loadDashboard(), loadSettingsWorkspace()]);
                  showNotice("Reminder removed.");
                });
              }}
            />
          )
        ) : (
          <LoadingState />
        )
      ) : diagnostics ? (
        diagnosticsLoading ? (
          <div className="panel flex items-center justify-center gap-3 px-6 py-12 text-slate-300">
            <LoaderCircle className="h-5 w-5 animate-spin text-accent/80" />
            Loading diagnostics...
          </div>
        ) : (
          <DiagnosticsPage diagnostics={diagnostics} />
        )
      ) : (
        <LoadingState />
      )}
    </AppShell>
  );
}
