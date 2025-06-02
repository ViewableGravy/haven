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
        type: "texture" | "tiles",
        entities: Array<EntityData>
    } & (LoadChunkTextureData | LoadChunkTilesData);

    type LoadChunkTextureData = {
        type: "texture";
        texture: string; // string url
    }

    type LoadChunkTilesData = {
        type: "tiles";
        tiles: Array<Tile>;
    }
}