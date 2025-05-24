import type React from "react";
import { Assembler } from "../../entities/assembler";
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
    // Create entity in ghost mode using the new system
    const followEntity = new Assembler(game, new Position(0, 0));
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