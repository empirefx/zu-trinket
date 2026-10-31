import { useState, type ReactNode } from "react";
import { Box } from "./Box";
import { GearColumn } from "./GearColumn";
import { GearViewer } from "./GearViewer";
import { GearSlot } from "./GearSlot";
import { GearTooltip } from "./GearTooltip";
import { GearPicker } from "./GearPicker";
import { GearDrawer } from "./GearDrawer";
import { PetPicker } from "./PetPicker";
import { CLASS_NAMES, SLOT_ITEMS } from "./gearSlots";
import { iconClass, petIconClass } from "../../lib/icons";
import { usePets } from "../../hooks/usePets";
import { useBuild } from "./BuildContext";
import { TITLES } from "./titles";
import type { EquipEntry, Item } from "../../lib/items";
import { Button, Description, Label, ListBox, Modal } from "@heroui/react";

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
    <Box title="Character Gear" maxWidth="360px" className="gears">
      <div className="head">
        <label>
          Level
          <input
            type="number"
            min="0"
            max="200"
            value={level}
            onChange={(e) => setLevel(Math.max(0, Math.min(200, parseInt(e.target.value) || 0)))}
          />
        </label>
        <label>
          Title
          <button
            type="button"
            className="w-[140px] text-left px-2 py-1 border rounded cursor-pointer"
            onClick={() => setTitleModalOpen(true)}
            title={TITLES_OPTIONS.find((t) => t.name === title)?.effect || ""}
          >
            {title}
          </button>
        </label>
        <br />
        <label>
          Class
          <select value={classId} onChange={(e) => setClassId(e.target.value as any)}>
            {Object.entries(CLASS_NAMES).map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </label>
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
                <p>Its rank, enhance and toggle choices will be lost. You can equip it again from the picker.</p>
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
    </Box>
  );
}