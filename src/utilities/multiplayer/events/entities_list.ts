import type { MultiplayerClient } from "../../../server/types";
import type { MultiplayerManager } from "../manager";
import type { ServerEventHandler } from "./types";

/***** HANDLER IMPLEMENTATION *****/
export class EntitiesListHandler implements ServerEventHandler {
    constructor(private multiplayerManager: MultiplayerManager) {}

    public async handleEvent(data: MultiplayerClient.Data.EntitiesList): Promise<void> {
        await this.multiplayerManager.entitySync.syncExistingEntities(data.entities);
    }
}