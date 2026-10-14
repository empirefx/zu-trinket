import { type Category } from "../../lib/data";

interface CategoryPanelProps {
  categories: Category[];
  visible: Set<string>;
  countByCat: Record<string, number>;
  onToggle: (key: string) => void;
}

export function CategoryPanel({ categories, visible, countByCat, onToggle }: CategoryPanelProps) {
  return (
    <div id="category-panel" className="absolute top-44 right-3 z-50" data-testid="category-panel">
      <div className="w-40 bg-default/90 backdrop-blur-sm border border-divider rounded-sm p-1.5 space-y-1">
        {categories.map((c) => (
          <label key={c.key} className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={visible.has(c.key)}
              onChange={() => onToggle(c.key)}
              className="h-3.5 w-3.5 rounded border-border bg-transparent text-primary focus:ring-1.5 focus:ring-ring"
            />
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
            <span className="text-xs">{c.label}</span>
            <span className="text-[10px] text-muted-foreground ml-1">
              {countByCat[c.key] ?? 0}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}