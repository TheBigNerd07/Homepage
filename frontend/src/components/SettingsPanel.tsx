import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Save, Trash2 } from "lucide-react";
import type {
  DiagnosticsSummary,
  QuickActionLink,
  QuickActionLinkPayload,
  Reminder,
  ReminderPayload,
  Service,
  ServicePayload,
  SettingsData,
} from "../types";
import { Card } from "./Card";
import { StatusBadge } from "./StatusBadge";

interface SettingsPanelProps {
  settings: SettingsData;
  services: Service[];
  quickActions: QuickActionLink[];
  reminders: Reminder[];
  diagnostics: DiagnosticsSummary | null;
  onSaveSettings: (payload: SettingsData) => Promise<void>;
  onSaveService: (serviceId: number | null, payload: ServicePayload) => Promise<void>;
  onDeleteService: (serviceId: number) => Promise<void>;
  onReorderServices: (orderedIds: number[]) => Promise<void>;
  onSaveQuickAction: (actionId: number | null, payload: QuickActionLinkPayload) => Promise<void>;
  onDeleteQuickAction: (actionId: number) => Promise<void>;
  onReorderQuickActions: (orderedIds: number[]) => Promise<void>;
  onSaveReminder: (reminderId: number | null, payload: ReminderPayload) => Promise<void>;
  onDeleteReminder: (reminderId: number) => Promise<void>;
  busy: boolean;
}

function createBlankService(primaryCategory: string): ServicePayload {
  return {
    name: "",
    icon: "Server",
    description: "",
    category: primaryCategory,
    url: "http://",
    open_in_new_tab: true,
    manual_status: "unknown",
    tags: [],
    is_enabled: true,
    is_favorite: false,
    health_check_url: null,
    health_check_interval_seconds: null,
    health_check_timeout_seconds: null,
  };
}

const blankQuickAction: QuickActionLinkPayload = {
  name: "",
  icon: "ExternalLink",
  description: "",
  url: "http://",
  open_in_new_tab: true,
  is_enabled: true,
};

const blankReminder: ReminderPayload = {
  text: "",
  notes: null,
  schedule_type: "daily",
  due_date: null,
  due_time: "08:00",
};

export function SettingsPanel({
  settings,
  services,
  quickActions,
  reminders,
  diagnostics,
  onSaveSettings,
  onSaveService,
  onDeleteService,
  onReorderServices,
  onSaveQuickAction,
  onDeleteQuickAction,
  onReorderQuickActions,
  onSaveReminder,
  onDeleteReminder,
  busy,
}: SettingsPanelProps) {
  const [settingsForm, setSettingsForm] = useState(settings);
  const [serviceCategoriesInput, setServiceCategoriesInput] = useState(settings.service_categories.join(", "));
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [serviceForm, setServiceForm] = useState<ServicePayload>(() =>
    createBlankService(settings.service_categories[0] ?? "General"),
  );
  const [serviceTags, setServiceTags] = useState("");
  const [editingQuickActionId, setEditingQuickActionId] = useState<number | null>(null);
  const [quickActionForm, setQuickActionForm] = useState<QuickActionLinkPayload>(blankQuickAction);
  const [editingReminderId, setEditingReminderId] = useState<number | null>(null);
  const [reminderForm, setReminderForm] = useState<ReminderPayload>(blankReminder);

  useEffect(() => {
    setSettingsForm(settings);
    setServiceCategoriesInput(settings.service_categories.join(", "));
  }, [settings]);

  useEffect(() => {
    if (!editingServiceId) {
      setServiceForm(createBlankService(settings.service_categories[0] ?? "General"));
    }
  }, [editingServiceId, settings.service_categories]);

  useEffect(() => {
    if (!editingReminderId) {
      setReminderForm((current) => ({
        ...current,
        due_time: settings.default_reminder_time,
      }));
    }
  }, [editingReminderId, settings.default_reminder_time]);

  function editService(service: Service) {
    setEditingServiceId(service.id);
    setServiceForm({
      name: service.name,
      icon: service.icon,
      description: service.description,
      category: service.category,
      url: service.url,
      open_in_new_tab: service.open_in_new_tab,
      manual_status: service.manual_status,
      tags: service.tags,
      is_enabled: service.is_enabled,
      is_favorite: service.is_favorite,
      health_check_url: service.health_check_url,
      health_check_interval_seconds: service.health_check_interval_seconds,
      health_check_timeout_seconds: service.health_check_timeout_seconds,
    });
    setServiceTags(service.tags.join(", "));
  }

  function resetServiceForm() {
    setEditingServiceId(null);
    setServiceForm(createBlankService(settings.service_categories[0] ?? "General"));
    setServiceTags("");
  }

  function editQuickAction(action: QuickActionLink) {
    setEditingQuickActionId(action.id);
    setQuickActionForm({
      name: action.name,
      icon: action.icon,
      description: action.description,
      url: action.url,
      open_in_new_tab: action.open_in_new_tab,
      is_enabled: action.is_enabled,
    });
  }

  function resetQuickActionForm() {
    setEditingQuickActionId(null);
    setQuickActionForm(blankQuickAction);
  }

  function editReminder(reminder: Reminder) {
    setEditingReminderId(reminder.id);
    setReminderForm({
      text: reminder.text,
      notes: reminder.notes,
      schedule_type: reminder.schedule_type,
      due_date: reminder.due_date,
      due_time: reminder.due_time,
    });
  }

  function resetReminderForm() {
    setEditingReminderId(null);
    setReminderForm({
      ...blankReminder,
      due_time: settings.default_reminder_time,
    });
  }

  async function moveService(serviceId: number, direction: -1 | 1) {
    const index = services.findIndex((service) => service.id === serviceId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= services.length) {
      return;
    }
    const reordered = [...services];
    const [item] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, item);
    await onReorderServices(reordered.map((service) => service.id));
  }

  async function moveQuickAction(actionId: number, direction: -1 | 1) {
    const index = quickActions.findIndex((action) => action.id === actionId);
    const targetIndex = index + direction;
    if (index < 0 || targetIndex < 0 || targetIndex >= quickActions.length) {
      return;
    }
    const reordered = [...quickActions];
    const [item] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, item);
    await onReorderQuickActions(reordered.map((action) => action.id));
  }

  return (
    <div className="space-y-6">
      <Card title="Experience & Defaults" eyebrow="Settings">
        <form
          className="grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();
            await onSaveSettings({
              ...settingsForm,
              service_categories: serviceCategoriesInput
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            });
          }}
        >
          <div className="grid gap-4 lg:grid-cols-3">
            <label className="grid gap-2">
              <span className="label">Dashboard Title</span>
              <input
                className="input"
                value={settingsForm.dashboard_title}
                onChange={(event) =>
                  setSettingsForm((current) => ({ ...current, dashboard_title: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2">
              <span className="label">Display Name</span>
              <input
                className="input"
                value={settingsForm.display_name}
                onChange={(event) =>
                  setSettingsForm((current) => ({ ...current, display_name: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2">
              <span className="label">Accent Color</span>
              <input
                className="input"
                value={settingsForm.accent_color}
                onChange={(event) =>
                  setSettingsForm((current) => ({ ...current, accent_color: event.target.value }))
                }
              />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <label className="grid gap-2">
              <span className="label">Density Mode</span>
              <select
                className="input"
                value={settingsForm.density_mode}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    density_mode: event.target.value as "comfortable" | "compact",
                  }))
                }
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="label">Default Reminder Time</span>
              <input
                type="time"
                className="input"
                value={settingsForm.default_reminder_time}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    default_reminder_time: event.target.value,
                  }))
                }
              />
            </label>
            <label className="grid gap-2">
              <span className="label">Check Interval (sec)</span>
              <input
                type="number"
                min={30}
                max={3600}
                className="input"
                value={settingsForm.default_status_check_interval_seconds}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    default_status_check_interval_seconds: Number(event.target.value),
                  }))
                }
              />
            </label>
            <label className="grid gap-2">
              <span className="label">Check Timeout (sec)</span>
              <input
                type="number"
                min={1}
                max={30}
                className="input"
                value={settingsForm.default_status_check_timeout_seconds}
                onChange={(event) =>
                  setSettingsForm((current) => ({
                    ...current,
                    default_status_check_timeout_seconds: Number(event.target.value),
                  }))
                }
              />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="label">Service Categories</span>
            <input
              className="input"
              value={serviceCategoriesInput}
              onChange={(event) => setServiceCategoriesInput(event.target.value)}
              placeholder="Operations, Media, Observability, Study, General"
            />
          </label>

          <div className="grid gap-4 lg:grid-cols-3">
            <label className="grid gap-2">
              <span className="label">Morning Intro</span>
              <textarea
                className="input min-h-28 resize-y"
                value={settingsForm.morning_intro}
                onChange={(event) =>
                  setSettingsForm((current) => ({ ...current, morning_intro: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2">
              <span className="label">Afternoon Intro</span>
              <textarea
                className="input min-h-28 resize-y"
                value={settingsForm.afternoon_intro}
                onChange={(event) =>
                  setSettingsForm((current) => ({ ...current, afternoon_intro: event.target.value }))
                }
              />
            </label>
            <label className="grid gap-2">
              <span className="label">Evening Intro</span>
              <textarea
                className="input min-h-28 resize-y"
                value={settingsForm.evening_intro}
                onChange={(event) =>
                  setSettingsForm((current) => ({ ...current, evening_intro: event.target.value }))
                }
              />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <label className="grid gap-2">
              <span className="label">Default Focus Message</span>
              <textarea
                className="input min-h-24 resize-y"
                value={settingsForm.focus_message}
                onChange={(event) =>
                  setSettingsForm((current) => ({ ...current, focus_message: event.target.value }))
                }
              />
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={settingsForm.show_quotes}
                onChange={(event) =>
                  setSettingsForm((current) => ({ ...current, show_quotes: event.target.checked }))
                }
                className="h-4 w-4 rounded border-white/10 bg-slate-950/40 text-accent focus:ring-accent/40"
              />
              Show motivational quotes
            </label>
          </div>

          <div className="flex justify-end">
            <button className="button-primary" type="submit" disabled={busy}>
              <Save className="mr-2 h-4 w-4" />
              Save settings
            </button>
          </div>
        </form>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card title="Runtime & Integrations" eyebrow="Environment">
          {diagnostics ? (
            <div className="space-y-4">
              <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4 text-sm text-slate-300">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <div className="label">Version</div>
                    <div className="mt-2 text-lg font-semibold text-white">{diagnostics.app_version}</div>
                  </div>
                  <div>
                    <div className="label">Public URL</div>
                    <div className="mt-2 break-all text-sm text-slate-200">
                      {diagnostics.public_base_url ?? "Not configured"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {diagnostics.integrations.map((integration) => (
                  <div
                    key={integration.name}
                    className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{integration.name}</div>
                        <div className="mt-1 text-sm text-slate-400">{integration.detail ?? "No detail."}</div>
                      </div>
                      <StatusBadge
                        status={integration.available ? "online" : integration.enabled ? "degraded" : "unknown"}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] border border-dashed border-white/12 bg-slate-950/30 px-5 py-8 text-sm text-slate-400">
              Diagnostics are still loading.
            </div>
          )}
        </Card>

        <div className="grid gap-6">
          <Card title="Quick Action Links" eyebrow="Safe External Links">
            <div className="space-y-3">
              {quickActions.map((action, index) => (
                <div
                  key={action.id}
                  className="flex flex-col gap-4 rounded-[24px] border border-white/8 bg-slate-950/30 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-sm font-semibold text-white">{action.name}</span>
                      {!action.is_enabled ? (
                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.18em] text-slate-300">
                          Hidden
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{action.description}</p>
                    <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {action.icon} • {action.url}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => moveQuickAction(action.id, -1)}
                      disabled={busy || index === 0}
                    >
                      <ArrowUp className="mr-2 h-4 w-4" />
                      Up
                    </button>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => moveQuickAction(action.id, 1)}
                      disabled={busy || index === quickActions.length - 1}
                    >
                      <ArrowDown className="mr-2 h-4 w-4" />
                      Down
                    </button>
                    <button type="button" className="button-secondary" onClick={() => editQuickAction(action)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => onDeleteQuickAction(action.id)}
                      disabled={busy}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title={editingQuickActionId ? "Edit Quick Action" : "Add Quick Action"} eyebrow="Link Form">
            <form
              className="grid gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                await onSaveQuickAction(editingQuickActionId, quickActionForm);
                resetQuickActionForm();
              }}
            >
              <input
                className="input"
                placeholder="Open Portainer"
                value={quickActionForm.name}
                onChange={(event) =>
                  setQuickActionForm((current) => ({ ...current, name: event.target.value }))
                }
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  className="input"
                  placeholder="ExternalLink"
                  value={quickActionForm.icon}
                  onChange={(event) =>
                    setQuickActionForm((current) => ({ ...current, icon: event.target.value }))
                  }
                />
                <input
                  className="input"
                  placeholder="http://pione.local:9000"
                  value={quickActionForm.url}
                  onChange={(event) =>
                    setQuickActionForm((current) => ({ ...current, url: event.target.value }))
                  }
                />
              </div>
              <textarea
                className="input min-h-24 resize-y"
                placeholder="Description"
                value={quickActionForm.description}
                onChange={(event) =>
                  setQuickActionForm((current) => ({ ...current, description: event.target.value }))
                }
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={quickActionForm.open_in_new_tab}
                    onChange={(event) =>
                      setQuickActionForm((current) => ({
                        ...current,
                        open_in_new_tab: event.target.checked,
                      }))
                    }
                    className="h-4 w-4 rounded border-white/10 bg-slate-950/40 text-accent focus:ring-accent/40"
                  />
                  Open in new tab
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={quickActionForm.is_enabled}
                    onChange={(event) =>
                      setQuickActionForm((current) => ({ ...current, is_enabled: event.target.checked }))
                    }
                    className="h-4 w-4 rounded border-white/10 bg-slate-950/40 text-accent focus:ring-accent/40"
                  />
                  Show in quick actions
                </label>
              </div>
              <div className="flex gap-3">
                <button className="button-primary flex-1" type="submit" disabled={busy}>
                  {editingQuickActionId ? "Save link" : "Create link"}
                </button>
                {editingQuickActionId ? (
                  <button className="button-secondary" type="button" onClick={resetQuickActionForm}>
                    Cancel
                  </button>
                ) : null}
              </div>
            </form>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card title="Services" eyebrow="Launcher Catalog">
          <div className="space-y-3">
            {services.map((service, index) => (
              <div
                key={service.id}
                className="flex flex-col gap-4 rounded-[24px] border border-white/8 bg-slate-950/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold text-white">{service.name}</span>
                    <StatusBadge status={service.status} />
                    {service.is_favorite ? (
                      <span className="rounded-full border border-accent/20 bg-accent/10 px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.18em] text-accent/90">
                        Favorite
                      </span>
                    ) : null}
                    {!service.is_enabled ? (
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.18em] text-slate-300">
                        Hidden
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{service.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-[0.7rem] uppercase tracking-[0.16em] text-slate-500">
                    <span>{service.category}</span>
                    <span>{service.icon}</span>
                    {service.health_check_url ? <span>Health URL set</span> : <span>Manual status</span>}
                    {service.tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => moveService(service.id, -1)}
                    disabled={busy || index === 0}
                  >
                    <ArrowUp className="mr-2 h-4 w-4" />
                    Up
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => moveService(service.id, 1)}
                    disabled={busy || index === services.length - 1}
                  >
                    <ArrowDown className="mr-2 h-4 w-4" />
                    Down
                  </button>
                  <button type="button" className="button-secondary" onClick={() => editService(service)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => onDeleteService(service.id)}
                    disabled={busy}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={editingServiceId ? "Edit Service" : "Add Service"} eyebrow="Service Form">
          <form
            className="grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              await onSaveService(editingServiceId, {
                ...serviceForm,
                tags: serviceTags
                  .split(",")
                  .map((item) => item.trim())
                  .filter(Boolean),
              });
              resetServiceForm();
            }}
          >
            <input
              className="input"
              placeholder="Service name"
              value={serviceForm.name}
              onChange={(event) => setServiceForm((current) => ({ ...current, name: event.target.value }))}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="input"
                list="service-categories"
                placeholder="Category"
                value={serviceForm.category}
                onChange={(event) =>
                  setServiceForm((current) => ({ ...current, category: event.target.value }))
                }
              />
              <datalist id="service-categories">
                {settings.service_categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
              <input
                className="input"
                placeholder="Icon name"
                value={serviceForm.icon}
                onChange={(event) => setServiceForm((current) => ({ ...current, icon: event.target.value }))}
              />
            </div>
            <input
              className="input"
              placeholder="http://pione.local:3000"
              value={serviceForm.url}
              onChange={(event) => setServiceForm((current) => ({ ...current, url: event.target.value }))}
            />
            <textarea
              className="input min-h-24 resize-y"
              placeholder="Description"
              value={serviceForm.description}
              onChange={(event) =>
                setServiceForm((current) => ({ ...current, description: event.target.value }))
              }
            />
            <input
              className="input"
              placeholder="tag1, tag2, tag3"
              value={serviceTags}
              onChange={(event) => setServiceTags(event.target.value)}
            />
            <select
              className="input"
              value={serviceForm.manual_status}
              onChange={(event) =>
                setServiceForm((current) => ({ ...current, manual_status: event.target.value }))
              }
            >
              <option value="online">Online</option>
              <option value="degraded">Degraded</option>
              <option value="offline">Offline</option>
              <option value="unknown">Unknown</option>
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="input"
                placeholder="Optional health check URL"
                value={serviceForm.health_check_url ?? ""}
                onChange={(event) =>
                  setServiceForm((current) => ({
                    ...current,
                    health_check_url: event.target.value || null,
                  }))
                }
              />
              <input
                type="number"
                min={30}
                max={3600}
                className="input"
                placeholder={`Interval (default ${settings.default_status_check_interval_seconds})`}
                value={serviceForm.health_check_interval_seconds ?? ""}
                onChange={(event) =>
                  setServiceForm((current) => ({
                    ...current,
                    health_check_interval_seconds: event.target.value ? Number(event.target.value) : null,
                  }))
                }
              />
            </div>
            <input
              type="number"
              min={1}
              max={30}
              className="input"
              placeholder={`Timeout (default ${settings.default_status_check_timeout_seconds})`}
              value={serviceForm.health_check_timeout_seconds ?? ""}
              onChange={(event) =>
                setServiceForm((current) => ({
                  ...current,
                  health_check_timeout_seconds: event.target.value ? Number(event.target.value) : null,
                }))
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={serviceForm.open_in_new_tab}
                  onChange={(event) =>
                    setServiceForm((current) => ({ ...current, open_in_new_tab: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-white/10 bg-slate-950/40 text-accent focus:ring-accent/40"
                />
                Open in new tab
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={serviceForm.is_enabled}
                  onChange={(event) =>
                    setServiceForm((current) => ({ ...current, is_enabled: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-white/10 bg-slate-950/40 text-accent focus:ring-accent/40"
                />
                Show on dashboard
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3 text-sm text-slate-200 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={serviceForm.is_favorite}
                  onChange={(event) =>
                    setServiceForm((current) => ({ ...current, is_favorite: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-white/10 bg-slate-950/40 text-accent focus:ring-accent/40"
                />
                Pin as favorite service
              </label>
            </div>
            <div className="flex gap-3">
              <button className="button-primary flex-1" type="submit" disabled={busy}>
                {editingServiceId ? "Save service" : "Create service"}
              </button>
              {editingServiceId ? (
                <button className="button-secondary" type="button" onClick={resetServiceForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card title="Reminders" eyebrow="Habit Editor">
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className="flex flex-col gap-4 rounded-[24px] border border-white/8 bg-slate-950/30 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold text-white">{reminder.text}</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[0.68rem] uppercase tracking-[0.18em] text-slate-300">
                      {reminder.schedule_type}
                    </span>
                  </div>
                  {reminder.notes ? <p className="mt-2 text-sm text-slate-400">{reminder.notes}</p> : null}
                  <div className="mt-2 flex flex-wrap gap-2 text-[0.7rem] uppercase tracking-[0.16em] text-slate-500">
                    {reminder.due_time ? <span>{reminder.due_time}</span> : null}
                    {reminder.due_date ? <span>{reminder.due_date}</span> : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className="button-secondary" onClick={() => editReminder(reminder)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={() => onDeleteReminder(reminder.id)}
                    disabled={busy}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={editingReminderId ? "Edit Reminder" : "Add Reminder"} eyebrow="Reminder Form">
          <form
            className="grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              await onSaveReminder(editingReminderId, reminderForm);
              resetReminderForm();
            }}
          >
            <input
              className="input"
              placeholder="Reminder title"
              value={reminderForm.text}
              onChange={(event) =>
                setReminderForm((current) => ({ ...current, text: event.target.value }))
              }
            />
            <select
              className="input"
              value={reminderForm.schedule_type}
              onChange={(event) =>
                setReminderForm((current) => ({
                  ...current,
                  schedule_type: event.target.value as "daily" | "once",
                  due_date: event.target.value === "daily" ? null : current.due_date,
                }))
              }
            >
              <option value="daily">Daily</option>
              <option value="once">One-time</option>
            </select>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="input"
                type="time"
                value={reminderForm.due_time ?? ""}
                onChange={(event) =>
                  setReminderForm((current) => ({ ...current, due_time: event.target.value }))
                }
              />
              <input
                className="input"
                type="date"
                value={reminderForm.due_date ?? ""}
                disabled={reminderForm.schedule_type !== "once"}
                onChange={(event) =>
                  setReminderForm((current) => ({ ...current, due_date: event.target.value || null }))
                }
              />
            </div>
            <textarea
              className="input min-h-24 resize-y"
              placeholder="Optional notes"
              value={reminderForm.notes ?? ""}
              onChange={(event) =>
                setReminderForm((current) => ({ ...current, notes: event.target.value || null }))
              }
            />
            <div className="flex gap-3">
              <button className="button-primary flex-1" type="submit" disabled={busy}>
                {editingReminderId ? "Save reminder" : "Create reminder"}
              </button>
              {editingReminderId ? (
                <button className="button-secondary" type="button" onClick={resetReminderForm}>
                  Cancel
                </button>
              ) : null}
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
