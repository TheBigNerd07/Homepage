import type {
  ActionResult,
  AuthStatus,
  BackupDownload,
  CommandRunResult,
  ControlCenterSummary,
  DashboardSummary,
  DiagnosticsSummary,
  LogView,
  Node,
  NodePayload,
  Note,
  NotePayload,
  QuickActionLink,
  QuickActionLinkPayload,
  ReadingHistoryEntry,
  Reminder,
  ReminderPayload,
  Service,
  ServicePayload,
  SettingsData,
  ScriptureChapter,
  ScriptureProgress,
} from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  responseType: "json" | "blob" = "json",
): Promise<T> {
  const headers = new Headers(options.headers ?? undefined);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers,
    ...options,
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const body = await response.json();
      message = body.detail ?? body.message ?? message;
    } catch {
      message = response.statusText;
    }
    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (responseType === "blob") {
    return (await response.blob()) as T;
  }

  return (await response.json()) as T;
}

export const api = {
  getAuthStatus: () => request<AuthStatus>("/auth/status"),
  login: (username: string, password: string) =>
    request<AuthStatus>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  logout: () =>
    request<AuthStatus>("/auth/logout", {
      method: "POST",
    }),
  getDashboardSummary: () => request<DashboardSummary>("/dashboard/summary"),
  getDiagnosticsSummary: () => request<DiagnosticsSummary>("/diagnostics/summary"),
  getSettings: () => request<SettingsData>("/settings"),
  updateSettings: (payload: SettingsData) =>
    request<SettingsData>("/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  getServices: () => request<Service[]>("/services"),
  createService: (payload: ServicePayload) =>
    request<Service>("/services", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateService: (serviceId: number, payload: Partial<ServicePayload>) =>
    request<Service>(`/services/${serviceId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  reorderServices: (orderedIds: number[]) =>
    request<Service[]>("/services/reorder", {
      method: "PUT",
      body: JSON.stringify({ ordered_ids: orderedIds }),
    }),
  deleteService: (serviceId: number) =>
    request<void>(`/services/${serviceId}`, {
      method: "DELETE",
    }),
  getNodes: () => request<Node[]>("/nodes"),
  createNode: (payload: NodePayload) =>
    request<Node>("/nodes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateNode: (nodeId: number, payload: Partial<NodePayload>) =>
    request<Node>(`/nodes/${nodeId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteNode: (nodeId: number) =>
    request<void>(`/nodes/${nodeId}`, {
      method: "DELETE",
    }),
  getNotes: (includeArchived = false) => request<Note[]>(`/notes?include_archived=${includeArchived}`),
  createNote: (payload: NotePayload) =>
    request<Note>("/notes", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateNote: (noteId: number, payload: Partial<NotePayload>) =>
    request<Note>(`/notes/${noteId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteNote: (noteId: number) =>
    request<void>(`/notes/${noteId}`, {
      method: "DELETE",
    }),
  getQuickActions: () => request<QuickActionLink[]>("/quick-actions"),
  createQuickAction: (payload: QuickActionLinkPayload) =>
    request<QuickActionLink>("/quick-actions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateQuickAction: (actionId: number, payload: Partial<QuickActionLinkPayload>) =>
    request<QuickActionLink>(`/quick-actions/${actionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  reorderQuickActions: (orderedIds: number[]) =>
    request<QuickActionLink[]>("/quick-actions/reorder", {
      method: "PUT",
      body: JSON.stringify({ ordered_ids: orderedIds }),
    }),
  deleteQuickAction: (actionId: number) =>
    request<void>(`/quick-actions/${actionId}`, {
      method: "DELETE",
    }),
  runAction: (actionKey: string) =>
    request<ActionResult>(`/actions/${actionKey}`, {
      method: "POST",
    }),
  getControlCenterSummary: () => request<ControlCenterSummary>("/control-center/summary"),
  runControlAction: (actionKey: string) =>
    request<ActionResult>(`/control-center/actions/${actionKey}`, {
      method: "POST",
    }),
  runCommand: (commandKey: string) =>
    request<CommandRunResult>(`/control-center/commands/${commandKey}`, {
      method: "POST",
    }),
  getLogs: (source = "application", lines = 120) =>
    request<LogView>(`/control-center/logs?source=${encodeURIComponent(source)}&lines=${lines}`),
  exportBackup: async (): Promise<BackupDownload> => {
    const response = await fetch(`${API_BASE_URL}/backups/export`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) {
      let message = response.statusText;
      try {
        const body = await response.json();
        message = body.detail ?? body.message ?? message;
      } catch {
        message = response.statusText;
      }
      throw new ApiError(response.status, message);
    }
    const disposition = response.headers.get("content-disposition");
    const match = disposition?.match(/filename="?([^"]+)"?/);
    return {
      blob: await response.blob(),
      filename: match?.[1] ?? "pione-homepage-backup.zip",
    };
  },
  getReminders: (scope: "all" | "today" = "all") =>
    request<Reminder[]>(`/reminders?scope=${scope}`),
  createReminder: (payload: ReminderPayload) =>
    request<Reminder>("/reminders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateReminder: (reminderId: number, payload: Partial<ReminderPayload> & { is_active?: boolean }) =>
    request<Reminder>(`/reminders/${reminderId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  toggleReminder: (reminderId: number, completed: boolean) =>
    request<Reminder>(`/reminders/${reminderId}/toggle`, {
      method: "POST",
      body: JSON.stringify({ completed }),
    }),
  deleteReminder: (reminderId: number) =>
    request<void>(`/reminders/${reminderId}`, {
      method: "DELETE",
    }),
  getScriptureProgress: () => request<ScriptureProgress>("/scripture/progress"),
  getScriptureHistory: () => request<ReadingHistoryEntry[]>("/scripture/history"),
  getScriptureChapters: () => request<ScriptureChapter[]>("/scripture/chapters"),
  completeChapter: (chapterId: number) =>
    request<ScriptureProgress>("/scripture/complete", {
      method: "POST",
      body: JSON.stringify({ chapter_id: chapterId }),
    }),
};
