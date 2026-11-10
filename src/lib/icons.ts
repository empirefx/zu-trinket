import "../assets/sprites/gear-sprites.css";
import "../assets/sprites/pet-sprites.css";
import { SPRITE_CLASS } from "../components/gear/generated/gearSprites";
import { SPRITE_CLASS as PET_SPRITES } from "../components/gear/generated/petSprites";

// The gear icons are packed into one sheet per class by
// scripts/gen_gear_sprites.py; the css classes below draw the item's icon
// (the item record's icon name, ITEMS +588) out of that sheet.
export function iconClass(icon: string | undefined): string | undefined {
  if (!icon) return undefined;
  return SPRITE_CLASS[icon.toUpperCase()];
}

// The same for pet icons (one shared sheet, scripts/gen_pet_sprites.py;
// pets.json's icon names are lowercase basenames).  undefined = the record's
// icon is the literal NULL / the extraction has no bmp -> name-only row.
export function petIconClass(icon: string | null | undefined): string | undefined {
  if (!icon) return undefined;
  return PET_SPRITES[icon.toUpperCase()];
}
