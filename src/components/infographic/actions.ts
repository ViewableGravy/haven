import type { Store } from "@tanstack/react-store";
import invariant from "tiny-invariant";
import type { GameObject } from "../../objects/base";
import { infographicsRegistry, type RegisteredInfographics } from "../../utilities/infographics";
import { createStoreAction } from "../../utilities/store";
import type { Infographic } from "./store";

/***** ACTIONS *****/
export const setFromRegistry = createStoreAction((store: Store<Infographic>, entityName: RegisteredInfographics, entity: GameObject) => {
    // Get infographic from the registry, passing the entity instance
    const infographic = infographicsRegistry.get(entityName, entity);
    
    invariant(infographic, `Infographic for entity "${entityName}" not found in registry`);
    
    store.setState(() => ({
      active: true,
      component: infographic.component,
      item: {
        name: infographic.name,
        node: infographic.name,
        creatorFunction: infographic.createNetworked,
        previewCreatorFunction: infographic.previewCreatorFunction
      }
    }));
  }
);

export const setInactive = createStoreAction((store: Store<Infographic>) => {
  store.setState(() => ({ active: false }));
});
