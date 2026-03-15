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
  quick_actions: DashboardAction[];
  reminders: Reminder[];
  scripture: ScriptureProgress;
  daily_briefing: DailyBriefing;
  system_summary: SystemSummary;
  navidrome: NavidromeWidget;
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
  is_enabled: boolean;
  is_favorite: boolean;
  health_check_url: string | null;
  health_check_interval_seconds: number | null;
  health_check_timeout_seconds: number | null;
}

export interface ReminderPayload {
  text: string;
  notes: string | null;
  schedule_type: "daily" | "once";
  due_date: string | null;
  due_time: string | null;
}

export interface QuickActionLinkPayload {
  name: string;
  icon: string;
  description: string;
  url: string;
  open_in_new_tab: boolean;
  is_enabled: boolean;
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
