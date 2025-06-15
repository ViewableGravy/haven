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
        
        Logger.log(`RemoteChunkLoadHandler: Loading chunk (${chunkX}, ${chunkY}) with ${data.tiles.length} tiles and ${data.entities.length} entities`);
        
        // Log details about entities being loaded
        data.entities.forEach((entity, index) => {
            Logger.log(`RemoteChunkLoadHandler: Entity ${index + 1}/${data.entities.length}: ${entity.type} (${entity.id}) at (${entity.x}, ${entity.y})`);
        });
        
        try {
            // Create chunk from server tile data using ChunkManager
            const chunk = this.multiplayerManager.game.controllers.chunkManager.createChunkFromTiles(
                chunkX, 
                chunkY, 
                data.tiles
            );
            
            Logger.log(`RemoteChunkLoadHandler: Created chunk container at position (${chunk.getContainer().x}, ${chunk.getContainer().y})`);

            // Register chunk with entities atomically
            this.multiplayerManager.game.controllers.chunkManager.registerChunkWithEntities(
                data.chunkKey,
                chunk,
                [] // No entities from chunk creation, they'll be added separately
            );
            
            Logger.log(`RemoteChunkLoadHandler: Registered chunk ${data.chunkKey} successfully`);
              // Process entities that came with the chunk data
            for (const entityData of data.entities) {
                Logger.log(`RemoteChunkLoadHandler: Processing entity ${entityData.id} (${entityData.type}) for chunk ${data.chunkKey}`);
                try {
                    await this.multiplayerManager.entitySync.handleRemoteEntityPlaced(entityData);
                    Logger.log(`RemoteChunkLoadHandler: Successfully processed entity ${entityData.id}`);
                } catch (error) {
                    Logger.log(`RemoteChunkLoadHandler: Failed to process entity ${entityData.id}: ${error}`);
                    console.error(`Failed to process entity ${entityData.id}:`, error);
                }
            }
            
            Logger.log(`RemoteChunkLoadHandler: Finished loading chunk ${data.chunkKey}`);
        } catch (error) {
            console.error(`Failed to handle remote chunk load for ${data.chunkKey}:`, error);
        }
    }
}
