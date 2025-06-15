import type React from "react";
import { createStore, createStoreState } from "../../utilities/store";
import type { HotbarItem } from "../hotbar/store";
import { setFromRegistry, setInactive } from "./actions";

/***** TYPE DEFINITIONS *****/
export type Infographic = {
  active: false;
} | {
  active: true;
  component: React.FC;
  item?: HotbarItem;
}

/***** STORE CREATION *****/
export const infographicStore = createStore({
  state: createStoreState<Infographic>({
    active: false
  }),
  actions: {
    setFromRegistry,
    setInactive
  }
});