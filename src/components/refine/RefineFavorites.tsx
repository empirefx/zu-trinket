// The favorites card: every saved session's gear (a HeroUI ListBox row per
// save); loading re-equips the saved gear if the build no longer wears it.
import { useState } from "react";
import { Card, Chip, ListBox } from "@heroui/react";
import { pretty } from "../gear/gearSlots";
import { iconClass } from "../../lib/icons";
import { listFavs, removeFav, type RefineFav } from "../../lib/refineFavs";

export function RefineFavorites({
  onLoad,
}: {
  onLoad: (slot: string, fav: RefineFav) => void;
}) {
  const [favs, setFavs] = useState<RefineFav[]>(() => listFavs());

  const remove = (id: string) => setFavs(removeFav(id));

  return (
    <Card className="r-card r-fav" aria-label="Favorites" data-testid="refine-favorites">
      <Card.Header>
        <Card.Title>Favorites</Card.Title>
      </Card.Header>
      <Card.Content>
        {favs.length === 0 ? (
          <p className="r-fav-empty">Add Gear session as favorites</p>
        ) : (
          <ListBox aria-label="Favorites" className="r-favs" data-testid="refine-favorites-list">
            {favs.map((f) => (
              <ListBox.Item
                key={f.id}
                id={f.id}
                textValue={f.name}
                className="r-fav-row"
                onAction={() => onLoad(f.slot, f)}
              >
                <span className={`r-gicon zs ${iconClass(f.icon) ?? ""}`}>{iconClass(f.icon) ? "" : "◆"}</span>
                <span className="r-fav-text">
                  <strong>{f.name}</strong>
                  <span className="r-muted">{pretty(f.slot)}</span>
                  <span className="r-fav-chips">
                    <Chip size="sm" variant="soft" color="accent">Rank {f.rank}</Chip>
                    <Chip size="sm" variant="soft">Enchant +{f.enh}</Chip>
                  </span>
                  {f.attempts.length > 0 && (
                    <span className="r-muted">
                      {f.attempts.length} {f.attempts.length === 1 ? "attempt" : "attempts"}
                    </span>
                  )}
                </span>
                <ListBox.ItemIndicator />
                <button
                  type="button"
                  className="r-fav-x"
                  aria-label={`Remove ${f.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(f.id);
                  }}
                >
                  ✕
                </button>
              </ListBox.Item>
            ))}
          </ListBox>
        )}
      </Card.Content>
    </Card>
  );
}
