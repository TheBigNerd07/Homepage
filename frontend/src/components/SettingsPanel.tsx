import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Save, Trash2 } from "lucide-react";
import type {
  DiagnosticsSummary,
  Node,
  NodePayload,
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
  nodes: Node[];
  quickActions: QuickActionLink[];
  reminders: Reminder[];
  diagnostics: DiagnosticsSummary | null;
  busy: boolean;
  onSaveSettings: (payload: SettingsData) => Promise<void>;
  onSaveNode: (nodeId: number | null, payload: NodePayload) => Promise<void>;
  onDeleteNode: (nodeId: number) => Promise<void>;
  onSaveService: (serviceId: number | null, payload: ServicePayload) => Promise<void>;
  onDeleteService: (serviceId: number) => Promise<void>;
  onReorderServices: (orderedIds: number[]) => Promise<void>;
  onSaveQuickAction: (actionId: number | null, payload: QuickActionLinkPayload) => Promise<void>;
  onDeleteQuickAction: (actionId: number) => Promise<void>;
  onReorderQuickActions: (orderedIds: number[]) => Promise<void>;
  onSaveReminder: (reminderId: number | null, payload: ReminderPayload) => Promise<void>;
  onDeleteReminder: (reminderId: number) => Promise<void>;
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
    node_id: null,
    is_enabled: true,
    is_favorite: false,
    health_check_url: null,
    health_check_interval_seconds: null,
    health_check_timeout_seconds: null,
  };
}

const blankNode: NodePayload = {
  name: "",
  hostname: "",
  role: "Utility",
  description: "",
  status_endpoint: null,
  metrics_source: null,
  tags: [],
  is_enabled: true,
  is_local: false,
};

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

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }
  const reordered = [...items];
  const [item] = reordered.splice(index, 1);
  reordered.splice(targetIndex, 0, item);
  return reordered;
}

export function SettingsPanel({
  settings,
  services,
  nodes,
  quickActions,
  reminders,
  diagnostics,
  busy,
  onSaveSettings,
  onSaveNode,
  onDeleteNode,
  onSaveService,
  onDeleteService,
  onReorderServices,
  onSaveQuickAction,
  onDeleteQuickAction,
  onReorderQuickActions,
  onSaveReminder,
  onDeleteReminder,
}: SettingsPanelProps) {
  const [settingsForm, setSettingsForm] = useState(settings);
  const [serviceCategoriesInput, setServiceCategoriesInput] = useState(settings.service_categories.join(", "));
  const [editingNodeId, setEditingNodeId] = useState<number | null>(null);
  const [nodeForm, setNodeForm] = useState<NodePayload>(blankNode);
  const [nodeTags, setNodeTags] = useState("");
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
      setServiceTags("");
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

  function updateWidgetLayout(widgetId: string, updater: (current: typeof settingsForm.widget_layout[number]) => typeof settingsForm.widget_layout[number]) {
    setSettingsForm((current) => ({
      ...current,
      widget_layout: current.widget_layout.map((item) => (item.widget_id === widgetId ? updater(item) : item)),
    }));
  }

  function toggleFavoriteWidget(widgetId: string) {
    setSettingsForm((current) => ({
      ...current,
      favorite_widget_ids: current.favorite_widget_ids.includes(widgetId)
        ? current.favorite_widget_ids.filter((item) => item !== widgetId)
        : [...current.favorite_widget_ids, widgetId],
    }));
  }

  function editNode(node: Node) {
    setEditingNodeId(node.id);
    setNodeForm({
      name: node.name,
      hostname: node.hostname,
      role: node.role,
      description: node.description,
      status_endpoint: node.status_endpoint,
      metrics_source: node.metrics_source,
      tags: node.tags,
      is_enabled: node.is_enabled,
      is_local: node.is_local,
    });
    setNodeTags(node.tags.join(", "));
  }

  function resetNodeForm() {
    setEditingNodeId(null);
    setNodeForm(blankNode);
    setNodeTags("");
  }

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
      node_id: service.node_id,
      is_enabled: service.is_enabled,
      is_favorite: service.is_favorite,
      health_check_url: service.health_check_url,
      health_check_interval_seconds: service.health_check_interval_seconds,
      health_check_timeout_seconds: service.health_check_timeout_seconds,
    });
    setServiceTags(service.tags.join(", "));
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

  return (
    <div className="space-y-6">
      <Card title="Experience & Personalization" eyebrow="Phase 3 Settings">
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
              <input className="input" value={settingsForm.dashboard_title} onChange={(event) => setSettingsForm((current) => ({ ...current, dashboard_title: event.target.value }))} />
            </label>
            <label className="grid gap-2">
              <span className="label">Display Name</span>
              <input className="input" value={settingsForm.display_name} onChange={(event) => setSettingsForm((current) => ({ ...current, display_name: event.target.value }))} />
            </label>
            <label className="grid gap-2">
              <span className="label">Accent Color</span>
              <input className="input" value={settingsForm.accent_color} onChange={(event) => setSettingsForm((current) => ({ ...current, accent_color: event.target.value }))} />
            </label>
          </div>

          <div className="grid gap-4 lg:grid-cols-4">
            <label className="grid gap-2">
              <span className="label">Density</span>
              <select className="input" value={settingsForm.density_mode} onChange={(event) => setSettingsForm((current) => ({ ...current, density_mode: event.target.value as SettingsData["density_mode"] }))}>
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="label">Background</span>
              <select className="input" value={settingsForm.background_style} onChange={(event) => setSettingsForm((current) => ({ ...current, background_style: event.target.value as SettingsData["background_style"] }))}>
                <option value="none">None</option>
                <option value="gradient">Subtle Gradient</option>
                <option value="pattern">Subtle Pattern</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="label">Mobile Mode</span>
              <select className="input" value={settingsForm.mobile_home_mode} onChange={(event) => setSettingsForm((current) => ({ ...current, mobile_home_mode: event.target.value as SettingsData["mobile_home_mode"] }))}>
                <option value="full">Full</option>
                <option value="briefing">Briefing First</option>
                <option value="compact">Compact</option>
              </select>
            </label>
            <label className="grid gap-2">
              <span className="label">Service Grouping</span>
              <select className="input" value={settingsForm.service_grouping} onChange={(event) => setSettingsForm((current) => ({ ...current, service_grouping: event.target.value as SettingsData["service_grouping"] }))}>
                <option value="category">Category</option>
                <option value="node">Node</option>
                <option value="favorites">Favorites</option>
              </select>
            </label>
          </div>

          <label className="grid gap-2">
            <span className="label">Today's Focus</span>
            <input className="input" value={settingsForm.today_focus} onChange={(event) => setSettingsForm((current) => ({ ...current, today_focus: event.target.value }))} />
          </label>

          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2">
              <span className="label">Morning Briefing Intro</span>
              <textarea className="input min-h-24 resize-y" value={settingsForm.morning_intro} onChange={(event) => setSettingsForm((current) => ({ ...current, morning_intro: event.target.value }))} />
            </label>
            <label className="grid gap-2">
              <span className="label">Afternoon Briefing Intro</span>
              <textarea className="input min-h-24 resize-y" value={settingsForm.afternoon_intro} onChange={(event) => setSettingsForm((current) => ({ ...current, afternoon_intro: event.target.value }))} />
            </label>
            <label className="grid gap-2">
              <span className="label">Evening Briefing Intro</span>
              <textarea className="input min-h-24 resize-y" value={settingsForm.evening_intro} onChange={(event) => setSettingsForm((current) => ({ ...current, evening_intro: event.target.value }))} />
            </label>
            <label className="grid gap-2">
              <span className="label">Fallback Focus Message</span>
              <textarea className="input min-h-24 resize-y" value={settingsForm.focus_message} onChange={(event) => setSettingsForm((current) => ({ ...current, focus_message: event.target.value }))} />
            </label>
          </div>

          <label className="grid gap-2">
            <span className="label">Service Categories</span>
            <input className="input" value={serviceCategoriesInput} onChange={(event) => setServiceCategoriesInput(event.target.value)} placeholder="Operations, Media, Observability, Study, General" />
          </label>

          <div className="grid gap-4 lg:grid-cols-3">
            {settingsForm.dashboard_sections.map((section) => (
              <label key={section.id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={section.enabled}
                  onChange={(event) =>
                    setSettingsForm((current) => ({
                      ...current,
                      dashboard_sections: current.dashboard_sections.map((item) =>
                        item.id === section.id ? { ...item, enabled: event.target.checked } : item,
                      ),
                    }))
                  }
                  className="h-4 w-4 rounded border-white/10 bg-slate-950/40 text-accent focus:ring-accent/40"
                />
                {section.label}
              </label>
            ))}
          </div>

          <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
            <div className="mb-3 label">Widget Layout</div>
            <div className="space-y-3">
              {settingsForm.widget_layout.map((item, index) => (
                <div key={item.widget_id} className="grid gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-4 lg:grid-cols-[1.3fr_repeat(4,minmax(0,1fr))_auto_auto]">
                  <div>
                    <div className="text-sm font-semibold text-white">{item.widget_id}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      Favorite widget {settingsForm.favorite_widget_ids.includes(item.widget_id) ? "enabled" : "disabled"}
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" checked={item.enabled} onChange={(event) => updateWidgetLayout(item.widget_id, (current) => ({ ...current, enabled: event.target.checked }))} className="h-4 w-4 rounded border-white/10 bg-slate-950/40 text-accent focus:ring-accent/40" />
                    Enabled
                  </label>
                  <select className="input" value={item.section_id} onChange={(event) => updateWidgetLayout(item.widget_id, (current) => ({ ...current, section_id: event.target.value }))}>
                    {settingsForm.dashboard_sections.map((section) => (
                      <option key={section.id} value={section.id}>
                        {section.label}
                      </option>
                    ))}
                  </select>
                  <select className="input" value={item.size} onChange={(event) => updateWidgetLayout(item.widget_id, (current) => ({ ...current, size: event.target.value as typeof item.size }))}>
                    <option value="compact">Compact</option>
                    <option value="half">Half</option>
                    <option value="wide">Wide</option>
                    <option value="hero">Hero</option>
                  </select>
                  <button type="button" className={`button-secondary ${settingsForm.favorite_widget_ids.includes(item.widget_id) ? "border-accent/20 text-accent/80" : ""}`} onClick={() => toggleFavoriteWidget(item.widget_id)}>
                    Favorite
                  </button>
                  <button type="button" className="button-secondary" disabled={index === 0} onClick={() => setSettingsForm((current) => ({ ...current, widget_layout: moveItem(current.widget_layout, index, -1).map((widget, orderIndex) => ({ ...widget, order: orderIndex + 1 })) }))}>
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button type="button" className="button-secondary" disabled={index === settingsForm.widget_layout.length - 1} onClick={() => setSettingsForm((current) => ({ ...current, widget_layout: moveItem(current.widget_layout, index, 1).map((widget, orderIndex) => ({ ...widget, order: orderIndex + 1 })) }))}>
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button className="button-primary" type="submit" disabled={busy}>
              <Save className="mr-2 h-4 w-4" />
              Save settings
            </button>
          </div>
        </form>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <Card title="Nodes" eyebrow="Topology">
          <div className="space-y-3">
            {nodes.map((node) => (
              <div key={node.id} className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">{node.name}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {node.role} • {node.hostname}
                    </div>
                  </div>
                  <StatusBadge status={node.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="button-secondary" onClick={() => editNode(node)}>
                    Edit
                  </button>
                  {!node.is_local ? (
                    <button type="button" className="button-secondary" disabled={busy} onClick={() => onDeleteNode(node.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title={editingNodeId ? "Edit Node" : "Add Node"} eyebrow="Node Form">
          <form
            className="grid gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              await onSaveNode(editingNodeId, {
                ...nodeForm,
                tags: nodeTags.split(",").map((item) => item.trim()).filter(Boolean),
              });
              resetNodeForm();
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" placeholder="MusicPi" value={nodeForm.name} onChange={(event) => setNodeForm((current) => ({ ...current, name: event.target.value }))} />
              <input className="input" placeholder="musicpi.local" value={nodeForm.hostname} onChange={(event) => setNodeForm((current) => ({ ...current, hostname: event.target.value }))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" placeholder="Media server" value={nodeForm.role} onChange={(event) => setNodeForm((current) => ({ ...current, role: event.target.value }))} />
              <input className="input" placeholder="music, media" value={nodeTags} onChange={(event) => setNodeTags(event.target.value)} />
            </div>
            <textarea className="input min-h-24 resize-y" placeholder="Description" value={nodeForm.description} onChange={(event) => setNodeForm((current) => ({ ...current, description: event.target.value }))} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" placeholder="Optional status endpoint" value={nodeForm.status_endpoint ?? ""} onChange={(event) => setNodeForm((current) => ({ ...current, status_endpoint: event.target.value || null }))} />
              <input className="input" placeholder="Optional metrics source" value={nodeForm.metrics_source ?? ""} onChange={(event) => setNodeForm((current) => ({ ...current, metrics_source: event.target.value || null }))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                <input type="checkbox" checked={nodeForm.is_enabled} onChange={(event) => setNodeForm((current) => ({ ...current, is_enabled: event.target.checked }))} className="h-4 w-4 rounded border-white/10 bg-slate-950/40 text-accent focus:ring-accent/40" />
                Enabled
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                <input type="checkbox" checked={nodeForm.is_local} onChange={(event) => setNodeForm((current) => ({ ...current, is_local: event.target.checked }))} className="h-4 w-4 rounded border-white/10 bg-slate-950/40 text-accent focus:ring-accent/40" />
                Local node
              </label>
            </div>
            <div className="flex justify-end gap-3">
              {editingNodeId ? <button type="button" className="button-secondary" onClick={resetNodeForm}>Cancel</button> : null}
              <button type="submit" className="button-primary" disabled={busy || !nodeForm.name.trim() || !nodeForm.hostname.trim()}>
                <Save className="mr-2 h-4 w-4" />
                {editingNodeId ? "Save node" : "Create node"}
              </button>
            </div>
          </form>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card title="Services" eyebrow="Relationship Mapping">
          <div className="space-y-3">
            {services.map((service, index) => (
              <div key={service.id} className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">{service.name}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {service.category} • {service.node_name ?? "Unassigned"}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="button-secondary" disabled={index === 0} onClick={() => onReorderServices(moveItem(services, index, -1).map((item) => item.id))}>
                      <ArrowUp className="mr-2 h-4 w-4" />
                      Up
                    </button>
                    <button type="button" className="button-secondary" disabled={index === services.length - 1} onClick={() => onReorderServices(moveItem(services, index, 1).map((item) => item.id))}>
                      <ArrowDown className="mr-2 h-4 w-4" />
                      Down
                    </button>
                    <button type="button" className="button-secondary" onClick={() => editService(service)}>
                      Edit
                    </button>
                    <button type="button" className="button-secondary" disabled={busy} onClick={() => onDeleteService(service.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </button>
                  </div>
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
                tags: serviceTags.split(",").map((item) => item.trim()).filter(Boolean),
              });
              setEditingServiceId(null);
            }}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" placeholder="Grafana" value={serviceForm.name} onChange={(event) => setServiceForm((current) => ({ ...current, name: event.target.value }))} />
              <input className="input" placeholder="BarChart3" value={serviceForm.icon} onChange={(event) => setServiceForm((current) => ({ ...current, icon: event.target.value }))} />
            </div>
            <textarea className="input min-h-24 resize-y" placeholder="Description" value={serviceForm.description} onChange={(event) => setServiceForm((current) => ({ ...current, description: event.target.value }))} />
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="input" value={serviceForm.category} onChange={(event) => setServiceForm((current) => ({ ...current, category: event.target.value }))}>
                {settingsForm.service_categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              <select className="input" value={serviceForm.node_id ?? ""} onChange={(event) => setServiceForm((current) => ({ ...current, node_id: event.target.value ? Number(event.target.value) : null }))}>
                <option value="">Unassigned</option>
                {nodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name}
                  </option>
                ))}
              </select>
            </div>
            <input className="input" placeholder="https://service.local" value={serviceForm.url} onChange={(event) => setServiceForm((current) => ({ ...current, url: event.target.value }))} />
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" placeholder="music, dashboards" value={serviceTags} onChange={(event) => setServiceTags(event.target.value)} />
              <select className="input" value={serviceForm.manual_status} onChange={(event) => setServiceForm((current) => ({ ...current, manual_status: event.target.value }))}>
                <option value="online">Online</option>
                <option value="degraded">Degraded</option>
                <option value="offline">Offline</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <input className="input" placeholder="Health check URL" value={serviceForm.health_check_url ?? ""} onChange={(event) => setServiceForm((current) => ({ ...current, health_check_url: event.target.value || null }))} />
              <input className="input" type="number" min={30} max={3600} placeholder="Interval sec" value={serviceForm.health_check_interval_seconds ?? ""} onChange={(event) => setServiceForm((current) => ({ ...current, health_check_interval_seconds: event.target.value ? Number(event.target.value) : null }))} />
              <input className="input" type="number" min={1} max={30} placeholder="Timeout sec" value={serviceForm.health_check_timeout_seconds ?? ""} onChange={(event) => setServiceForm((current) => ({ ...current, health_check_timeout_seconds: event.target.value ? Number(event.target.value) : null }))} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                <input type="checkbox" checked={serviceForm.is_enabled} onChange={(event) => setServiceForm((current) => ({ ...current, is_enabled: event.target.checked }))} className="h-4 w-4 rounded border-white/10 bg-slate-950/40 text-accent focus:ring-accent/40" />
                Enabled
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                <input type="checkbox" checked={serviceForm.is_favorite} onChange={(event) => setServiceForm((current) => ({ ...current, is_favorite: event.target.checked }))} className="h-4 w-4 rounded border-white/10 bg-slate-950/40 text-accent focus:ring-accent/40" />
                Favorite
              </label>
              <label className="flex items-center gap-3 rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3 text-sm text-slate-200">
                <input type="checkbox" checked={serviceForm.open_in_new_tab} onChange={(event) => setServiceForm((current) => ({ ...current, open_in_new_tab: event.target.checked }))} className="h-4 w-4 rounded border-white/10 bg-slate-950/40 text-accent focus:ring-accent/40" />
                Open in new tab
              </label>
            </div>
            <div className="flex justify-end gap-3">
              {editingServiceId ? <button type="button" className="button-secondary" onClick={() => setEditingServiceId(null)}>Cancel</button> : null}
              <button type="submit" className="button-primary" disabled={busy || !serviceForm.name.trim()}>
                <Save className="mr-2 h-4 w-4" />
                {editingServiceId ? "Save service" : "Create service"}
              </button>
            </div>
          </form>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Quick Action Links" eyebrow="Navigation">
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              <div key={action.id} className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">{action.name}</div>
                    <div className="mt-1 text-sm text-slate-400">{action.url}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="button-secondary" disabled={index === 0} onClick={() => onReorderQuickActions(moveItem(quickActions, index, -1).map((item) => item.id))}>
                      <ArrowUp className="mr-2 h-4 w-4" />
                      Up
                    </button>
                    <button type="button" className="button-secondary" disabled={index === quickActions.length - 1} onClick={() => onReorderQuickActions(moveItem(quickActions, index, 1).map((item) => item.id))}>
                      <ArrowDown className="mr-2 h-4 w-4" />
                      Down
                    </button>
                    <button type="button" className="button-secondary" onClick={() => editQuickAction(action)}>
                      Edit
                    </button>
                    <button type="button" className="button-secondary" disabled={busy} onClick={() => onDeleteQuickAction(action.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <form
              className="grid gap-3 rounded-[24px] border border-white/8 bg-slate-950/30 p-4"
              onSubmit={async (event) => {
                event.preventDefault();
                await onSaveQuickAction(editingQuickActionId, quickActionForm);
                setEditingQuickActionId(null);
                setQuickActionForm(blankQuickAction);
              }}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="input" placeholder="Open Portainer" value={quickActionForm.name} onChange={(event) => setQuickActionForm((current) => ({ ...current, name: event.target.value }))} />
                <input className="input" placeholder="Boxes" value={quickActionForm.icon} onChange={(event) => setQuickActionForm((current) => ({ ...current, icon: event.target.value }))} />
              </div>
              <input className="input" placeholder="https://target.local" value={quickActionForm.url} onChange={(event) => setQuickActionForm((current) => ({ ...current, url: event.target.value }))} />
              <textarea className="input min-h-20 resize-y" placeholder="Description" value={quickActionForm.description} onChange={(event) => setQuickActionForm((current) => ({ ...current, description: event.target.value }))} />
              <div className="flex justify-end gap-3">
                {editingQuickActionId ? <button type="button" className="button-secondary" onClick={() => { setEditingQuickActionId(null); setQuickActionForm(blankQuickAction); }}>Cancel</button> : null}
                <button type="submit" className="button-primary" disabled={busy || !quickActionForm.name.trim()}>
                  <Save className="mr-2 h-4 w-4" />
                  {editingQuickActionId ? "Save link" : "Create link"}
                </button>
              </div>
            </form>
          </div>
        </Card>

        <Card title="Reminders" eyebrow="Editing Workspace">
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">{reminder.text}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      {reminder.schedule_type} • {reminder.due_time ?? "No time"}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="button-secondary" onClick={() => editReminder(reminder)}>
                      Edit
                    </button>
                    <button type="button" className="button-secondary" disabled={busy} onClick={() => onDeleteReminder(reminder.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <form
              className="grid gap-3 rounded-[24px] border border-white/8 bg-slate-950/30 p-4"
              onSubmit={async (event) => {
                event.preventDefault();
                await onSaveReminder(editingReminderId, reminderForm);
                setEditingReminderId(null);
                setReminderForm({ ...blankReminder, due_time: settings.default_reminder_time });
              }}
            >
              <input className="input" placeholder="Reminder text" value={reminderForm.text} onChange={(event) => setReminderForm((current) => ({ ...current, text: event.target.value }))} />
              <textarea className="input min-h-20 resize-y" placeholder="Optional notes" value={reminderForm.notes ?? ""} onChange={(event) => setReminderForm((current) => ({ ...current, notes: event.target.value || null }))} />
              <div className="grid gap-3 sm:grid-cols-3">
                <select className="input" value={reminderForm.schedule_type} onChange={(event) => setReminderForm((current) => ({ ...current, schedule_type: event.target.value as ReminderPayload["schedule_type"] }))}>
                  <option value="daily">Daily</option>
                  <option value="once">One-time</option>
                </select>
                <input className="input" type="time" value={reminderForm.due_time ?? ""} onChange={(event) => setReminderForm((current) => ({ ...current, due_time: event.target.value || null }))} />
                <input className="input" type="date" value={reminderForm.due_date ?? ""} disabled={reminderForm.schedule_type !== "once"} onChange={(event) => setReminderForm((current) => ({ ...current, due_date: event.target.value || null }))} />
              </div>
              <div className="flex justify-end gap-3">
                {editingReminderId ? <button type="button" className="button-secondary" onClick={() => { setEditingReminderId(null); setReminderForm({ ...blankReminder, due_time: settings.default_reminder_time }); }}>Cancel</button> : null}
                <button type="submit" className="button-primary" disabled={busy || !reminderForm.text.trim()}>
                  <Save className="mr-2 h-4 w-4" />
                  {editingReminderId ? "Save reminder" : "Create reminder"}
                </button>
              </div>
            </form>
          </div>
        </Card>
      </div>

      <Card title="Runtime & Integrations" eyebrow="Environment">
        {diagnostics ? (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
              <div className="label">Version</div>
              <div className="mt-2 text-lg font-semibold text-white">{diagnostics.app_version}</div>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
              <div className="label">Public URL</div>
              <div className="mt-2 break-all text-sm text-slate-300">{diagnostics.public_base_url ?? "Not configured"}</div>
            </div>
            <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
              <div className="label">Integrations</div>
              <div className="mt-2 text-lg font-semibold text-white">
                {diagnostics.integrations.filter((item) => item.available).length}/{diagnostics.integrations.length}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-white/12 bg-slate-950/30 px-5 py-8 text-sm text-slate-400">
            Diagnostics are still loading.
          </div>
        )}
      </Card>
    </div>
  );
}
