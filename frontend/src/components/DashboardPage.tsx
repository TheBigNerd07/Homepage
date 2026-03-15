import { useMemo, useState } from "react";
import type { DashboardAction, DashboardSummary, ReminderPayload, ScriptureChapter } from "../types";
import { widgetRegistry, type DashboardWidgetContext } from "../dashboard/widgetRegistry";

function widgetSpan(size: string) {
  if (size === "hero" || size === "wide") {
    return "xl:col-span-2";
  }
  return "xl:col-span-1";
}

interface DashboardPageProps {
  dashboard: DashboardSummary;
  chapters: ScriptureChapter[];
  busy: boolean;
  isMobile: boolean;
  onInvokeAction: (action: DashboardAction) => void;
  onToggleReminder: (reminderId: number, completed: boolean) => Promise<void>;
  onCreateReminder: (payload: ReminderPayload) => Promise<void>;
  onCompleteChapter: (chapterId: number) => Promise<void>;
  onOpenView: (view: "control" | "nodes" | "notes" | "diagnostics") => void;
}

export function DashboardPage({
  dashboard,
  chapters,
  busy,
  isMobile,
  onInvokeAction,
  onToggleReminder,
  onCreateReminder,
  onCompleteChapter,
  onOpenView,
}: DashboardPageProps) {
  const [showFullMobile, setShowFullMobile] = useState(false);

  const enabledSections = useMemo(
    () => dashboard.settings.dashboard_sections.filter((section) => section.enabled),
    [dashboard.settings.dashboard_sections],
  );
  const layoutItems = useMemo(() => {
    const enabledSectionIds = new Set(enabledSections.map((section) => section.id));
    let items = dashboard.settings.widget_layout
      .filter((item) => item.enabled && enabledSectionIds.has(item.section_id) && widgetRegistry[item.widget_id])
      .sort((left, right) => left.order - right.order);

    if (isMobile && dashboard.settings.mobile_home_mode !== "full" && !showFullMobile) {
      const preferred =
        dashboard.settings.mobile_home_mode === "compact"
          ? new Set(["daily_briefing", "node_overview", "quick_actions"])
          : new Set(["daily_briefing", "node_overview", "service_launcher", "quick_actions"]);
      items = items.filter((item) => preferred.has(item.widget_id));
    }

    return items;
  }, [dashboard.settings.mobile_home_mode, dashboard.settings.widget_layout, enabledSections, isMobile, showFullMobile]);

  const context: DashboardWidgetContext = {
    dashboard,
    chapters,
    busy,
    onInvokeAction,
    onToggleReminder,
    onCreateReminder,
    onCompleteChapter,
    onOpenView,
  };

  return (
    <div className="space-y-6">
      {isMobile && dashboard.settings.mobile_home_mode !== "full" ? (
        <div className="flex justify-end">
          <button
            type="button"
            className="button-secondary"
            onClick={() => setShowFullMobile((current) => !current)}
          >
            {showFullMobile ? "Show simplified mobile view" : "Show full dashboard"}
          </button>
        </div>
      ) : null}

      {enabledSections.map((section) => {
        const sectionItems = layoutItems.filter((item) => item.section_id === section.id);
        if (!sectionItems.length) {
          return null;
        }
        return (
          <section key={section.id} className="space-y-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="label">{section.label}</div>
                <p className="mt-2 text-sm text-slate-400">{section.description}</p>
              </div>
            </div>
            <div className="grid gap-6 xl:grid-cols-2">
              {sectionItems.map((item) => (
                <div key={item.widget_id} className={widgetSpan(item.size)}>
                  {widgetRegistry[item.widget_id].render(context)}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
