import type React from "react";
import { createStandardAssembler } from "../../entities/assembler/factory";
import { Ghostable } from "../../entities/traits/ghostable";
import { useCleanupCallback } from "../../utilities/hooks";
import { MouseFollower } from "../../utilities/mouseFollower/index";
import { Position } from "../../utilities/position";
import { usePixiContext } from "../pixi/context";
import { useKeyboardShortcut } from "./hooks";
import "./styles.css";

/***** TYPE DEFINITIONS *****/
interface HotbarItemProps {
  index: number;
  children: React.ReactNode;
}

/***** COMPONENT START *****/
export const HotbarItem: React.FC<HotbarItemProps> = ({ index, children }) => {
  /***** HOOKS *****/
  const game = usePixiContext();

  /***** FUNCTIONS *****/
  const handleClick = useCleanupCallback((ref) => {
    // Create entity using the new streamlined factory pattern
    const followEntity = createStandardAssembler(game, new Position(0, 0));
    
    // Set ghost mode using the trait system
    if (Ghostable.is(followEntity)) {
      followEntity.ghostMode = true;
    }
  
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