import { useStore } from "@tanstack/react-store";
import type React from "react";
import { GhostableTrait } from "../../objects/traits/ghostable";
import { useCleanupCallback } from "../../utilities/hooks";
import { MouseFollower } from "../../utilities/mouseFollower/index";
import { Position } from "../../utilities/position";
import { usePixiContext } from "../pixi/context";
import { useKeyboardShortcut } from "./hooks";
import type { HotbarItem as HotbarItemType } from "./store";
import { clearSelection, selectionStore } from "./store";
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
    }    // Create entity using the item's preview creator function (for ghost mode)
    const previewCreator = item.previewCreatorFunction || item.creatorFunction;
    const followEntity = previewCreator(game, new Position(0, 0));

    // Set ghost mode using the trait
    GhostableTrait.setGhostMode(followEntity, true);    // Create mouse follower and assign cleanup function to ref
    // Pass the actual creator function so it can create networked entities on placement
    const mouseFollower = new MouseFollower(game, followEntity, item.creatorFunction);
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