// The refine page header: the select-gear dropdown (the gear the current
// build carries, from the gear page) + the Builds dropdown. The build
// selection/persistence is the same lib/builds storage the gear page uses.
import { useEffect, type Key } from "react";
import {
  Button,
  Description,
  Dropdown,
  Header,
  Label,
  ListBox,
  Select,
  Separator,
} from "@heroui/react";
import { useBuild } from "../gear/BuildContext";
import { CLASS_NAMES, pretty } from "../gear/gearSlots";
import { iconClass } from "../../lib/icons";
import {
  emptyBuild,
  getSelectedId,
  listBuilds,
  MAX_BUILDS,
  saveBuild,
  setSelectedId as persistSelectedId,
  type BuildSnapshot,
} from "../../lib/builds";

const withPet = (s: BuildSnapshot): BuildSnapshot =>
  s.pet ? { ...s, pet: { ...s.pet, gear: s.pet.gear ?? {}, spells: s.pet.spells ?? {} } } : s;

export function RefineHeader({
  sel,
  onSel,
}: {
  sel: string | null;
  onSel: (slot: string | null) => void;
}) {
  const { gear, applyBuild, setSelectedId } = useBuild();

  // same boot as BuildsHeader: load the persisted selected build once
  useEffect(() => {
    const id = getSelectedId();
    if (id === null) return;
    const b = listBuilds().find((x) => x.id === id);
    if (b) {
      applyBuild(withPet(b.state));
      setSelectedId(b.id);
    } else persistSelectedId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entries = Object.entries(gear);
  const picked = sel && gear[sel] ? sel : null;

  const pickBuild = (s: BuildSnapshot, id: string) => {
    applyBuild(withPet(s));
    setSelectedId(id);
    persistSelectedId(id);
  };

  const builds = listBuilds();

  const menuAction = (key: Key) => {
    const k = String(key);
    if (k === "create") {
      if (builds.length >= MAX_BUILDS) return;
      const saved = saveBuild("Build " + (builds.length + 1), emptyBuild());
      if (saved) {
        applyBuild(saved.state);
        setSelectedId(saved.id);
        persistSelectedId(saved.id);
      }
      return;
    }
    const b = builds.find((x) => x.id === k);
    if (b) pickBuild(b.state, b.id);
  };

  return (
    <header className="r-head" data-testid="refine-header">
      <div /> {/* the header's left slot stays empty: select gear + Builds only */}
      <div className="r-sel-wrap">
        <span className="r-sel-label">Select gear</span>
        <Select
        aria-label="Select gear"
        variant="secondary"
        className="r-gear-select"
        value={picked ?? ""}
        onChange={(v: Key | Key[] | null) => onSel(v && String(v) ? String(v) : null)}
      >
        <Select.Trigger>
          <Select.Value>
            {picked ? (
              <span className="r-sel">
                <span className={`r-gicon zs ${iconClass(gear[picked].item.icon) ?? ""}`} aria-hidden="true" />
                <span className="r-sel-name">{gear[picked].item.name}</span>
              </span>
            ) : (
              <span className="r-sel-name r-sel-ph">
                {entries.length ? "Select gear" : "No gear in this build"}
              </span>
            )}
          </Select.Value>
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {entries.map(([slot, e]) => (
              <ListBox.Item key={slot} id={slot} textValue={e.item.name}>
                <span className={`r-gicon zs ${iconClass(e.item.icon) ?? ""}`} aria-hidden="true" />
                <div className="r-sel">
                  <Label className="r-sel-name">{e.item.name}</Label>
                  <Description>
                    {pretty(slot)} · Rank {e.rank} · Enchant +{e.enhance}
                  </Description>
                </div>
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
      </div>

      <div className="flex items-center justify-end">
        <Dropdown>
        <Button variant="outline" size="md" className="rounded-full h-9 px-5 text-sm border-2">
          Builds
        </Button>
        <Dropdown.Popover className="min-w-[260px] max-w-[320px]">
          <Dropdown.Menu onAction={menuAction} disabledKeys={builds.length >= MAX_BUILDS ? ["create"] : []}>
            <Dropdown.Section>
              <Header>
                Builds ({builds.length} / {MAX_BUILDS})
              </Header>
              {builds.map((b) => {
                const cls = b.state?.classId ?? "swordsman";
                const lvl = b.state?.level ?? 0;
                return (
                  <Dropdown.Item key={b.id} id={b.id} textValue={b.name}>
                    <div className="flex flex-col min-w-0 w-full">
                      <Label className="truncate max-w-full">{b.name}</Label>
                      <Description>{CLASS_NAMES[cls] ?? cls} · Lv {lvl}</Description>
                    </div>
                  </Dropdown.Item>
                );
              })}
            </Dropdown.Section>
            <Separator />
            <Dropdown.Section>
              <Dropdown.Item id="create" textValue="Create build">
                <Label className="font-semibold text-accent">+ Create build</Label>
              </Dropdown.Item>
            </Dropdown.Section>
          </Dropdown.Menu>
        </Dropdown.Popover>
        </Dropdown>
      </div>
    </header>
  );
}
