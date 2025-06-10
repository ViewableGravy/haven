import { BaseItem } from "./base";

/***** DUCK ITEM *****/
export class DuckItem extends BaseItem {
  constructor() {
    super(
      "duck",
      "Duck",
      "A friendly duck companion. Takes up a bit more space but worth it!",
      "/assets/duck.svg",
      3, // Stack size of 3 for ducks
      2, // Heavier than twigs and sticks
      "uncommon",
      { width: 2, height: 1 } // 2x1 size
    );
  }

  /***** IMPLEMENTATION *****/
  use(): void {
    console.log("Used a duck - quack quack!");
  }

  canStackWith(otherItem: BaseItem): boolean {
    return otherItem instanceof DuckItem;
  }
}
