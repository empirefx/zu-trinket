import { type Category } from "../../lib/data";

interface CategoryPanelProps {
  categories: Category[];
  visible: Set<string>;
  countByCat: Record<string, number>;
  onToggle: (key: string) => void;
}

export function CategoryPanel({ categories, visible, countByCat, onToggle }: CategoryPanelProps) {
  return (
    <div id="category-panel" className="w-full" data-testid="category-panel">
      <div className="grid grid-cols-3 gap-x-3 gap-y-1">
        {categories.map((c) => {
          const count = countByCat[c.key] ?? 0;
          const isEmpty = count === 0;
          return (
            <label
              key={c.key}
              className={`flex items-center gap-1.5 cursor-pointer ${isEmpty ? "opacity-40 pointer-events-none" : ""}`}
            >
              <input
                type="checkbox"
                checked={visible.has(c.key)}
                onChange={() => onToggle(c.key)}
                disabled={isEmpty}
                className="h-3.5 w-3.5 rounded border-border bg-transparent text-primary focus:ring-1.5 focus:ring-ring"
              />
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.color }} />
              <span className="text-xs truncate">{c.label}</span>
              <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">{count}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
