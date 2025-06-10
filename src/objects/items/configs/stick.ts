import { createItemConfig } from "../config";

export const stickConfig = createItemConfig({
  id: "stick",
  name: "Stick",
  description: "A simple wooden stick. Useful for crafting.",
  iconPath: "/assets/stick.png",
  maxStackSize: 10,
  weight: 0.1,
  rarity: "common"
});
