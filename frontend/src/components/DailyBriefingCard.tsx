import { MoonStar, Sparkles, Sun } from "lucide-react";
import type { DailyBriefing } from "../types";
import { Card } from "./Card";

function segmentIcon(segment: string) {
  if (segment === "morning") {
    return <Sun className="h-5 w-5 text-accent/80" />;
  }
  if (segment === "evening") {
    return <MoonStar className="h-5 w-5 text-accent/80" />;
  }
  return <Sparkles className="h-5 w-5 text-accent/80" />;
}

export function DailyBriefingCard({ briefing }: { briefing: DailyBriefing }) {
  return (
    <Card
      title="Daily Briefing"
      eyebrow={briefing.day_label}
      action={segmentIcon(briefing.segment)}
      className="overflow-hidden"
    >
      <div className="space-y-5">
        <div className="rounded-[26px] border border-accent/15 bg-gradient-to-br from-accent/12 via-white/[0.03] to-transparent p-5 sm:p-6">
          <div className="text-3xl font-semibold tracking-tight text-white">{briefing.greeting}</div>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">{briefing.summary_text}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4">
              <div className="label">Focus</div>
              <p className="mt-2 text-sm font-medium text-slate-100">{briefing.focus_message}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4">
              <div className="label">System</div>
              <p className="mt-2 text-sm font-medium text-slate-100">
                {briefing.system_status_line ?? "System status is steady."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4">
              <div className="label">Scripture Of The Day</div>
              <p className="mt-2 text-sm font-medium text-slate-100">
                {briefing.scripture_of_the_day ?? "No scripture prompt selected."}
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4">
            <div className="label">Priorities</div>
            <ul className="mt-3 space-y-3">
              {briefing.priorities.map((priority) => (
                <li
                  key={priority}
                  className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3 text-sm text-slate-200"
                >
                  {priority}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4">
              <div className="label">Reading Prompt</div>
              <p className="mt-2 text-sm text-slate-200">
                {briefing.reading_prompt ?? "Today's reading is already complete."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4">
              <div className="label">Widget Highlights</div>
              {briefing.widget_summaries.length ? (
                <div className="mt-2 space-y-2">
                  {briefing.widget_summaries.map((item) => (
                    <div key={item} className="rounded-2xl border border-white/6 bg-white/[0.03] px-3 py-2 text-sm text-slate-200">
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-400">No favorite widget summaries selected yet.</p>
              )}
            </div>
            {briefing.motivational_message ? (
              <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4">
                <div className="label">Motivation</div>
                <p className="mt-2 text-sm text-slate-200">{briefing.motivational_message}</p>
                {briefing.quote ? (
                  <blockquote className="mt-3 border-l border-white/10 pl-3 text-sm leading-6 text-slate-300">
                    “{briefing.quote.text}”
                    <div className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
                      {briefing.quote.author}
                    </div>
                  </blockquote>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
