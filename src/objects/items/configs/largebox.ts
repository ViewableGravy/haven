import { createItemConfig } from "../config";

export const largeBoxConfig = createItemConfig({
  id: "largebox",
  name: "Large Box",
  description: "A big wooden box that takes up significant space but can store many things.",
  iconPath: "/assets/largebox.svg",
  maxStackSize: 1,
  weight: 5,
  rarity: "rare",
  size: { width: 3, height: 2 }
});
