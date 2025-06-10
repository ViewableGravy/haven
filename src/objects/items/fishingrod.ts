import { BaseItem } from "./base";

/***** FISHING ROD ITEM *****/
export class FishingRodItem extends BaseItem {
  constructor() {
    super(
      "fishingrod",
      "Fishing Rod",
      "A long fishing rod that extends vertically in your inventory.",
      "/assets/fishingrod.svg",
      1, // Stack size of 1 for fishing rods
      1, // Medium weight
      "uncommon",
      { width: 1, height: 3 } // 1x3 size
    );
  }

  /***** IMPLEMENTATION *****/
  use(): void {
    console.log("Used a fishing rod - cast your line!");
  }

  canStackWith(otherItem: BaseItem): boolean {
    return otherItem instanceof FishingRodItem;
  }
}
