import { useStore } from "@tanstack/react-store";
import React, { createElement, useEffect, type CSSProperties } from "react";
import { GhostableTrait } from "../../objects/traits/ghostable";
import { useCleanupCallback } from "../../utilities/hooks";
import { MouseFollower } from "../../utilities/mouseFollower";
import { Position } from "../../utilities/position";
import { usePixiContext } from "../pixi/context";
import { infographicStore } from "./store";

/***** TYPE DEFINITIONS *****/
type InfographicProps = React.FC<{
  bottom?: number;
  right?: number;
}>

/***** FUNCTIONS *****/
const createStyle = (opts: CSSProperties): CSSProperties => ({
  position: "fixed",
  width: 300,
  height: 500,
  border: "1px solid black",
  backgroundColor: "white",
  zIndex: 10,
  color: "black",
  borderRadius: 10,
  padding: 20,
  boxSizing: "border-box",
  ...opts,
})

/***** COMPONENT START *****/
export const Infographic: InfographicProps = ({ bottom, right }) => {
  const infographicState = useStore(infographicStore);
  const game = usePixiContext();
  const createGhostEntity = useCleanupCallback((ref) => {
    if (!infographicState.active || !infographicState.item) return;

    // Create entity using the item's preview creator function (for ghost mode)
    const previewCreator = infographicState.item.previewCreatorFunction || infographicState.item.creatorFunction;
    const followEntity = previewCreator(game, new Position(0, 0));

    // Set ghost mode using the trait
    GhostableTrait.setGhostMode(followEntity, true);

    // Create mouse follower and assign cleanup function to ref
    // Pass the actual creator function so it can create networked entities on placement
    const mouseFollower = new MouseFollower(game, followEntity, infographicState.item.creatorFunction);
    ref.current = mouseFollower.start();
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const normalizedKey = event.key.toUpperCase();

      if (normalizedKey === 'Q' && infographicState.active && infographicState.item) {
        createGhostEntity();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [infographicState, createGhostEntity]);

  if (!infographicState.active) return null;

  return (
    <div style={createStyle({ bottom, right })}>
      {createElement(infographicState.component)}
      {infographicState.item && (
        <div style={{ marginTop: 20, padding: 10, backgroundColor: "#f0f0f0", borderRadius: 5 }}>
          <p><strong>Press Q to create a ghost {infographicState.item.name}</strong></p>
        </div>
      )}
    </div>
  )
}