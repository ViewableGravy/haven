/***** TYPE DEFINITIONS *****/
import type { LoadChunkEvent } from "../../../server/types/events/load_chunk";
import { logger } from "../../logger";
import { parseChunkKey } from "../../tagged";
import type { MultiplayerManager } from "../manager";
import type { ServerEventHandler } from "./types";

/***** HANDLER IMPLEMENTATION *****/
export class RemoteChunkLoadHandler implements ServerEventHandler {
    constructor(
        private multiplayerManager: MultiplayerManager
    ) {}

    public handleEvent(data: LoadChunkEvent.LoadChunkData): void {
        // Parse chunk coordinates from the chunkKey
        const { chunkX, chunkY } = parseChunkKey(data.chunkKey);
        
        logger.log(`RemoteChunkLoadHandler: Loading chunk (${chunkX}, ${chunkY}) with ${data.tiles.length} tiles and ${data.entities.length} entities`);
        
        try {
            // Create chunk from server tile data using ChunkManager
            const chunk = this.multiplayerManager.game.controllers.chunkManager.createChunkFromTiles(
                chunkX, 
                chunkY, 
                data.tiles
            );
            
            logger.log(`RemoteChunkLoadHandler: Created chunk container at position (${chunk.getContainer().x}, ${chunk.getContainer().y})`);

            // Register chunk with entities atomically
            this.multiplayerManager.game.controllers.chunkManager.registerChunkWithEntities(
                data.chunkKey,
                chunk,
                [] // No entities from chunk creation, they'll be added separately
            );
            
            logger.log(`RemoteChunkLoadHandler: Registered chunk ${data.chunkKey} successfully`);
            
            // Process entities that came with the chunk data
            for (const entityData of data.entities) {
                logger.log(`RemoteChunkLoadHandler: Processing entity ${entityData.id} for chunk ${data.chunkKey}`);
                this.multiplayerManager.entitySync.handleRemoteEntityPlaced(entityData);
            }
            
            logger.log(`RemoteChunkLoadHandler: Finished loading chunk ${data.chunkKey}`);
        } catch (error) {
            console.error(`Failed to handle remote chunk load for ${data.chunkKey}:`, error);
        }
    }
}
