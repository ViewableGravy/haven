import type { MultiplayerClient } from "../../../server/types";
import type { MultiplayerManager } from "../manager";
import type { ServerEventHandler } from "./types";

/***** HANDLER IMPLEMENTATION *****/
export class EntitiesListHandler implements ServerEventHandler {
    constructor(private multiplayerManager: MultiplayerManager) {}

    public handleEvent(data: MultiplayerClient.Data.EntitiesList): void {
        this.multiplayerManager.entitySync.syncExistingEntities(data.entities);
    }
}