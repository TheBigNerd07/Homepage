import clsx from "clsx";

interface SparklineProps {
  points: Array<number | null>;
  className?: string;
  strokeClassName?: string;
  fillClassName?: string;
}

function buildPath(points: Array<number | null>, width: number, height: number) {
  const filtered = points.filter((value): value is number => value !== null);
  if (!filtered.length) {
    return "";
  }

  const min = Math.min(...filtered);
  const max = Math.max(...filtered);
  const range = max - min || 1;

  return points
    .map((value, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const normalized = value === null ? filtered[filtered.length - 1] : value;
      const y = height - (((normalized ?? min) - min) / range) * height;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function Sparkline({
  points,
  className,
  strokeClassName = "stroke-accent/85",
  fillClassName = "fill-accent/10",
}: SparklineProps) {
  const width = 160;
  const height = 48;
  const path = buildPath(points, width, height);

  if (!path) {
    return <div className={clsx("h-12 rounded-2xl bg-white/[0.03]", className)} />;
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={clsx("h-12 w-full", className)} preserveAspectRatio="none">
      <path d={`${path} L ${width} ${height} L 0 ${height} Z`} className={fillClassName} />
      <path d={path} className={clsx("fill-none stroke-[2.5]", strokeClassName)} strokeLinecap="round" />
    </svg>
  );
}
