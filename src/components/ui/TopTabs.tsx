import logo from "../../assets/logo.bmp";

type TabKey = "map" | "gear";

interface TopTabsProps {
  activeKey: TabKey;
  onChange: (key: TabKey) => void;
}

export function TopTabs({ activeKey, onChange }: TopTabsProps) {
  return (
    <div
      id="top-tabs-panel"
      className="absolute top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 px-2 py-1 rounded-lg bg-default/95 backdrop-blur-sm border border-divider shadow-lg"
      data-testid="top-tabs"
    >
      <div
        className="flex h-8 items-center justify-center px-2 text-foreground/50 select-none"
        aria-label="Logo"
      >
        <img src={logo} alt="" className="h-6 w-auto" />
      </div>
      <div
        className={`flex h-8 items-center gap-2 px-3 text-sm font-medium rounded transition-colors cursor-pointer select-none ${
          activeKey === "map"
            ? "bg-white/10 text-foreground font-medium"
            : "text-muted-foreground hover:bg-black/40 hover:text-foreground"
        }`}
        onClick={() => onChange("map")}
        role="tab"
        aria-selected={activeKey === "map"}
      >
        Map
      </div>
      <div
        className={`flex h-8 items-center justify-center px-3 text-sm font-medium rounded transition-colors cursor-pointer select-none ${
          activeKey === "gear"
            ? "bg-white/10 text-foreground font-medium"
            : "text-muted-foreground hover:bg-black/40 hover:text-foreground"
        }`}
        onClick={() => onChange("gear")}
        role="tab"
        aria-selected={activeKey === "gear"}
      >
        Gear
      </div>
    </div>
  );
}