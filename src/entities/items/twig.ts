import { BaseItem } from "./base";

/***** TWIG ITEM *****/
export class TwigItem extends BaseItem {
  constructor() {
    super(
      "twig",
      "Twig",
      "A small, flexible branch. Perfect for kindling or simple crafts.",
      "/assets/twig.svg",
      5, // Stack size of 5 for twigs
      0.05, // Very light weight
      "common"
    );
  }

  /***** IMPLEMENTATION *****/
  use(): void {
    console.log("Used a twig - implement crafting logic here");
  }

  canStackWith(otherItem: BaseItem): boolean {
    return otherItem instanceof TwigItem;
  }
}
