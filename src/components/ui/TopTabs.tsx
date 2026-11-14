import logo from "../../assets/logo.bmp";

type TabKey = "map" | "gear" | "refine";

interface TopTabsProps {
  activeKey: TabKey;
  onChange: (key: TabKey) => void;
}

export function TopTabs({ activeKey, onChange }: TopTabsProps) {
  const tabs: [TabKey, string][] = [
    ["map", "Map"],
    ["gear", "Gear"],
    ["refine", "Refine"],
  ];
  return (
    <div
      id="top-tabs-panel"
      className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-1 rounded-lg bg-default/95 backdrop-blur-sm border border-divider shadow-lg max-w-[calc(100vw-12px)]"
      data-testid="top-tabs"
    >
      <div
        className="flex h-8 shrink-0 items-center justify-center px-2 text-foreground/50 select-none"
        aria-label="Logo"
      >
        <img src={logo} alt="" className="h-6 w-auto" />
      </div>
      {tabs.map(([key, label]) => (
        <div
          key={key}
          className={`flex h-8 min-w-0 items-center justify-center whitespace-nowrap px-2 text-xs font-medium rounded transition-colors cursor-pointer select-none sm:px-3 sm:text-sm ${
            activeKey === key
              ? "bg-white/10 text-foreground font-medium"
              : "text-muted-foreground hover:bg-black/40 hover:text-foreground"
          }`}
          onClick={() => onChange(key)}
          role="tab"
          aria-selected={activeKey === key}
        >
          {label}
        </div>
      ))}
    </div>
  );
}