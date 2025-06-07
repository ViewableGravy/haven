import { BaseItem } from "./base";

/***** STICK ITEM *****/
export class StickItem extends BaseItem {
  constructor() {
    super(
      "stick",
      "Stick",
      "A simple wooden stick. Useful for crafting.",
      "/assets/stick.png",
      10, // Stack size of 10 for sticks
      0.1, // Light weight
      "common"
    );
  }

  /***** IMPLEMENTATION *****/
  use(): void {
    console.log("Used a stick - implement crafting logic here");
  }

  canStackWith(otherItem: BaseItem): boolean {
    return otherItem instanceof StickItem;
  }
}
