import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { Card } from "./Card";

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const secondsFormatter = new Intl.DateTimeFormat(undefined, {
  second: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function TimeCard() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <Card
      title="Current Time"
      eyebrow="Clock"
      action={<Clock3 className="h-5 w-5 text-accent/80" />}
      className="overflow-hidden"
    >
      <div className="rounded-[24px] border border-white/8 bg-gradient-to-br from-white/[0.07] via-white/[0.03] to-transparent p-5">
        <div className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {timeFormatter.format(now)}
          <span className="ml-2 font-mono text-lg text-accent/90 sm:text-xl">
            {secondsFormatter.format(now)}
          </span>
        </div>
        <p className="mt-3 text-sm text-slate-300">{dateFormatter.format(now)}</p>
      </div>
    </Card>
  );
}
