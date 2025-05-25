import { Store } from "@tanstack/react-store";
import type React from "react";
import type { HotbarItem } from "../hotbar/store";

type Infographic = {
  active: false;
} | {
  active: true;
  component: React.FC;
  item?: HotbarItem;
}

export const infographicStore = new Store<Infographic>({
  active: false
})