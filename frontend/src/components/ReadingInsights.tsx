import { BookOpenText, Flame, Trophy } from "lucide-react";
import type { DashboardMetrics, ScriptureProgress } from "../types";
import { Card } from "./Card";
import { ReadingHeatmap } from "./ReadingHeatmap";
import { Sparkline } from "./Sparkline";

export function ReadingInsights({
  scripture,
  metrics,
}: {
  scripture: ScriptureProgress;
  metrics: DashboardMetrics;
}) {
  return (
    <Card title="Reading History" eyebrow="Book of Mormon">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
          <BookOpenText className="h-4 w-4 text-accent/80" />
          <div className="mt-3 text-2xl font-semibold text-white">{scripture.percent_complete}%</div>
          <div className="mt-1 text-sm text-slate-400">Total progress</div>
        </div>
        <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
          <Flame className="h-4 w-4 text-accent/80" />
          <div className="mt-3 text-2xl font-semibold text-white">{scripture.current_streak}</div>
          <div className="mt-1 text-sm text-slate-400">Current streak</div>
        </div>
        <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
          <Trophy className="h-4 w-4 text-accent/80" />
          <div className="mt-3 text-2xl font-semibold text-white">{scripture.longest_streak}</div>
          <div className="mt-1 text-sm text-slate-400">Best streak</div>
        </div>
      </div>
      <div className="mt-5 rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
        <div className="label">Progress Trend</div>
        <div className="mt-3">
          <Sparkline points={metrics.reading_trend.map((item) => item.percent_complete)} />
        </div>
      </div>
      <div className="mt-5 rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
        <ReadingHeatmap days={scripture.heatmap} />
      </div>
    </Card>
  );
}
