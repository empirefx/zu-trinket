import type { ReactNode } from "react";

interface BoxProps {
  title: string;
  children: ReactNode;
  className?: string;
  maxWidth?: string;
}

export function Box({ title, children, className = "", maxWidth }: BoxProps) {
  return (
    <div
      className={`box ${className}`}
      style={{ maxWidth }}
    >
      <h2>{title}</h2>
      {children}
    </div>
  );
}