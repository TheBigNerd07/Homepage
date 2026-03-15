import type { ReactNode } from "react";
import { DailyBriefingCard } from "../components/DailyBriefingCard";
import { DiagnosticsSummaryCard } from "../components/DiagnosticsSummaryCard";
import { NavidromeWidget } from "../components/NavidromeWidget";
import { NodeOverview } from "../components/NodeOverview";
import { NotesWidget } from "../components/NotesWidget";
import { QuickActions } from "../components/QuickActions";
import { ReadingInsights } from "../components/ReadingInsights";
import { RecentAlbumsWidget } from "../components/RecentAlbumsWidget";
import { RemindersCard } from "../components/RemindersCard";
import { ScriptureTracker } from "../components/ScriptureTracker";
import { ServiceHealthSummary } from "../components/ServiceHealthSummary";
import { ServiceLauncher } from "../components/ServiceLauncher";
import { SystemOverview } from "../components/SystemOverview";
import type { DashboardAction, DashboardSummary, ReminderPayload, ScriptureChapter } from "../types";

export interface DashboardWidgetContext {
  dashboard: DashboardSummary;
  chapters: ScriptureChapter[];
  busy: boolean;
  onInvokeAction: (action: DashboardAction) => void;
  onToggleReminder: (reminderId: number, completed: boolean) => Promise<void>;
  onCreateReminder: (payload: ReminderPayload) => Promise<void>;
  onCompleteChapter: (chapterId: number) => Promise<void>;
  onOpenView: (view: "control" | "nodes" | "notes" | "diagnostics") => void;
}

export interface DashboardWidgetDefinition {
  id: string;
  title: string;
  description: string;
  render: (context: DashboardWidgetContext) => ReactNode;
}

export const widgetRegistry: Record<string, DashboardWidgetDefinition> = {
  daily_briefing: {
    id: "daily_briefing",
    title: "Daily Briefing",
    description: "Time-aware summary of your day and system state.",
    render: ({ dashboard }) => <DailyBriefingCard briefing={dashboard.daily_briefing} />,
  },
  node_overview: {
    id: "node_overview",
    title: "Node Overview",
    description: "Multi-node status, roles, and service placement.",
    render: ({ dashboard, onOpenView }) => (
      <NodeOverview nodes={dashboard.nodes} onSelectNode={() => onOpenView("nodes")} />
    ),
  },
  service_launcher: {
    id: "service_launcher",
    title: "Service Launcher",
    description: "Launch and filter services by category or node.",
    render: ({ dashboard }) => (
      <ServiceLauncher services={dashboard.services} nodes={dashboard.nodes} settings={dashboard.settings} />
    ),
  },
  system_overview: {
    id: "system_overview",
    title: "System Overview",
    description: "Local host telemetry and trend charts.",
    render: ({ dashboard }) => <SystemOverview summary={dashboard.system_summary} />,
  },
  service_health_summary: {
    id: "service_health_summary",
    title: "Service Health Summary",
    description: "Availability snapshots and recent service health history.",
    render: ({ dashboard }) => <ServiceHealthSummary services={dashboard.metrics.service_availability} />,
  },
  quick_actions: {
    id: "quick_actions",
    title: "Quick Actions",
    description: "Safe shortcuts into the control center.",
    render: ({ dashboard, busy, onInvokeAction }) => (
      <QuickActions actions={dashboard.dashboard_actions} busy={busy} onInvoke={onInvokeAction} />
    ),
  },
  reminders: {
    id: "reminders",
    title: "Reminders",
    description: "Daily reminders and quick add flows.",
    render: ({ dashboard, busy, onToggleReminder, onCreateReminder }) => (
      <RemindersCard
        reminders={dashboard.reminders}
        defaultReminderTime={dashboard.settings.default_reminder_time}
        busy={busy}
        onToggleReminder={onToggleReminder}
        onCreateReminder={onCreateReminder}
      />
    ),
  },
  notes: {
    id: "notes",
    title: "Notes",
    description: "Pinned scratchpad notes.",
    render: ({ dashboard, onOpenView }) => (
      <NotesWidget notes={dashboard.notes} onOpenNotes={() => onOpenView("notes")} />
    ),
  },
  scripture_tracker: {
    id: "scripture_tracker",
    title: "Scripture Tracker",
    description: "Book of Mormon reading progress and completion flow.",
    render: ({ dashboard, chapters, busy, onCompleteChapter }) => (
      <ScriptureTracker
        progress={dashboard.scripture}
        chapters={chapters}
        busy={busy}
        onCompleteChapter={onCompleteChapter}
      />
    ),
  },
  reading_history_heatmap: {
    id: "reading_history_heatmap",
    title: "Reading History",
    description: "Heatmap and progress trend for reading streaks.",
    render: ({ dashboard }) => (
      <ReadingInsights scripture={dashboard.scripture} metrics={dashboard.metrics} />
    ),
  },
  navidrome_stats: {
    id: "navidrome_stats",
    title: "Navidrome Activity",
    description: "Library stats and current listening activity.",
    render: ({ dashboard }) => <NavidromeWidget widget={dashboard.navidrome} />,
  },
  recent_albums: {
    id: "recent_albums",
    title: "Recent Albums",
    description: "Most recent Navidrome additions.",
    render: ({ dashboard }) => <RecentAlbumsWidget widget={dashboard.navidrome} />,
  },
  diagnostics_summary: {
    id: "diagnostics_summary",
    title: "Diagnostics Summary",
    description: "Runtime status, backup state, and integration health.",
    render: ({ dashboard, onOpenView }) => (
      <DiagnosticsSummaryCard diagnostics={dashboard.diagnostics} onOpenDiagnostics={() => onOpenView("diagnostics")} />
    ),
  },
};
