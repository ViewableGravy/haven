

import { Store } from "@tanstack/react-store";
import type React from "react";

type Infographic = {
  active: false;
} | {
  active: true;
  component: React.FC;
}

export const infographicStore = new Store<Infographic>({
  active: false
})