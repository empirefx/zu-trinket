import { useEffect, useRef, useState } from "react";
import { Button, Modal, Tooltip } from "@heroui/react";
import { useBuild } from "./BuildContext";
import { CLASS_NAMES } from "./gearSlots";
import {
  autosaveDecision,
  type BuildSnapshot,
  deleteBuild,
  getSelectedId,
  listBuilds,
  MAX_BUILDS,
  saveBuild,
  type SavedBuild,
  setSelectedId as persistSelectedId,
} from "../../lib/builds";

export function BuildsBar() {
  const { snapshot, applyBuild, classId, level, title, gear, talentRanks, pet } = useBuild();
  const [builds, setBuilds] = useState<SavedBuild[]>(() => listBuilds());
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  useEffect(() => {
    document
      .querySelector('.build[aria-current="true"]')
      ?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [selectedId]);

  const atCap = builds.length >= MAX_BUILDS;

  const handleNew = () => {
    if (atCap) return;
    const saved = saveBuild("Build " + (builds.length + 1), snapshot());
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

  const newButton = (
    <Button
      type="button"
      variant="ghost"
      className="builds__new"
      isDisabled={atCap}
      onPress={handleNew}
    >
      + New build
    </Button>
  );

  return (
    <section className="builds" aria-labelledby="builds-title">
      <header className="builds__header">
        <h2 id="builds-title">Builds</h2>
        <span className="builds__count">
          {builds.length} / {MAX_BUILDS}
        </span>
        {status && (
          <span className="builds__status" role="status">
            {status}
          </span>
        )}
      </header>

      {builds.length === 0 ? (
        <p className="builds__empty">No builds yet. Create your first one.</p>
      ) : (
        <ul className="builds__list">
          {builds.map((b) => {
            const cls =
              b.state?.classId ??
              (b as { classId?: string }).classId ??
              "swordsman";
            const lvl =
              b.state?.level ?? (b as { level?: number }).level ?? 0;
            return (
              <li
                key={b.id}
                className="build"
                aria-current={b.id === selectedId ? "true" : undefined}
              >
                <button
                  type="button"
                  className="build__select"
                  onClick={() => {
                    apply(b.state);
                    select(b.id);
                    setStatus(null);
                  }}
                >
                  <span className="build__name" title={b.name}>
                    {b.name}
                  </span>
                  <span className="build__meta">
                    {CLASS_NAMES[cls] ?? cls} · Lv {lvl}
                  </span>
                </button>
                <button
                  type="button"
                  className="build__delete"
                  aria-label={`Delete ${b.name}`}
                  onClick={() => setPendingDelete(b)}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {atCap ? (
        <Tooltip>
          <Tooltip.Trigger
            className="builds__new-wrap"
            title="Build limit reached (10)"
          >
            {newButton}
          </Tooltip.Trigger>
          <Tooltip.Content>Build limit reached (10)</Tooltip.Content>
        </Tooltip>
      ) : (
        newButton
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
    </section>
  );
}
