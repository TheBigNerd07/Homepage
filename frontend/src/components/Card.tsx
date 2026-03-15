import type { PropsWithChildren, ReactNode } from "react";
import clsx from "clsx";

interface CardProps extends PropsWithChildren {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
}

export function Card({ title, eyebrow, action, className, children }: CardProps) {
  return (
    <section className={clsx("panel panel-hover p-5 sm:p-6", className)}>
      {(title || eyebrow || action) && (
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            {eyebrow ? <div className="label">{eyebrow}</div> : null}
            {title ? <h2 className="mt-2 text-xl font-semibold text-white">{title}</h2> : null}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
