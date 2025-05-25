import type React from "react";
import { useCleanupCallback } from "../../utilities/hooks";
import { MouseFollower } from "../../utilities/mouseFollower/index";
import { Position } from "../../utilities/position";
import { usePixiContext } from "../pixi/context";
import { useKeyboardShortcut } from "./hooks";
import type { HotbarItem as HotbarItemType } from "./store";
import "./styles.css";

/***** TYPE DEFINITIONS *****/
interface HotbarItemProps {
  index: number;
  item: HotbarItemType;
  children: React.ReactNode;
}

/***** COMPONENT START *****/
export const HotbarItem: React.FC<HotbarItemProps> = ({ index, item, children }) => {
  /***** HOOKS *****/
  const game = usePixiContext();

  /***** FUNCTIONS *****/
  const handleClick = useCleanupCallback((ref) => {
    // Create entity using the item's creator function
    const followEntity = item.creatorFunction(game, new Position(0, 0));

    // Set ghost mode directly on the entity
    followEntity.ghostMode = true;

    // Create mouse follower and assign cleanup function to ref
    const mouseFollower = new MouseFollower(game, followEntity);
    ref.current = mouseFollower.start();
  });

  useKeyboardShortcut(index, handleClick);

  /***** RENDER *****/
  return (
    <div className="hotbar-item" onClick={() => handleClick()}>
      {children}
    </div>
  );
};