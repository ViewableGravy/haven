import type { MultiplayerClient } from "../../../server/types";
import type { MultiplayerManager } from "../manager";
import type { ServerEventHandler } from "./types";

/***** HANDLER IMPLEMENTATION *****/
export class EntityRemovedHandler implements ServerEventHandler {
    constructor(private multiplayerManager: MultiplayerManager) {}

    public handleEvent(data: MultiplayerClient.Data.EntityRemoved): void {
        this.multiplayerManager.entitySync.handleRemoteEntityRemoved(data.id);
    }
}