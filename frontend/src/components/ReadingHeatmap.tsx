import clsx from "clsx";
import type { HeatmapDay } from "../types";

const levelStyles = [
  "bg-white/6",
  "bg-accent/20",
  "bg-accent/40",
  "bg-accent/65",
  "bg-sky-400/80",
];

export function ReadingHeatmap({ days }: { days: HeatmapDay[] }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <span className="label">Last 84 Days</span>
        <div className="flex items-center gap-2 text-[0.7rem] text-slate-400">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <span
              key={level}
              className={clsx("h-3 w-3 rounded-[4px]", levelStyles[level])}
            />
          ))}
          <span>More</span>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-1.5 sm:grid-cols-[repeat(14,minmax(0,1fr))]">
        {days.map((day) => (
          <div
            key={day.date}
            className={clsx("aspect-square rounded-[6px] transition hover:scale-105", levelStyles[day.level])}
            title={`${day.date}: ${day.count} chapter${day.count === 1 ? "" : "s"}`}
          />
        ))}
      </div>
    </div>
  );
}
