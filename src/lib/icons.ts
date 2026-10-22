import "../assets/sprites/gear-sprites.css";
import { SPRITE_CLASS } from "../components/gear/gearSprites";

// The gear icons are packed into one sheet per class by
// scripts/gen_gear_sprites.py; the css classes below draw the item's icon
// (the item record's icon name, ITEMS +588) out of that sheet.
export function iconClass(icon: string | undefined): string | undefined {
  if (!icon) return undefined;
  return SPRITE_CLASS[icon.toUpperCase()];
}
