import type { ChunkKey } from "../../../utilities/tagged";
import type { EntityData } from "../../types";

/**********************************************************************************************************
 *   TYPE DEFINITIONS
 **********************************************************************************************************/
export namespace LoadChunkEvent {
    export type Tile = {
        x: number,
        y: number,
        spriteIndex: number,
    }
    
    export type LoadChunkType = "load_chunk";
    export type LoadChunkData = {
        chunkKey: ChunkKey,
        tiles: Array<Tile>,
        entities: Array<EntityData>
    }
}