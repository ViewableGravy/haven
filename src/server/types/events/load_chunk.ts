import type { ChunkKey } from "../../../utilities/tagged";
import type { EntityData } from "../../types";

/**********************************************************************************************************
 *   TYPE DEFINITIONS
 **********************************************************************************************************/
export namespace LoadChunkEvent {
    export type Tile = {
        color: string,
        x: number,
        y: number,
        spriteIndex?: number, // Optional for backward compatibility
    }
    
    export type LoadChunkType = "load_chunk";
    export type LoadChunkData = {
        chunkKey: ChunkKey,
        tiles: Array<Tile>,
        entities: Array<EntityData>
    }
}