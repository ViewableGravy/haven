import type React from "react";
import { useCallback, useEffect, useRef } from "react";
import { Assembler } from "../../entities/assembler";
import type { BaseEntity } from "../../entities/base";
import type { HasContainer, HasGhostable } from "../../entities/interfaces";
import type { Game } from "../../utilities/game/game";
import { Position } from "../../utilities/position";
import { Rectangle } from "../../utilities/rectangle";
import type { Transform } from "../../utilities/transform";
import { usePixiContext } from "../pixi/context";

const hotbarItems: Array<React.ReactNode> = [
  "Assemble Dawg"
]

const isCastableToNumber = (value: string) => {
  return !isNaN(Number(value));
}

const followMouse = (game: Game, entity: BaseEntity & HasGhostable & HasContainer & { transform: Transform }) => {
  let isPlacehable = true;

  function handleMouseMove() {
    // Get the x/y of the tile 
    const tileX = Math.floor(game.state.worldPointer.x / game.consts.tileSize) * game.consts.tileSize;
    const tileY = Math.floor(game.state.worldPointer.y / game.consts.tileSize) * game.consts.tileSize;

    // get the distance cursor distance from x/y
    const pointerTileDiffX = game.state.worldPointer.x - tileX;
    const pointerTileDiffY = game.state.worldPointer.y - tileY;

    // Determine the tile quadrant (q1, q2, q3, q4)
    const isQ1 = pointerTileDiffX < (game.consts.tileSize / 2) && pointerTileDiffY < (game.consts.tileSize / 2);
    const isQ2 = pointerTileDiffX > (game.consts.tileSize / 2) && pointerTileDiffY < (game.consts.tileSize / 2);
    const isQ3 = pointerTileDiffX < (game.consts.tileSize / 2) && pointerTileDiffY > (game.consts.tileSize / 2);
    const isQ4 = pointerTileDiffX > (game.consts.tileSize / 2) && pointerTileDiffY > (game.consts.tileSize / 2);

    // Apply the appropriate offset based on the quadrant
    switch (true) {
      case isQ1: {
        entity.transform.position.x = tileX - entity.transform.size.width / 2;
        entity.transform.position.y = tileY - entity.transform.size.width / 2;
        break;
      }
      case isQ2: {
        entity.transform.position.x = tileX;
        entity.transform.position.y = tileY - entity.transform.size.width / 2;
        break;
      }
      case isQ3: {
        entity.transform.position.x = tileX - entity.transform.size.width / 2;
        entity.transform.position.y = tileY;
        break;
      }
      case isQ4: {
        entity.transform.position.x = tileX;
        entity.transform.position.y = tileY;
        break;
      }
    }

    // Set Mouse cursor to cross if overlapping with another entity
    for (const _entity of game.getEntities()) {
      // Check if entity can intersect using Rectangle utility
      if (!Rectangle.canIntersect(_entity)) continue;

      // Check collision using the new transform system if available
      if ('transform' in _entity && _entity.transform && typeof _entity.transform === 'object' && 'intersects' in _entity.transform) {
        if (entity.transform.intersects(_entity.transform as Transform)) {
          isPlacehable = false;
          document.body.style.cursor = "not-allowed";
          break;
        } else {
          isPlacehable = true;
          document.body.style.cursor = "default";
        }
      } else {
        // Fallback for entities without transform - use Rectangle.intersects
        if (Rectangle.intersects(_entity, entity.transform.rectangle)) {
          isPlacehable = false;
          document.body.style.cursor = "not-allowed";
          break;
        } else {
          isPlacehable = true;
          document.body.style.cursor = "default";
        }
      }
    }
  }

  function handleMouseDown() {
    if (!isPlacehable) return;

    const chunk = game.controllers.chunkManager.getChunk(game.state.worldPointer.x, game.state.worldPointer.y);

    const position = chunk.getGlobalPosition();

    const chunkGlobalX = position.x - game.state.worldOffset.x;
    const chunkGlobalY = position.y - game.state.worldOffset.y;
    
    const chunkRelativeX = entity.container.x - chunkGlobalX;
    const chunkRelativeY = entity.container.y - chunkGlobalY;

    entity.ghostMode = false;
    entity.transform.position.position = {
      x: chunkRelativeX,
      y: chunkRelativeY,
      type: "local"
    }

    chunk.addChild(entity.container);
    game.addEntity(entity);

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
    // Create entity in ghost mode using the new system
    const followEntity = new Assembler(game, new Position(0, 0));
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