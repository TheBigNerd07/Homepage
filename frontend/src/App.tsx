import { startTransition, useEffect, useMemo, useState } from "react";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { ApiError, api } from "./lib/api";
import { hexToRgbTuple } from "./lib/color";
import { AppShell, type ViewMode } from "./components/AppShell";
import { CommandPalette, type CommandPaletteItem } from "./components/CommandPalette";
import { ControlCenterPage } from "./components/ControlCenterPage";
import { DashboardPage } from "./components/DashboardPage";
import { DiagnosticsPage } from "./components/DiagnosticsPage";
import { LoginScreen } from "./components/LoginScreen";
import { NodesPage } from "./components/NodesPage";
import { NotesPage } from "./components/NotesPage";
import { SettingsPanel } from "./components/SettingsPanel";
import type {
  AuthStatus,
  CommandRunResult,
  ControlCenterSummary,
  ControlItem,
  DashboardAction,
  DashboardSummary,
  DiagnosticsSummary,
  LogView,
  Node,
  Note,
  QuickActionLink,
  Reminder,
  Service,
  SettingsData,
  ScriptureChapter,
} from "./types";

function LoadingState() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
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
  const [nodes, setNodes] = useState<Node[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [quickActions, setQuickActions] = useState<QuickActionLink[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [chapters, setChapters] = useState<ScriptureChapter[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsSummary | null>(null);
  const [controlCenter, setControlCenter] = useState<ControlCenterSummary | null>(null);
  const [logs, setLogs] = useState<LogView | null>(null);
  const [activeLogSource, setActiveLogSource] = useState("application");
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [loading, setLoading] = useState(true);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loginBusy, setLoginBusy] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const effectiveSettings = settingsData ?? dashboard?.settings ?? null;
  const accentColor = effectiveSettings?.accent_color ?? "#5EEAD4";
  const dashboardTitle = effectiveSettings?.dashboard_title ?? "PiOne Command Center";

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
      setControlCenter(null);
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

  async function loadWorkspace() {
    try {
      setWorkspaceLoading(true);
      const [
        nextSettings,
        nextServices,
        nextNodes,
        nextNotes,
        nextQuickActions,
        nextReminders,
        nextChapters,
        nextDiagnostics,
        nextControlCenter,
      ] = await Promise.all([
        api.getSettings(),
        api.getServices(),
        api.getNodes(),
        api.getNotes(),
        api.getQuickActions(),
        api.getReminders("all"),
        api.getScriptureChapters(),
        api.getDiagnosticsSummary(),
        api.getControlCenterSummary(),
      ]);
      startTransition(() => {
        setSettingsData(nextSettings);
        setServices(nextServices);
        setNodes(nextNodes);
        setNotes(nextNotes);
        setQuickActions(nextQuickActions);
        setReminders(nextReminders);
        setChapters(nextChapters);
        setDiagnostics(nextDiagnostics);
        setControlCenter(nextControlCenter);
      });
    } catch (loadError) {
      await handleApiError(loadError, "Failed to load workspace.");
    } finally {
      setWorkspaceLoading(false);
    }
  }

  async function loadLogs(source = activeLogSource) {
    try {
      const nextLogs = await api.getLogs(source);
      setLogs(nextLogs);
      setActiveLogSource(source);
    } catch (loadError) {
      await handleApiError(loadError, "Failed to load logs.");
    }
  }

  async function refreshAll() {
    await Promise.all([loadDashboard(), loadWorkspace(), loadLogs(activeLogSource)]);
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
        await Promise.all([loadDashboard(true), loadWorkspace(), loadLogs("application")]);
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

  function resolveViewAction(actionKey: string | null) {
    if (actionKey === "open_control_center") {
      setView("control");
      return true;
    }
    if (actionKey === "open_nodes") {
      setView("nodes");
      return true;
    }
    if (actionKey === "open_notes") {
      setView("notes");
      return true;
    }
    if (actionKey === "open_settings") {
      setView("settings");
      return true;
    }
    if (actionKey === "open_diagnostics") {
      setView("diagnostics");
      return true;
    }
    if (actionKey === "open_dashboard") {
      setView("dashboard");
      return true;
    }
    return false;
  }

  async function handleDashboardAction(action: DashboardAction) {
    if (action.requires_confirmation && !window.confirm(action.confirmation_message ?? "Continue?")) {
      return;
    }
    if (action.kind === "view") {
      resolveViewAction(action.action_key);
      return;
    }
    if (action.kind === "download") {
      await withBusy(async () => {
        const exportResult = await api.exportBackup();
        downloadBlob(exportResult.blob, exportResult.filename);
        await Promise.all([loadWorkspace(), loadDashboard()]);
        showNotice("Backup exported.");
      });
      return;
    }
    if (action.kind === "link" && action.url) {
      window.open(action.url, action.open_in_new_tab ? "_blank" : "_self", "noreferrer");
      return;
    }
    if (action.kind === "backend" && action.action_key) {
      await withBusy(async () => {
        const result = await api.runAction(action.action_key!);
        await refreshAll();
        showNotice(result.message);
      });
    }
  }

  async function handleControlItem(item: ControlItem) {
    if (item.requires_confirmation && !window.confirm(item.confirmation_message ?? "Continue?")) {
      return;
    }
    if (item.kind === "view") {
      resolveViewAction(item.action_key);
      return;
    }
    if (item.kind === "link" && item.url) {
      window.open(item.url, item.open_in_new_tab ? "_blank" : "_self", "noreferrer");
      return;
    }
    if (item.kind === "action" && item.action_key) {
      await withBusy(async () => {
        const result = await api.runControlAction(item.action_key!);
        await refreshAll();
        showNotice(result.message);
      });
      return;
    }
    if (item.kind === "command" && item.command_key) {
      await withBusy(async () => {
        const result: CommandRunResult = await api.runCommand(item.command_key!);
        await Promise.all([loadWorkspace(), loadLogs(activeLogSource), loadDashboard()]);
        showNotice(`${result.title} completed.`);
      });
    }
  }

  const paletteItems = useMemo<CommandPaletteItem[]>(() => {
    const items: CommandPaletteItem[] = [];

    const pages: Array<{ id: ViewMode; label: string; icon: string; description: string }> = [
      { id: "dashboard", label: "Dashboard", icon: "LayoutDashboard", description: "Open the main dashboard." },
      { id: "control", label: "Control Center", icon: "SquareTerminal", description: "Open commands, logs, and maintenance actions." },
      { id: "nodes", label: "Nodes", icon: "Network", description: "Inspect nodes and service placement." },
      { id: "notes", label: "Notes", icon: "NotebookTabs", description: "Open the scratchpad and pinned notes." },
      { id: "settings", label: "Settings", icon: "Settings2", description: "Adjust layout, widgets, nodes, and services." },
      { id: "diagnostics", label: "Diagnostics", icon: "FileSearch", description: "Review runtime health and integrations." },
    ];

    for (const page of pages) {
      items.push({
        id: `page-${page.id}`,
        label: page.label,
        description: page.description,
        icon: page.icon,
        keywords: page.id,
        onSelect: () => setView(page.id),
      });
    }

    dashboard?.services.forEach((service) => {
      items.push({
        id: `service-${service.id}`,
        label: service.name,
        description: `${service.node_name ?? "Unassigned"} • ${service.description}`,
        icon: service.icon,
        keywords: `${service.category} ${service.tags.join(" ")} ${service.node_name ?? ""}`,
        onSelect: () =>
          window.open(service.url, service.open_in_new_tab ? "_blank" : "_self", "noreferrer"),
      });
    });

    controlCenter?.actions.forEach((item) => {
      items.push({
        id: item.id,
        label: item.title,
        description: item.description,
        icon: item.icon,
        keywords: `${item.category} ${item.kind}`,
        onSelect: () => {
          void handleControlItem(item);
        },
      });
    });

    controlCenter?.commands.forEach((item) => {
      items.push({
        id: item.id,
        label: item.title,
        description: item.description,
        icon: item.icon,
        keywords: `${item.category} command`,
        onSelect: () => {
          void handleControlItem(item);
        },
      });
    });

    dashboard?.nodes.forEach((node) => {
      items.push({
        id: `node-${node.id}`,
        label: node.name,
        description: `${node.role} • ${node.hostname}`,
        icon: "Network",
        keywords: `${node.tags.join(" ")} ${node.status}`,
        onSelect: () => setView("nodes"),
      });
    });

    return items;
  }, [activeLogSource, controlCenter, dashboard]);

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    if (!authStatus?.authenticated || view !== "control" || !autoRefreshLogs) {
      return;
    }
    const interval = window.setInterval(() => {
      void loadLogs(activeLogSource);
    }, 7000);
    return () => window.clearInterval(interval);
  }, [activeLogSource, authStatus?.authenticated, autoRefreshLogs, view]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--accent-rgb", hexToRgbTuple(accentColor));
    if (effectiveSettings) {
      document.documentElement.dataset.backgroundStyle = effectiveSettings.background_style;
    }
  }, [accentColor, effectiveSettings]);

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
            await Promise.all([loadDashboard(true), loadWorkspace(), loadLogs("application")]);
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
    <>
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
            setControlCenter(null);
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
          <DashboardPage
            dashboard={dashboard}
            chapters={chapters}
            busy={busy}
            isMobile={isMobile}
            onInvokeAction={(action) => {
              void handleDashboardAction(action);
            }}
            onToggleReminder={async (reminderId, completed) => {
              await withBusy(async () => {
                await api.toggleReminder(reminderId, completed);
                await Promise.all([loadDashboard(), loadWorkspace()]);
              });
            }}
            onCreateReminder={async (payload) => {
              await withBusy(async () => {
                await api.createReminder(payload);
                await Promise.all([loadDashboard(), loadWorkspace()]);
                showNotice("Reminder added.");
              });
            }}
            onCompleteChapter={async (chapterId) => {
              await withBusy(async () => {
                await api.completeChapter(chapterId);
                await Promise.all([loadDashboard(), loadWorkspace()]);
                showNotice("Reading progress updated.");
              });
            }}
            onOpenView={(nextView) => setView(nextView)}
          />
        ) : view === "control" ? (
          controlCenter ? (
            <ControlCenterPage
              summary={controlCenter}
              logs={logs}
              logSource={activeLogSource}
              autoRefreshLogs={autoRefreshLogs}
              busy={busy}
              onInvokeItem={(item) => {
                void handleControlItem(item);
              }}
              onChangeLogSource={(source) => {
                void loadLogs(source);
              }}
              onToggleAutoRefreshLogs={setAutoRefreshLogs}
              onToggleFavoriteCommand={(commandKey) => {
                if (!settingsData) {
                  return;
                }
                const nextSettings: SettingsData = {
                  ...settingsData,
                  favorite_command_keys: settingsData.favorite_command_keys.includes(commandKey)
                    ? settingsData.favorite_command_keys.filter((item) => item !== commandKey)
                    : [...settingsData.favorite_command_keys, commandKey],
                };
                void withBusy(async () => {
                  await api.updateSettings(nextSettings);
                  await Promise.all([loadWorkspace(), loadDashboard()]);
                  showNotice("Command favorites updated.");
                });
              }}
            />
          ) : (
            <LoadingState />
          )
        ) : view === "nodes" ? (
          <NodesPage nodes={nodes.length ? nodes : dashboard.nodes} services={services.length ? services : dashboard.services} />
        ) : view === "notes" ? (
          <NotesPage
            notes={notes}
            busy={busy}
            onSaveNote={async (noteId, payload) => {
              await withBusy(async () => {
                if (noteId) {
                  await api.updateNote(noteId, payload);
                } else {
                  await api.createNote(payload);
                }
                await Promise.all([loadWorkspace(), loadDashboard()]);
                showNotice(noteId ? "Note updated." : "Note created.");
              });
            }}
            onDeleteNote={async (noteId) => {
              await withBusy(async () => {
                await api.deleteNote(noteId);
                await Promise.all([loadWorkspace(), loadDashboard()]);
                showNotice("Note deleted.");
              });
            }}
          />
        ) : view === "settings" ? (
          settingsData ? (
            workspaceLoading ? (
              <div className="panel flex items-center justify-center gap-3 px-6 py-12 text-slate-300">
                <LoaderCircle className="h-5 w-5 animate-spin text-accent/80" />
                Loading settings workspace...
              </div>
            ) : (
              <SettingsPanel
                settings={settingsData}
                services={services}
                nodes={nodes}
                quickActions={quickActions}
                reminders={reminders}
                diagnostics={diagnostics}
                busy={busy}
                onSaveSettings={async (payload) => {
                  await withBusy(async () => {
                    await api.updateSettings(payload);
                    await Promise.all([loadDashboard(), loadWorkspace()]);
                    showNotice("Settings saved.");
                  });
                }}
                onSaveNode={async (nodeId, payload) => {
                  await withBusy(async () => {
                    if (nodeId) {
                      await api.updateNode(nodeId, payload);
                    } else {
                      await api.createNode(payload);
                    }
                    await Promise.all([loadDashboard(), loadWorkspace()]);
                    showNotice(nodeId ? "Node updated." : "Node created.");
                  });
                }}
                onDeleteNode={async (nodeId) => {
                  await withBusy(async () => {
                    await api.deleteNode(nodeId);
                    await Promise.all([loadDashboard(), loadWorkspace()]);
                    showNotice("Node deleted.");
                  });
                }}
                onSaveService={async (serviceId, payload) => {
                  await withBusy(async () => {
                    if (serviceId) {
                      await api.updateService(serviceId, payload);
                    } else {
                      await api.createService(payload);
                    }
                    await Promise.all([loadDashboard(), loadWorkspace()]);
                    showNotice(serviceId ? "Service updated." : "Service added.");
                  });
                }}
                onDeleteService={async (serviceId) => {
                  await withBusy(async () => {
                    await api.deleteService(serviceId);
                    await Promise.all([loadDashboard(), loadWorkspace()]);
                    showNotice("Service removed.");
                  });
                }}
                onReorderServices={async (orderedIds) => {
                  await withBusy(async () => {
                    await api.reorderServices(orderedIds);
                    await Promise.all([loadDashboard(), loadWorkspace()]);
                  });
                }}
                onSaveQuickAction={async (actionId, payload) => {
                  await withBusy(async () => {
                    if (actionId) {
                      await api.updateQuickAction(actionId, payload);
                    } else {
                      await api.createQuickAction(payload);
                    }
                    await Promise.all([loadDashboard(), loadWorkspace()]);
                    showNotice(actionId ? "Quick link updated." : "Quick link added.");
                  });
                }}
                onDeleteQuickAction={async (actionId) => {
                  await withBusy(async () => {
                    await api.deleteQuickAction(actionId);
                    await Promise.all([loadDashboard(), loadWorkspace()]);
                    showNotice("Quick link removed.");
                  });
                }}
                onReorderQuickActions={async (orderedIds) => {
                  await withBusy(async () => {
                    await api.reorderQuickActions(orderedIds);
                    await Promise.all([loadDashboard(), loadWorkspace()]);
                  });
                }}
                onSaveReminder={async (reminderId, payload) => {
                  await withBusy(async () => {
                    if (reminderId) {
                      await api.updateReminder(reminderId, payload);
                    } else {
                      await api.createReminder(payload);
                    }
                    await Promise.all([loadDashboard(), loadWorkspace()]);
                    showNotice(reminderId ? "Reminder updated." : "Reminder added.");
                  });
                }}
                onDeleteReminder={async (reminderId) => {
                  await withBusy(async () => {
                    await api.deleteReminder(reminderId);
                    await Promise.all([loadDashboard(), loadWorkspace()]);
                    showNotice("Reminder removed.");
                  });
                }}
              />
            )
          ) : (
            <LoadingState />
          )
        ) : diagnostics ? (
          <DiagnosticsPage diagnostics={diagnostics} />
        ) : (
          <LoadingState />
        )}
      </AppShell>

      <CommandPalette open={paletteOpen} items={paletteItems} onClose={() => setPaletteOpen(false)} />
    </>
  );
}
