interface GearViewerProps {
  className?: string;
  label?: string;
  minHeight?: number;
  isPet?: boolean;
}

export function GearViewer({ className = "", label = "3D preview", minHeight = 340, isPet = false }: GearViewerProps) {
  return (
    <div
      className={`view ${isPet ? "pet" : ""} ${className}`}
      style={{ minHeight }}
    >
      {label}
    </div>
  );
}