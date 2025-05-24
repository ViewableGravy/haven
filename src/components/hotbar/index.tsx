import type React from "react";
import { HotbarItem } from "./HotbarItem";
import "./styles.css";

/***** TYPE DEFINITIONS *****/
type HotbarItems = Array<React.ReactNode>;

/***** CONSTANTS *****/
const hotbarItems: HotbarItems = [
  "Assembler"
];

/***** COMPONENT START *****/
export const Hotbar: React.FC = () => {
  return (
    <div className="hotbar-container">
      <div className="hotbar-inner">
        {hotbarItems.map((item, index) => (
          <HotbarItem key={index} index={index + 1}>
            {item}
          </HotbarItem>
        ))}
      </div>
    </div>
  );
};