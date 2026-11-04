// The gear page header (skeleton: gear-heroui-skeleton.html): build name,
// the section tabs (children), Delete Build + the Builds dropdown.
// Autosave / delete / selection logic is the old BuildsBar's.
import { useEffect, useRef, useState, type Key, type ReactNode } from "react";
import {
  Alert,
  Button,
  Chip,
  Description,
  Dropdown,
  Header,
  Input,
  Label,
  Modal,
  Separator,
} from "@heroui/react";
import { useBuild } from "./BuildContext";
import { CLASS_NAMES } from "./gearSlots";
import {
  autosaveDecision,
  type BuildSnapshot,
  deleteBuild,
  emptyBuild,
  getSelectedId,
  listBuilds,
  MAX_BUILDS,
  saveBuild,
  type SavedBuild,
  setSelectedId as persistSelectedId,
} from "../../lib/builds";

export function BuildsHeader({ children }: { children?: ReactNode }) {
  const { snapshot, applyBuild, classId, level, title, gear, talentRanks, pet, selectedId, setSelectedId } = useBuild();
  const [builds, setBuilds] = useState<SavedBuild[]>(() => listBuilds());

  const [nameInput, setNameInput] = useState("");
  const [pendingDelete, setPendingDelete] = useState<SavedBuild | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const lastSnapRef = useRef<string | null>(null);

  const apply = (s: BuildSnapshot) =>
    applyBuild(
      s.pet ? { ...s, pet: { ...s.pet, gear: s.pet.gear ?? {}, spells: s.pet.spells ?? {} } } : s,
    );

  const select = (id: string | null) => {
    setSelectedId(id);
    persistSelectedId(id);
  };

  useEffect(() => {
    const id = getSelectedId();
    if (id === null) return;
    const b = listBuilds().find((x) => x.id === id);
    if (b) { apply(b.state); setSelectedId(b.id); }  // already stored — do not re-persist
    else persistSelectedId(null);
  }, []);

  useEffect(() => {
    const snap = JSON.stringify(snapshot());
    const action = autosaveDecision(lastSnapRef.current, snap, selectedId);
    lastSnapRef.current = snap;
    if (action === "skip") return;
    if (action === "overwrite") {
      const cur = listBuilds().find((b) => b.id === selectedId);
      if (cur && saveBuild(cur.name, snapshot(), cur.id)) {
        setBuilds(listBuilds());
        setStatus(null);
      } else if (cur) setStatus("Could not save — storage unavailable");
      return;
    }
    // create: no selection + state changed (first-time visitor, or next change after delete-all)
    if (listBuilds().length >= MAX_BUILDS) return;
    const saved = saveBuild("Build " + (listBuilds().length + 1), snapshot());
    if (saved) { setBuilds(listBuilds()); select(saved.id); setStatus(null); }
    else setStatus("Could not save — storage unavailable");
  }, [classId, level, title, gear, talentRanks, pet, selectedId]);

  // the name input follows the selected build; typing renames it in place
  useEffect(() => {
    setNameInput(listBuilds().find((b) => b.id === selectedId)?.name ?? "");
  }, [selectedId]);

  const rename = (name: string) => {
    setNameInput(name);
    const cur = listBuilds().find((b) => b.id === selectedId);
    if (!cur) return;
    if (saveBuild(name, snapshot(), cur.id)) {
      setBuilds(listBuilds());
      setStatus(null);
    } else setStatus("Could not save — storage unavailable");
  };

  const atCap = builds.length >= MAX_BUILDS;

  // "+ Create build" always starts from an empty build
  const handleNew = () => {
    if (atCap) return;
    const saved = saveBuild("Build " + (builds.length + 1), emptyBuild());
    if (saved) {
      apply(saved.state);
      setBuilds(listBuilds());
      select(saved.id);
      setStatus(null);
    } else {
      setStatus("Could not save — storage unavailable");
    }
  };

  // duplicate the selected build under "<name> (copy)"
  const handleClone = () => {
    const cur = builds.find((b) => b.id === selectedId);
    if (!cur || atCap) return;
    const saved = saveBuild(cur.name + " (copy)", cur.state);
    if (saved) {
      setBuilds(listBuilds());
      select(saved.id);
      setStatus(null);
    } else {
      setStatus("Could not save — storage unavailable");
    }
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const idx = builds.findIndex((b) => b.id === pendingDelete.id);
    if (!deleteBuild(pendingDelete.id)) {
      setStatus("Could not delete — storage unavailable");
      setPendingDelete(null);
      return;
    }
    setStatus(null);
    setBuilds(listBuilds());
    if (pendingDelete.id === selectedId) {
      const prev = builds[idx - 1] ?? null;
      select(prev ? prev.id : null);
      if (prev) apply(prev.state);
    }
    setPendingDelete(null);
  };

  const menuAction = (key: Key) => {
    const k = String(key);
    if (k === "create") { handleNew(); return; }
    const b = builds.find((x) => x.id === k);
    if (b) { apply(b.state); select(b.id); setStatus(null); }
  };

  return (
    <>
      <header className="grid grid-cols-2 md:grid-cols-[1fr_auto_1fr] items-center gap-3">
        {/* Left: the editable build name; status below when storage acts up */}
        <div className="col-span-2 md:col-span-1 order-1 min-w-0 flex flex-col gap-1">
          <Input
            aria-label="Build name"
            variant="secondary"
            value={nameInput}
            placeholder="Build name"
            disabled={selectedId === null}
            onChange={(e) => rename(e.target.value)}
            className="w-full min-w-0 h-9 text-sm rounded-full truncate"
          />
          {status && (
            <span role="status" className="text-xs text-danger">{status}</span>
          )}
        </div>

        {/* Middle: the section tabs — inert until a build is selected */}
        <div className="col-span-2 md:col-span-1 order-3 md:order-2 flex flex-col items-center gap-1">
          <div
            className={`w-full ${selectedId === null ? "opacity-40" : ""}`}
            inert={selectedId === null || undefined}
          >
            {children}
          </div>
        </div>

        {/* Right: delete the selected build + the builds dropdown */}
        <div className="col-span-2 md:col-span-1 order-2 md:order-3 flex items-center justify-end gap-3">
          <button
            type="button"
            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            disabled={selectedId === null || atCap}
            onClick={handleClone}
          >
            <Chip size="md" color="warning" variant="soft" className="text-sm">
              Clone
            </Chip>
          </button>
          <button
            type="button"
            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
            disabled={selectedId === null}
            onClick={() => {
              const selected = builds.find((b) => b.id === selectedId);
              if (selected) setPendingDelete(selected);
            }}
          >
            <Chip size="md" color="danger" variant="soft" className="text-sm">
              Delete Build
            </Chip>
          </button>

          <Dropdown>
            <Button variant="outline" size="md" className="rounded-full h-9 px-5 text-sm border-2">
              Builds
            </Button>
            <Dropdown.Popover className="min-w-[260px] max-w-[320px]">
              <Dropdown.Menu onAction={menuAction} disabledKeys={atCap ? ["create"] : []}>
                <Dropdown.Section>
                  <Header>
                    Builds ({builds.length} / {MAX_BUILDS})
                  </Header>
                  {builds.map((b) => {
                    const cls =
                      b.state?.classId ??
                      (b as { classId?: string }).classId ??
                      "swordsman";
                    const lvl = b.state?.level ?? (b as { level?: number }).level ?? 0;
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

      {/* Fixed directions notice while no build is loaded */}
      {selectedId === null && (
        <div className="fixed bottom-10 right-10 z-50 w-[420px]">
          <Alert status="warning">
            <Alert.Indicator />
            <Alert.Content>
              <Alert.Title>Create or select a build to start</Alert.Title>
              <Alert.Description>
                Use the Builds menu to create, clone or pick one.
              </Alert.Description>
            </Alert.Content>
          </Alert>
        </div>
      )}

      <Modal
        isOpen={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog className="sm:max-w-[400px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Heading>
                  {pendingDelete ? `Delete "${pendingDelete.name}"?` : ""}
                </Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p>This action cannot be undone.</p>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onPress={() => setPendingDelete(null)}>
                  Cancel
                </Button>
                <Button variant="danger" onPress={confirmDelete}>
                  Delete
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}
