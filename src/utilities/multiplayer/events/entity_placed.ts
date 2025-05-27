import type { MultiplayerClient } from "../../../server/types";
import type { MultiplayerManager } from "../manager";
import type { ServerEventHandler } from "./types";

/***** HANDLER IMPLEMENTATION *****/
export class EntityPlacedHandler implements ServerEventHandler {
    constructor(private multiplayerManager: MultiplayerManager) {}

    public handleEvent(data: MultiplayerClient.Data.EntityPlaced): void {
        this.multiplayerManager.entitySync.handleRemoteEntityPlaced(data);
    }
}