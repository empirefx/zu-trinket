import { useEffect, useState } from "react";
import { Button, Modal, Tooltip } from "@heroui/react";
import { useBuild } from "./BuildContext";
import { CLASS_NAMES } from "./gearSlots";
import {
  deleteBuild,
  listBuilds,
  MAX_BUILDS,
  saveBuild,
  type SavedBuild,
} from "../../lib/builds";

export function BuildsBar() {
  const { snapshot, applyBuild } = useBuild();
  const [builds, setBuilds] = useState<SavedBuild[]>(() => listBuilds());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SavedBuild | null>(null);

  useEffect(() => {
    document
      .querySelector('.build[aria-current="true"]')
      ?.scrollIntoView({ inline: "nearest", block: "nearest" });
  }, [selectedId]);

  const atCap = builds.length >= MAX_BUILDS;

  const handleNew = () => {
    const saved = saveBuild("Build " + (builds.length + 1), snapshot());
    if (saved) {
      setBuilds(listBuilds());
      setSelectedId(saved.id);
    }
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const idx = builds.findIndex((b) => b.id === pendingDelete.id);
    deleteBuild(pendingDelete.id);
    setBuilds(listBuilds());
    if (pendingDelete.id === selectedId) {
      const prev = builds[idx - 1] ?? null;
      setSelectedId(prev ? prev.id : null);
      if (prev) applyBuild(prev.state);
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
                    applyBuild(b.state);
                    setSelectedId(b.id);
                  }}
                >
                  <Tooltip>
                    <Tooltip.Trigger className="build__name" title={b.name}>
                      <span className="build__name">{b.name}</span>
                    </Tooltip.Trigger>
                    <Tooltip.Content>{b.name}</Tooltip.Content>
                  </Tooltip>
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
