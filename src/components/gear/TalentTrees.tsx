// The talent trees: 3 columns, each a tree of 4 wide x 8 tall.
//
// A cell with a talent draws the icon box, the rest are empty spaces (nothing
// is drawn there at all).  The shape below is the game's own fury tree (from
// the talent guide screenshot, INTERFACE/TEX/GUIDE2026/TALENTS.bmp) - the
// real per tree masks come from TALENTS.ZU1 once it is decoded.
const TREE = [
  [0, 1, 1, 0],
  [0, 1, 1, 0],
  [1, 1, 1, 0],
  [1, 1, 1, 1],
  [0, 1, 1, 1],
  [0, 0, 1, 1],
  [1, 1, 1, 0],
  [0, 1, 1, 1],
];

const TITLES = ["Talent tree Name 1", "Talent tree Name 2", "Talent tree Name 3"];

export function TalentTrees() {
  return (
    <div className="talent-trees" data-testid="talent-trees">
      {TITLES.map((title) => (
        <div key={title} className="talent-tree">
          <div className="talent-title">{title}</div>
          <div className="talent-grid">
            {TREE.flatMap((row, r) =>
              row.map((on, c) => (
                <div key={`${r}-${c}`} className={on ? "talent-node" : "talent-gap"} />
              )),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
