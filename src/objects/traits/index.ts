import { NetworkTrait } from "objects/traits/network";
import invariant from "tiny-invariant";
import type { TraitNames, Traits } from "./types";


export class Traitable {
  protected traits: Partial<Traits> = {};

  /**
   * Function to get a specific trait by name. Before calling this, using `Trait.is` to assert
   * that the trait exists on the entity.
   */
  public getTrait = <T extends keyof Traits>(traitName: T): Traits[T] => {
    const trait = this.traits[traitName];
    invariant(trait, `Trait "${traitName}" not found on ${this.constructor.name}`);
    return trait as Traits[T];
  }

  /**
   * Function to add a trait to the entity. This will throw an error if the trait already exists.
   */
  public addTrait = <T extends TraitNames>(traitName: T, traitInstance: Traits[T]): void => {
    invariant(!this.traits[traitName], `Trait "${traitName}" already exists on ${this.constructor.name}`);
    this.traits[traitName] = traitInstance;
  }

  protected cleanupTraits = (notifyServer: boolean = true): void => {
    for (const trait of Object.values(this.traits)) {
      if ("destroy" in trait && typeof trait?.destroy === 'function') {
        try {
          switch (true) {
            case trait instanceof NetworkTrait:
              trait.destroy(notifyServer);
              break;
            default:
              trait.destroy()
              break;
          }
        } catch (error) {
          console.error(`Error destroying trait on ${this.constructor.name}:`, error);
        }
      }
    }
    
    // Clear trait references to help with garbage collection
    this.traits = {};
  }
}