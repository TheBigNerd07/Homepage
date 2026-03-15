interface ProgressBarProps {
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  return (
    <div className="h-3 overflow-hidden rounded-full bg-white/8">
      <div
        className="h-full rounded-full bg-gradient-to-r from-accent/70 via-accent to-sky-400 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
