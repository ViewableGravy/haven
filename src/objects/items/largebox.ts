import { BaseItem } from "./base";

/***** LARGE BOX ITEM *****/
export class LargeBoxItem extends BaseItem {
  constructor() {
    super(
      "largebox",
      "Large Box",
      "A big wooden box that takes up significant space but can store many things.",
      "/assets/largebox.svg",
      1, // Stack size of 1 for large boxes
      5, // Heavy weight
      "rare",
      { width: 3, height: 2 } // 3x2 size
    );
  }

  /***** IMPLEMENTATION *****/
  use(): void {
    console.log("Used a large box - implement storage logic here");
  }

  canStackWith(otherItem: BaseItem): boolean {
    return otherItem instanceof LargeBoxItem;
  }
}
