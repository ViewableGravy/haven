import { useStore } from "@tanstack/react-store";
import type React from "react";
import { HotbarItem } from "./HotbarItem";
import { hotbarStore } from "./store";
import "./styles.css";

/***** TYPE DEFINITIONS *****/

/***** COMPONENT START *****/
export const Hotbar: React.FC = () => {
  const hotbarState = useStore(hotbarStore);

  return (
    <div className="hotbar-container">
      <div className="hotbar-inner">
        {hotbarState.items.map((item, index) => (
          <HotbarItem key={index} index={index + 1} item={item}>
            {item.node}
          </HotbarItem>
        ))}
      </div>
    </div>
  );
};