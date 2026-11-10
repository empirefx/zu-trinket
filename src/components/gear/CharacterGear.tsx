import { useState, type Key, type ReactNode } from "react";
import { Button, Chip, Description, Input, Label, ListBox, Modal, Select } from "@heroui/react";
import { GearColumn } from "./GearColumn";
import { GearViewer } from "./GearViewer";
import { GearSlot } from "./GearSlot";
import { GearTooltip } from "./GearTooltip";
import { GearPicker } from "./GearPicker";
import { GearDrawer } from "./GearDrawer";
import { PetPicker } from "./pet/PetPicker";
import { glyph, glyphColor } from "./GearDrawer";
import { CLASS_NAMES, SLOT_ITEMS } from "./gearSlots";
import { iconClass, petIconClass } from "../../lib/icons";
import { usePets } from "../../hooks/usePets";
import { useBuild, type ClassId, type PetBuild } from "./BuildContext";
import { petApt, petTooltip, petPower, icons as petIcons, type Stats, type Aptitudes } from "../../lib/pets";
import { TITLES } from "./generated/titles";
import type { EquipEntry, Item } from "../../lib/items";

const LEFT_SLOTS = [
  "Precious",
  "Weapon",
  "SpiritWeapon",
  "SpiritArmor",
  "FortuneGear",
  "Trinket",
];

const RIGHT_SLOTS = [
  "Headband",
  "Clothes",
  "WaistbandDecorator",
  "Armguards",
  "Boots",
];

const BOTTOM_SLOTS = [
  "FashionHead",
  "FashionBody",
  "FashionWeapon",
  "FashionWings",
];

const TITLES_OPTIONS = [{ name: "None", effect: "" }, ...TITLES];

// The pet-slot hover tooltip in the game's own format (live sample:
// zu-re/evidence/pet_tooltip.txt): name, Fighting Power, level, the five
// "+X" stats, aptitudes, assigned spell ranks and the four gear names.
// Uses the .item-tip card (same background/border corner/white text as the
// gear tooltip). All rows are (est.): the doc-fitted model of
// docs/pet-stat-calculations.md builds the tooltip (fresh formula + Pet
// Bolus roll + gear), the game's own petPower builds Fighting Power, and
// the sun/moon/star row is the icon estimate (own stats, no gear).
function PetTip({ pets, pet }: { pets: NonNullable<ReturnType<typeof usePets>>; pet: NonNullable<PetBuild> }) {
  const species = pets.species.find((s) => s.id === pet.speciesId);
  // the egg-range midpoints stand in for the server's aptitude roll (est.)
  const A = petApt(pet.level, species?.apt ?? null);
  const cur = A?.[0] ?? 0;
  const apt: Aptitudes = { life: cur, mana: cur, attack: cur, pd: cur, md: cur };
  const gearList = [0, 1, 2, 3].map((i) => pet.gear[i]).filter(Boolean);
  const gear: Partial<Stats> = {
    atk: gearList.reduce((s, g) => s + (g.atk ?? 0), 0),
    pd: gearList.reduce((s, g) => s + (g.pd ?? 0), 0),
    md: gearList.reduce((s, g) => s + (g.md ?? 0), 0),
  };
  const { own, total } = petTooltip(pet.level, apt, { gear });
  const power = petPower({
    level: pet.level,
    pot: [cur, cur, cur, cur, cur],
    val: [total.hp, total.mp, total.atk, total.pd, total.md],
    spells: Object.values(pet.spells),
    spellPower: pets.spellPower,
  });
  const ic = petIcons(pet.level, own);
  const spells = [0, 1, 2, 3, 4, 5, 6, 7]
    .map((slot) => pet.spells[slot])
    .filter((a) => a && a.rank > 0)
    .map((a) => ({ name: pets.spells[a.kind]?.name ?? "?", rank: a.rank }));
  return (
    <div className="item-tip">
      <p className="center tp-name">{species?.name ?? "?"}</p>
      <p className="center tp-fp">Fighting Power: {power}</p>
      {ic && (
        <p className="star center">
          {Array.from({ length: ic.count }, (_, k) => {
            const gi = ic.tier === "star" ? 0 : ic.tier === "moon" ? 10 : 20;
            return <span key={k} style={{ color: glyphColor(gi) }}>{glyph(gi)}</span>;
          })}
        </p>
      )}
      <p>Level: {pet.level}</p>
      <p>Health: +{total.hp}</p>
      <p>Mana: +{total.mp}</p>
      <p>Attack: +{total.atk}</p>
      <p>PD: +{total.pd}</p>
      <p>MD: +{total.md}</p>
      <p className="gap">Life aptitude: {A ? cur.toLocaleString() : "—"}</p>
      <p>Mana aptitude: {A ? cur.toLocaleString() : "—"}</p>
      <p>Attack aptitude: {A ? cur.toLocaleString() : "—"}</p>
      <p>PD aptitude: {A ? cur.toLocaleString() : "—"}</p>
      <p>MD aptitude: {A ? cur.toLocaleString() : "—"}</p>
      {spells.length > 0 && (
        <>
          <p className="gap">{spells[0].name} level: {spells[0].rank}</p>
          {spells.slice(1).map((s, i) => <p key={i}>{s.name} level: {s.rank}</p>)}
        </>
      )}
      {gearList.length > 0 && (
        <>
          <p className="gap">Equipment1: {gearList[0].name}</p>
          {gearList.slice(1).map((g, i) => <p key={i}>Equipment{i + 2}: {g.name}</p>)}
        </>
      )}
    </div>
  );
}

export function CharacterGear() {
  const { classId, level, title, hasPet, pet, gear, setClassId, setLevel, setTitle, setPet, clearPet, setGear } = useBuild();
  const pets = usePets();
  const [picking, setPicking] = useState<string | null>(null);
  const [petPicking, setPetPicking] = useState(false);
  const [pending, setPending] = useState<{ slot: string; item: Item; entry?: EquipEntry } | null>(null);
  const [pendingClear, setPendingClear] = useState<string | null>(null);
  const [titleModalOpen, setTitleModalOpen] = useState(false);

  const petSpecies = pets && pet ? pets.species.find((s) => s.id === pet.speciesId) : null;
  const values = Object.fromEntries(Object.entries(gear).map(([s, e]) => [s, e.item.name]));
  const icons = Object.fromEntries(
    Object.entries(gear).map(([s, e]) => [s, iconClass(e.item.icon) ?? ""]),
  );
  const tips: Record<string, ReactNode> = {};
  for (const [slot, entry] of Object.entries(gear)) tips[slot] = <GearTooltip entry={entry} />;
  const openSlot = (slot: string) => {
    const entry = gear[slot];
    if (entry) setPending({ slot, item: entry.item, entry });
    else if (SLOT_ITEMS[slot]) setPicking(slot);
  };

  return (
    <div className="flex flex-col gap-2 min-w-0" data-testid="character-gear">
      <div className="head">
        <div className="field">
          <span>Level</span>
          <Input
            type="number"
            aria-label="Level"
            variant="secondary"
            className="w-12"
            value={level}
            onChange={(e) => setLevel(Math.max(0, Math.min(200, parseInt(e.target.value) || 0)))}
          />
        </div>
        <div className="field">
          <span>Title</span>
          <Chip
            role="button"
            tabIndex={0}
            className="w-38 max-w-[180px] title-button cursor-pointer text-foreground"
            onClick={() => setTitleModalOpen(true)}
          >
            <span className="block truncate">{title}</span>
          </Chip>
        </div>
        <div className="field">
          <span>Class</span>
          <Select
            aria-label="Class"
            variant="secondary"
            className="w-33"
            placeholder="Class"
            value={classId}
            onChange={(v: Key | Key[] | null) => setClassId(String(v) as ClassId)}
          >
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {Object.entries(CLASS_NAMES).map(([id, name]) => (
                  <ListBox.Item key={id} id={id} textValue={name}>
                    {name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>
      </div>

      <div className="gear">
        <GearColumn
          slots={LEFT_SLOTS}
          values={values}
          icons={icons}
          tips={tips}
          onSlotClick={openSlot}
          onSlotClear={(slot) => { if (gear[slot]) setPendingClear(slot); }}
        />
        <GearViewer label="3D character" minHeight={340} />
        <GearColumn
          slots={RIGHT_SLOTS}
          values={values}
          icons={icons}
          tips={tips}
          onSlotClick={openSlot}
          onSlotClear={(slot) => { if (gear[slot]) setPendingClear(slot); }}
        >
          <GearSlot
            label="Pet"
            active={hasPet}
            value={petSpecies?.name}
            icon={petIconClass(petSpecies?.icon)}
            onClick={() => setPetPicking(true)}
            tip={hasPet && pet && pets ? <PetTip pets={pets} pet={pet} /> : undefined}
          />
        </GearColumn>
      </div>

      <div className="bottom">
        {BOTTOM_SLOTS.map((s) => (
          <GearSlot key={s} label={s} />
        ))}
      </div>

      {picking && (
        <GearPicker
          appSlot={picking}
          onClose={() => setPicking(null)}
          onPick={(item) => {
            setPending({ slot: picking, item });
            setPicking(null);
          }}
        />
      )}
      {petPicking && (
        <PetPicker
          onClose={() => setPetPicking(false)}
          onPick={(speciesId) => {
            setPet(speciesId, level);
            setPetPicking(false);
          }}
          onClear={hasPet ? () => { clearPet(); setPetPicking(false); } : undefined}
        />
      )}
      {pending && (
        <GearDrawer
          key={`${pending.slot}:${pending.item.id}`}
          item={pending.item}
          appSlot={pending.slot}
          initial={pending.entry}
          onCancel={() => setPending(null)}
          onAdd={(entry) => {
            setGear(pending.slot, entry);
            setPending(null);
          }}
        />
      )}
      <Modal
        isOpen={pendingClear !== null}
        onOpenChange={(open) => {
          if (!open) setPendingClear(null);
        }}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[400px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>
                  {pendingClear ? `Remove "${gear[pendingClear].item.name}" from ${pendingClear}?` : ""}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p>Its rank, enchant and toggle choices will be lost. You can equip it again from the picker.</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onPress={() => setPendingClear(null)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onPress={() => {
                    setGear(pendingClear!, null);
                    setPendingClear(null);
                  }}
                >
                  Remove
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
      <Modal isOpen={titleModalOpen} onOpenChange={setTitleModalOpen}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[520px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>Select Title</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <ListBox
                  aria-label="Title"
                  selectionMode="single"
                  selectedKeys={new Set([title])}
                  onSelectionChange={(keys) => {
                    const [key] = Array.from(keys);
                    if (key) {
                      setTitle(String(key));
                      setTitleModalOpen(false);
                    }
                  }}
                  className="max-h-[400px] overflow-auto"
                >
                  {TITLES_OPTIONS.map((t) => (
                    <ListBox.Item key={t.name} id={t.name} textValue={t.name}>
                      <div className="flex flex-col">
                        <Label>{t.name}</Label>
                        {t.effect ? <Description>{t.effect}</Description> : null}
                      </div>
                      <ListBox.ItemIndicator />
                    </ListBox.Item>
                  ))}
                </ListBox>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}