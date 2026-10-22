import { Tabs } from "@heroui/react";
import { type Category } from "../../lib/data";

interface CategoryPanelProps {
  categories: Category[];
  visible: Set<string>;
  countByCat: Record<string, number>;
  onToggle: (key: string) => void;
}

// HeroUI Tabs as toggle buttons: RAC tabs are single-select, so the selection
// stays on no key and actuation toggles the category instead.
export function CategoryPanel({ categories, visible, countByCat, onToggle }: CategoryPanelProps) {
  return (
    <div id="category-panel" className="w-full" data-testid="category-panel">
      <Tabs
        selectedKey=""
        onSelectionChange={(k) => onToggle(String(k))}
        aria-label="Categories"
        data-testid="category-tabs"
        variant="light"
      >
        <Tabs.ListContainer className="w-full">
          <Tabs.List className="grid grid-cols-3 gap-x-1 gap-y-1 p-0" >
            {categories.map((c) => {
              const count = countByCat[c.key] ?? 0;
              const isEmpty = count === 0;
              return (
                <Tabs.Tab
                  key={c.key}
                  id={c.key}
                  isDisabled={isEmpty}
                  className={`flex items-center gap-1.5 cursor-pointer rounded px-3 py-0 ${
                    isEmpty ? "opacity-40" : ""
                  } ${
                    visible.has(c.key)
                      ? "bg-white/10 text-foreground"
                      : "text-muted-foreground hover:bg-black/40 hover:text-foreground"
                  }`}
                >
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                  <span className="text-xs truncate">{c.label}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto tabular-nums">{count}</span>
                </Tabs.Tab>
              );
            })}
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>
    </div>
  );
}
