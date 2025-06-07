import type React from "react";
import { useStore } from "@tanstack/react-store";
import { GhostableTrait } from "../../entities/traits/ghostable";
import { useCleanupCallback } from "../../utilities/hooks";
import { MouseFollower } from "../../utilities/mouseFollower/index";
import { Position } from "../../utilities/position";
import { usePixiContext } from "../pixi/context";
import { useKeyboardShortcut } from "./hooks";
import type { HotbarItem as HotbarItemType } from "./store";
import { selectionStore, clearSelection } from "./store";
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
  const selectionState = useStore(selectionStore);

  /***** FUNCTIONS *****/
  const handleClick = useCleanupCallback((ref) => {
    // Check if this item is already selected (toggle functionality)
    if (selectionState.selectedIndex === index) {
      // Same item clicked again - deselect it
      clearSelection();
      ref.current = null;
      return;
    }

    // Clean up any existing selection
    if (selectionState.cleanup) {
      selectionState.cleanup();
    }

    // Create entity using the item's creator function
    const followEntity = item.creatorFunction(game, new Position(0, 0));

    // Set ghost mode using the trait
    GhostableTrait.setGhostMode(followEntity, true);

    // Create mouse follower and assign cleanup function to ref
    const mouseFollower = new MouseFollower(game, followEntity);
    const cleanup = mouseFollower.start();
    ref.current = cleanup;

    // Update selection store
    selectionStore.setState(() => ({
      selectedIndex: index,
      cleanup: cleanup
    }));
  });

  useKeyboardShortcut(index, handleClick);

  /***** RENDER *****/
  return (
    <div className="hotbar-item" onClick={() => handleClick()}>
      {children}
    </div>
  );
};