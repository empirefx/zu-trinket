import type { ReactNode } from "react";

interface BoxProps {
  title: string;
  children: ReactNode;
  className?: string;
  maxWidth?: string;
  dimmed?: boolean;
}

export function Box({ title, children, className = "", maxWidth, dimmed }: BoxProps) {
  return (
    <div
      className={`box ${className} ${dimmed ? "dimmed" : ""}`}
      style={{ maxWidth }}
    >
      <h2>{title}</h2>
      {children}
    </div>
  );
}