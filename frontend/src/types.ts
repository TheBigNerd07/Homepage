export interface DashboardSectionPreference {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface WidgetLayoutPreference {
  widget_id: string;
  section_id: string;
  order: number;
  size: "compact" | "half" | "wide" | "hero";
  enabled: boolean;
}

export interface SettingsData {
  id: number;
  dashboard_title: string;
  display_name: string;
  accent_color: string;
  morning_intro: string;
  afternoon_intro: string;
  evening_intro: string;
  focus_message: string;
  default_reminder_time: string;
  show_quotes: boolean;
  density_mode: "comfortable" | "compact";
  service_categories: string[];
  default_status_check_interval_seconds: number;
  default_status_check_timeout_seconds: number;
  background_style: "none" | "gradient" | "pattern";
  mobile_home_mode: "full" | "briefing" | "compact";
  service_grouping: "category" | "node" | "favorites";
  today_focus: string;
  show_scripture_of_the_day: boolean;
  show_motivational_message: boolean;
  dashboard_sections: DashboardSectionPreference[];
  widget_layout: WidgetLayoutPreference[];
  favorite_widget_ids: string[];
  favorite_command_keys: string[];
}

export interface ChartPoint {
  label: string;
  value: number | null;
  timestamp: string | null;
}

export interface Service {
  id: number;
  name: string;
  icon: string;
  description: string;
  category: string;
  url: string;
  open_in_new_tab: boolean;
  status: string;
  manual_status: string;
  tags: string[];
  node_id: number | null;
  node_name: string | null;
  node_hostname: string | null;
  sort_order: number;
  is_enabled: boolean;
  is_favorite: boolean;
  health_check_url: string | null;
  health_check_interval_seconds: number | null;
  health_check_timeout_seconds: number | null;
  last_checked_at: string | null;
  last_response_time_ms: number | null;
  last_http_status: number | null;
  status_reason: string | null;
  has_health_check: boolean;
}

export interface ServicePayload {
  name: string;
  icon: string;
  description: string;
  category: string;
  url: string;
  open_in_new_tab: boolean;
  manual_status: string;
  tags: string[];
  node_id: number | null;
  is_enabled: boolean;
  is_favorite: boolean;
  health_check_url: string | null;
  health_check_interval_seconds: number | null;
  health_check_timeout_seconds: number | null;
}

export interface NodeStatusCheck {
  id: number;
  node_id: number;
  status: string;
  checked_at: string;
  response_time_ms: number | null;
  http_status: number | null;
  message: string | null;
}

export interface Node {
  id: number;
  name: string;
  hostname: string;
  role: string;
  description: string;
  status_endpoint: string | null;
  metrics_source: string | null;
  tags: string[];
  sort_order: number;
  is_enabled: boolean;
  is_local: boolean;
  status: string;
  status_reason: string | null;
  service_count: number;
  online_service_count: number;
  degraded_service_count: number;
  offline_service_count: number;
  unknown_service_count: number;
  last_checked_at: string | null;
  last_response_time_ms: number | null;
  last_http_status: number | null;
  last_metric_at: string | null;
  cpu_usage_percent: number | null;
  memory_used_percent: number | null;
  disk_used_percent: number | null;
  status_history: NodeStatusCheck[];
  cpu_trend: ChartPoint[];
  memory_trend: ChartPoint[];
}

export interface NodePayload {
  name: string;
  hostname: string;
  role: string;
  description: string;
  status_endpoint: string | null;
  metrics_source: string | null;
  tags: string[];
  is_enabled: boolean;
  is_local: boolean;
}

export interface Note {
  id: number;
  title: string;
  body: string;
  sort_order: number;
  is_pinned: boolean;
  is_dashboard_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotePayload {
  title: string;
  body: string;
  is_pinned: boolean;
  is_dashboard_pinned: boolean;
  is_archived: boolean;
}

export interface ReminderCompletion {
  completed_for_date: string;
  completed_at: string;
}

export interface Reminder {
  id: number;
  text: string;
  notes: string | null;
  schedule_type: "daily" | "once";
  due_date: string | null;
  due_time: string | null;
  sort_order: number;
  is_active: boolean;
  completed: boolean;
  completed_today: boolean;
  is_due_today: boolean;
  is_overdue: boolean;
  last_completed_at: string | null;
  completion_history: ReminderCompletion[];
}

export interface ReminderPayload {
  text: string;
  notes: string | null;
  schedule_type: "daily" | "once";
  due_date: string | null;
  due_time: string | null;
}

export interface ReadingHistoryEntry {
  chapter_id: number;
  reference: string;
  completed_at: string;
}

export interface HeatmapDay {
  date: string;
  count: number;
  level: number;
}

export interface ScriptureProgress {
  completed_count: number;
  total_count: number;
  percent_complete: number;
  today_completed: boolean;
  current_streak: number;
  longest_streak: number;
  current_reference: string | null;
  suggested_next_reference: string | null;
  recent_history: ReadingHistoryEntry[];
  heatmap: HeatmapDay[];
}

export interface ScriptureChapter {
  id: number;
  order_index: number;
  book: string;
  chapter_number: number;
  reference: string;
  is_completed: boolean;
  completed_at: string | null;
}

export interface MemoryStats {
  used_mb: number | null;
  total_mb: number | null;
  available_mb: number | null;
  used_percent: number | null;
}

export interface DiskStats {
  used_gb: number | null;
  total_gb: number | null;
  used_percent: number | null;
}

export interface NetworkStats {
  rx_total_bytes: number | null;
  tx_total_bytes: number | null;
  rx_bytes_per_second: number | null;
  tx_bytes_per_second: number | null;
}

export interface DockerStats {
  available: boolean;
  container_count: number | null;
  running_count: number | null;
  healthy_count: number | null;
  unhealthy_count: number | null;
}

export interface SystemSummary {
  hostname: string;
  actual_hostname: string;
  architecture: string;
  platform: string;
  cpu_usage_percent: number | null;
  load_average: number[];
  uptime_seconds: number | null;
  uptime_label: string | null;
  memory: MemoryStats;
  disk: DiskStats;
  temperature_c: number | null;
  network: NetworkStats;
  docker: DockerStats;
  service_count: number;
  online_service_count: number;
  degraded_service_count: number;
  offline_service_count: number;
  unknown_service_count: number;
  reminders_due_today: number;
  reminders_completed_today: number;
  scripture_percent_complete: number;
  last_updated_at: string | null;
  cpu_trend: ChartPoint[];
  memory_trend: ChartPoint[];
  disk_trend: ChartPoint[];
}

export interface BriefingQuote {
  text: string;
  author: string;
}

export interface DailyBriefing {
  greeting: string;
  segment: string;
  day_label: string;
  summary_text: string;
  priorities: string[];
  focus_message: string;
  reading_prompt: string | null;
  motivational_message: string | null;
  quote: BriefingQuote | null;
  system_status_line: string | null;
  scripture_of_the_day: string | null;
  widget_summaries: string[];
}

export interface ServiceAvailability {
  service_id: number;
  service_name: string;
  node_name: string | null;
  uptime_percent: number;
  recent_statuses: string[];
  last_checked_at: string | null;
}

export interface ReadingTrendPoint {
  date: string;
  completed_count: number;
  percent_complete: number;
  streak: number;
}

export interface DashboardMetrics {
  cpu_trend: ChartPoint[];
  memory_trend: ChartPoint[];
  disk_trend: ChartPoint[];
  reading_trend: ReadingTrendPoint[];
  service_availability: ServiceAvailability[];
}

export interface DashboardDiagnostics {
  backend_health: string;
  database_status: string;
  last_backup_at: string | null;
  integrations_available_count: number;
  integrations_total_count: number;
  last_health_check_at: string | null;
}

export interface DashboardAction {
  id: string;
  name: string;
  icon: string;
  description: string;
  kind: "link" | "backend" | "download" | "view";
  url: string | null;
  action_key: string | null;
  open_in_new_tab: boolean;
  requires_confirmation: boolean;
  confirmation_message: string | null;
}

export interface QuickActionLink {
  id: number;
  name: string;
  icon: string;
  description: string;
  url: string;
  open_in_new_tab: boolean;
  is_enabled: boolean;
  sort_order: number;
}

export interface QuickActionLinkPayload {
  name: string;
  icon: string;
  description: string;
  url: string;
  open_in_new_tab: boolean;
  is_enabled: boolean;
}

export interface NavidromeAlbum {
  id: string;
  name: string;
  artist: string;
  year: number | null;
  song_count: number | null;
}

export interface NavidromeNowPlayingItem {
  id: string;
  title: string;
  artist: string;
  album: string | null;
  user: string | null;
  duration_seconds: number | null;
}

export interface NavidromeLibrary {
  artist_count: number | null;
  album_count: number | null;
  song_count: number | null;
}

export interface NavidromeWidget {
  enabled: boolean;
  available: boolean;
  message: string | null;
  base_url: string | null;
  last_synced_at: string | null;
  library: NavidromeLibrary;
  newest_albums: NavidromeAlbum[];
  now_playing: NavidromeNowPlayingItem[];
}

export interface DashboardSummary {
  settings: SettingsData;
  services: Service[];
  nodes: Node[];
  dashboard_actions: DashboardAction[];
  control_actions: ControlItem[];
  reminders: Reminder[];
  notes: Note[];
  scripture: ScriptureProgress;
  daily_briefing: DailyBriefing;
  system_summary: SystemSummary;
  metrics: DashboardMetrics;
  diagnostics: DashboardDiagnostics;
  navidrome: NavidromeWidget;
}

export interface AuthStatus {
  enabled: boolean;
  authenticated: boolean;
  username: string | null;
}

export interface ActionResult {
  ok: boolean;
  message: string;
  checked: number | null;
}

export interface ServiceStatusCheck {
  id: number;
  service_id: number;
  service_name: string;
  status: string;
  checked_at: string;
  response_time_ms: number | null;
  http_status: number | null;
  message: string | null;
}

export interface IntegrationSummary {
  name: string;
  enabled: boolean;
  available: boolean;
  detail: string | null;
}

export interface BackupSummary {
  filename: string;
  created_at: string;
  size_bytes: number;
  stored_path: string | null;
}

export interface BackupDownload {
  blob: Blob;
  filename: string;
}

export interface DiagnosticsSummary {
  app_name: string;
  app_version: string;
  environment: string;
  timestamp: string;
  public_base_url: string | null;
  backend_health: string;
  database_status: string;
  database_path: string;
  auth_enabled: boolean;
  auth_username: string | null;
  last_backup: BackupSummary | null;
  backup_dir: string | null;
  service_health: {
    online: number;
    degraded: number;
    offline: number;
    unknown: number;
    recent_checks: ServiceStatusCheck[];
  };
  integrations: IntegrationSummary[];
}

export interface ControlItem {
  id: string;
  title: string;
  description: string;
  category: string;
  kind: "link" | "view" | "action" | "command";
  icon: string;
  url: string | null;
  action_key: string | null;
  command_key: string | null;
  open_in_new_tab: boolean;
  requires_confirmation: boolean;
  confirmation_message: string | null;
  is_favorite: boolean;
}

export interface HistoryEntry {
  id: number;
  entry_type: string;
  action_key: string;
  title: string;
  category: string;
  status: string;
  output: string;
  duration_ms: number | null;
  created_at: string;
}

export interface LogSource {
  id: string;
  label: string;
  description: string;
  available: boolean;
}

export interface LogView {
  source: string;
  fetched_at: string;
  lines: string[];
}

export interface CommandRunResult {
  command_key: string;
  title: string;
  ok: boolean;
  status: string;
  output: string;
  duration_ms: number;
  created_at: string;
}

export interface ControlCenterSummary {
  actions: ControlItem[];
  commands: ControlItem[];
  recent_history: HistoryEntry[];
  log_sources: LogSource[];
}
