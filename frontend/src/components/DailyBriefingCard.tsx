import { Sparkles } from "lucide-react";
import type { DailyBriefing } from "../types";
import { Card } from "./Card";

export function DailyBriefingCard({ briefing }: { briefing: DailyBriefing }) {
  return (
    <Card
      title="Daily Briefing"
      eyebrow={briefing.day_label}
      action={<Sparkles className="h-5 w-5 text-accent/80" />}
      className="overflow-hidden"
    >
      <div className="space-y-5">
        <div className="rounded-[26px] border border-accent/15 bg-gradient-to-br from-accent/12 via-white/[0.03] to-transparent p-5 sm:p-6">
          <div className="text-3xl font-semibold tracking-tight text-white">{briefing.greeting}</div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{briefing.summary_text}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4">
              <div className="label">Today's Focus</div>
              <p className="mt-2 text-sm font-medium text-slate-100">{briefing.focus_message}</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4">
              <div className="label">Motivation</div>
              <p className="mt-2 text-sm font-medium text-slate-100">
                {briefing.motivational_message ?? "Keep the next action obvious."}
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
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
            {briefing.quote ? (
              <div className="rounded-2xl border border-white/8 bg-slate-950/30 p-4">
                <div className="label">Quote</div>
                <blockquote className="mt-2 text-sm leading-6 text-slate-200">
                  “{briefing.quote.text}”
                </blockquote>
                <p className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-400">
                  {briefing.quote.author}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
