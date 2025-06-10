import { createItemConfig } from "../config";

export const fishingRodConfig = createItemConfig({
  id: "fishingrod",
  name: "Fishing Rod",
  description: "A long fishing rod that extends vertically in your inventory.",
  iconPath: "/assets/fishingrod.svg",
  maxStackSize: 1,
  weight: 1.5,
  rarity: "uncommon",
  size: { width: 1, height: 3 }
});
