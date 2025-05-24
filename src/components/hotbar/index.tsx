import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import { Assembler } from "../../entities/assembler";
import { Game } from "../../utilities/game/game";
import { Position } from "../../utilities/position";
import { Rectangle } from "../../utilities/rectangle";
import { store } from "../../utilities/store";
import { usePixiContext } from "../pixi/context";

const hotbarItems: Array<React.ReactNode> = [
  "Assemble Dawg"
]

const isCastableToNumber = (value: string) => {
  return !isNaN(Number(value));
}

const followMouse = (game: Game, entity: Assembler) => {
  let isPlacehable = true;

  function handleMouseMove() {
    // Get the x/y of the tile 
    const tileX = Math.floor(store.game.worldPointer.x / store.consts.tileSize) * store.consts.tileSize;
    const tileY = Math.floor(store.game.worldPointer.y / store.consts.tileSize) * store.consts.tileSize;

    // get the distance cursor distance from x/y
    const pointerTileDiffX = store.game.worldPointer.x - tileX;
    const pointerTileDiffY = store.game.worldPointer.y - tileY;

    // Determine the tile quadrant (q1, q2, q3, q4)
    const isQ1 = pointerTileDiffX < (store.consts.tileSize / 2) && pointerTileDiffY < (store.consts.tileSize / 2);
    const isQ2 = pointerTileDiffX > (store.consts.tileSize / 2) && pointerTileDiffY < (store.consts.tileSize / 2);
    const isQ3 = pointerTileDiffX < (store.consts.tileSize / 2) && pointerTileDiffY > (store.consts.tileSize / 2);
    const isQ4 = pointerTileDiffX > (store.consts.tileSize / 2) && pointerTileDiffY > (store.consts.tileSize / 2);

    // Apply the appropriate offset based on the quadrant
    switch (true) {
      case isQ1: {
        entity.position.x = tileX - store.consts.tileSize;
        entity.position.y = tileY - store.consts.tileSize;
        break;
      }
      case isQ2: {
        entity.position.x = tileX;
        entity.position.y = tileY - store.consts.tileSize;
        break;
      }
      case isQ3: {
        entity.position.x = tileX - store.consts.tileSize;
        entity.position.y = tileY;
        break;
      }
      case isQ4: {
        entity.position.x = tileX;
        entity.position.y = tileY;
        break;
      }
    }

    // Set Mouse cursor to cross if overlapping with another entity
    for (const _entity of store.entities) {
      if (!Rectangle.canIntersect(_entity)) continue;

      // check collision (assuming entities are tileSize * 2 large, and they cannot partially overlap)
      if (Rectangle.intersects(_entity, entity)) {
        isPlacehable = false;
        document.body.style.cursor = "not-allowed";
        break;
      } else {
        isPlacehable = true;
        document.body.style.cursor = "default";
      }
    }
  }

  function handleMouseDown() {
    if (!isPlacehable) return;

    const chunk = game.controllers.chunkManager.getChunk(store.game.worldPointer.x, store.game.worldPointer.y);

    const position = chunk.getGlobalPosition();

    const chunkGlobalX = position.x - store.game.worldOffset.x;
    const chunkGlobalY = position.y - store.game.worldOffset.y;
    
    const chunkRelativeX = entity.container.x - chunkGlobalX;
    const chunkRelativeY = entity.container.y - chunkGlobalY;

    entity.ghostMode = false;
    entity.position.position = {
      x: chunkRelativeX,
      y: chunkRelativeY,
      type: "local"
    }

    chunk.addChild(entity.container);
    store.entities.add(entity);

    // Remove all event listeners
    cleanup();
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Escape") {
      cleanup();
    }
  }

  function cleanup() {
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("keydown", handleKeydown);
    window.removeEventListener("mousedown", handleMouseDown);
    game.world.removeChild(entity.container);
  }
    
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("mousemove", handleMouseMove);
  game.world.addChild(entity.container);

  return cleanup;
}



export const Hotbar = () => {
  return (
    <>
      <div style={{ position: "fixed", bottom: 50, width: "100vw", height: 75, border: "1px solid blue" }}>
        <div style={{ height: "100%", width: "50vw", background: "white", marginInline: "auto", display: "flex", alignItems: "center", paddingInline: 10, borderRadius: 10 }}>
          {hotbarItems.map((item, index) => (
            <HotbarItem key={index} index={index + 1}>
              {item}
            </HotbarItem>
          ))}
        </div>
      </div>
    </>
  );
}

const useCleanupRef = () => {
  const ref = useRef<(() => void) | null>(null);

  const cleanup = useCallback(() => {
    ref.current?.();
    ref.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  return { cleanup, ref };
}

/**
 * Creates a callback function
 */
const useCleanupCallback = <T extends any = void>(callback: (ref: React.RefObject<(() => void) | null>, opts: T) => void) => {
  const { cleanup, ref } = useCleanupRef();

  return useCallback((opts: T) => {
     // Attempt to cleanup previous runs if there are any
     cleanup();

     // Invoke the callback with the ref
     callback(ref, opts);
  }, [cleanup]);
}



function HotbarItem({ index, children }: { index: number, children: React.ReactNode }) { 
  /***** HOOKS *****/
  const game = usePixiContext();

  /***** FUNCTIONS *****/
  const handleClick = useCleanupCallback((ref) => {
    // Create entity in ghost mode
    const followEntity = new Assembler(new Position(0, 0));
    followEntity.ghostMode = true;
  
    // Add entity to stage and assign cleanup function to ref
    ref.current = followMouse(game, followEntity)
  })
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isCastableToNumber(event.key)) {
        if (Number(event.key) === index) {
          handleClick();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    }
  }, [index, handleClick]);

  /***** RENDER *****/
  return (
    <div style={{ width: 50, height: 50, border: "1px solid cyan", color: "black", cursor: "pointer" }} onClick={() => handleClick()} >
      {children}
    </div>
  )
}