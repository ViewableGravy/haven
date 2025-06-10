import { createItemConfig } from "../config";

export const duckConfig = createItemConfig({
  id: "duck",
  name: "Duck",
  description: "A friendly duck companion. Takes up a bit more space but worth it!",
  iconPath: "/assets/duck.svg",
  maxStackSize: 3,
  weight: 2,
  rarity: "uncommon",
  size: { width: 2, height: 1 }
});
