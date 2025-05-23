import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import { TestEntity } from "../../entities/test";
import { Game } from "../../utilities/game/game";
import { store } from "../../utilities/store";
import { usePixiContext } from "../pixi/context";

const hotbarItems: Array<React.ReactNode> = [
  "Assemble Dawg"
]

const isCastableToNumber = (value: string) => {
  return !isNaN(Number(value));
}

const followMouse = (game: Game, entity: TestEntity) => {
  let isPlacehable = true;

  function handleMouseMove() {
    // Get the x/y of the tile 
    const tileX = Math.floor(game.worldPointerX / store.consts.tileSize) * store.consts.tileSize;
    const tileY = Math.floor(game.worldPointerY / store.consts.tileSize) * store.consts.tileSize;

    // get the distance cursor distance from x/y
    const pointerTileDiffX = game.worldPointerX - tileX;
    const pointerTileDiffY = game.worldPointerY - tileY;

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
      // check collision (assuming entities are tileSize * 2 large, and they cannot partially overlap)
      if (entity.position.x < _entity.position.x + (store.consts.tileSize * 2) &&
          entity.position.x + (store.consts.tileSize * 2) > _entity.position.x &&
          entity.position.y < _entity.position.y + (store.consts.tileSize * 2) &&
          entity.position.y + (store.consts.tileSize * 2) > _entity.position.y) {
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

    const chunk = game.controllers.chunkManager.getChunk(game.worldPointerX, game.worldPointerY);

    const position = chunk.getGlobalPosition()

    const chunkGlobalX = position.x - game.app.stage.x;
    const chunkGlobalY = position.y - game.app.stage.y;
    
    const chunkRelativeX = entity.containerChild.x - chunkGlobalX;
    const chunkRelativeY = entity.containerChild.y - chunkGlobalY;

    entity.ghostMode = false;
    entity.position.position = {
      x: chunkRelativeX,
      y: chunkRelativeY
    }

    chunk.addChild(entity.containerChild);
    store.entities.push(entity);

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
    game.app.stage.removeChild(entity.containerChild);
  }
    
  window.addEventListener("keydown", handleKeydown);
  window.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("mousemove", handleMouseMove);
  game.app.stage.addChild(entity.containerChild);

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
    const followEntity = new TestEntity({ x: 0, y: 0 });
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
    <div style={{ width: 50, height: 50, border: "1px solid cyan", color: "black", cursor: "pointer" }} onClick={handleClick} >
      {children}
    </div>
  )
}