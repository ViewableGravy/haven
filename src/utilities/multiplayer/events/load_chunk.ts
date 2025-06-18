/***** TYPE DEFINITIONS *****/
import type { LoadChunkEvent } from "../../../server/types/events/load_chunk";
import { Logger } from "../../logger";
import { parseChunkKey } from "../../tagged";
import type { MultiplayerManager } from "../manager";
import type { ServerEventHandler } from "./types";

/***** HANDLER IMPLEMENTATION *****/
export class RemoteChunkLoadHandler implements ServerEventHandler {
    constructor(
        private multiplayerManager: MultiplayerManager
    ) {}    public async handleEvent(data: LoadChunkEvent.LoadChunkData): Promise<void> {
        // Parse chunk coordinates from the chunkKey
        const { chunkX, chunkY } = parseChunkKey(data.chunkKey);
        
        
        // Log details about entities being loaded
        data.entities.forEach((entity, index) => {
        });
        
        try {
            // Create chunk from server tile data using ChunkManager
            const chunk = this.multiplayerManager.game.controllers.chunkManager.createChunkFromTiles(
                chunkX, 
                chunkY, 
                data.tiles
            );
            

            // Register chunk with entities atomically
            this.multiplayerManager.game.controllers.chunkManager.registerChunkWithEntities(
                data.chunkKey,
                chunk,
                [] // No entities from chunk creation, they'll be added separately
            );
              // Process entities that came with the chunk data
            for (const entityData of data.entities) {
                try {
                    await this.multiplayerManager.entitySync.handleRemoteEntityPlaced(entityData);
                } catch (error) {
                    console.error(`Failed to process entity ${entityData.id}:`, error);
                }
            }
        } catch (error) {
            console.error(`Failed to handle remote chunk load for ${data.chunkKey}:`, error);
        }
    }
}
