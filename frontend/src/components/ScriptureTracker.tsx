import { useEffect, useMemo, useState } from "react";
import { BookOpenText, Flame, Trophy } from "lucide-react";
import type { ScriptureChapter, ScriptureProgress } from "../types";
import { Card } from "./Card";
import { ProgressBar } from "./ProgressBar";
import { ReadingHeatmap } from "./ReadingHeatmap";

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

interface ScriptureTrackerProps {
  progress: ScriptureProgress;
  chapters: ScriptureChapter[];
  onCompleteChapter: (chapterId: number) => Promise<void>;
  busy: boolean;
}

export function ScriptureTracker({
  progress,
  chapters,
  onCompleteChapter,
  busy,
}: ScriptureTrackerProps) {
  const incompleteChapters = useMemo(
    () => chapters.filter((chapter) => !chapter.is_completed),
    [chapters],
  );
  const [selectedChapterId, setSelectedChapterId] = useState<number | "">("");

  useEffect(() => {
    setSelectedChapterId(incompleteChapters[0]?.id ?? "");
  }, [incompleteChapters]);

  return (
    <Card title="Book of Mormon Tracker" eyebrow={`${progress.completed_count}/${progress.total_count} chapters`}>
      <div className="space-y-5">
        <div className="rounded-[24px] border border-white/8 bg-gradient-to-br from-white/[0.06] via-white/[0.03] to-transparent p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="label">Current Chapter</div>
              <div className="mt-2 text-2xl font-semibold text-white">
                {progress.current_reference ?? "Completed"}
              </div>
              <p className="mt-2 text-sm text-slate-300">
                {progress.today_completed
                  ? "Today's reading is complete."
                  : `Suggested next chapter: ${progress.suggested_next_reference ?? "All chapters finished"}.`}
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3">
                <BookOpenText className="mx-auto h-4 w-4 text-accent/80" />
                <div className="mt-2 text-xl font-semibold text-white">{progress.percent_complete}%</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Progress</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3">
                <Flame className="mx-auto h-4 w-4 text-accent/80" />
                <div className="mt-2 text-xl font-semibold text-white">{progress.current_streak}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Streak</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-slate-950/30 px-4 py-3">
                <Trophy className="mx-auto h-4 w-4 text-accent/80" />
                <div className="mt-2 text-xl font-semibold text-white">{progress.longest_streak}</div>
                <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">Best</div>
              </div>
            </div>
          </div>
          <div className="mt-5">
            <ProgressBar value={progress.percent_complete} />
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-[1fr_0.95fr]">
          <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4">
            <div className="label">Mark Chapter Complete</div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <select
                value={selectedChapterId}
                onChange={(event) =>
                  setSelectedChapterId(event.target.value ? Number(event.target.value) : "")
                }
                className="input"
                disabled={!incompleteChapters.length || busy}
              >
                {incompleteChapters.length ? null : <option value="">All chapters completed</option>}
                {incompleteChapters.map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.reference}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="button-primary"
                disabled={selectedChapterId === "" || busy}
                onClick={() => selectedChapterId !== "" && onCompleteChapter(selectedChapterId)}
              >
                Complete chapter
              </button>
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4">
            <div className="label">Recent History</div>
            <div className="mt-3 space-y-3">
              {progress.recent_history.length ? (
                progress.recent_history.map((entry) => (
                  <div
                    key={entry.chapter_id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-slate-100">{entry.reference}</span>
                    <span className="text-slate-400">{dateTimeFormatter.format(new Date(entry.completed_at))}</span>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-white/12 px-4 py-8 text-center text-sm text-slate-400">
                  No reading history yet.
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="rounded-[24px] border border-white/8 bg-slate-950/30 p-4">
          <ReadingHeatmap days={progress.heatmap} />
        </div>
      </div>
    </Card>
  );
}
