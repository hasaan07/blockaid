import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`glass p-7 ${hover ? "transition hover:-translate-y-2.5 hover:shadow-glow-strong" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({ children, ghost = false }: { children: ReactNode; ghost?: boolean }) {
  return (
    <span
      className={
        ghost
          ? "inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-body"
          : "inline-flex items-center justify-center rounded-full border border-cyan/35 bg-cyan/15 px-3 py-1.5 text-xs font-bold text-cyan"
      }
    >
      {children}
    </span>
  );
}
