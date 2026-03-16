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
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {eyebrow ? <div className="label break-words">{eyebrow}</div> : null}
            {title ? <h2 className="mt-2 break-words text-xl font-semibold text-white">{title}</h2> : null}
          </div>
          {action ? <div className="min-w-0 w-full lg:w-auto lg:max-w-full">{action}</div> : null}
        </div>
      )}
      {children}
    </section>
  );
}
