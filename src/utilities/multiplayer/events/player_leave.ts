import type { MultiplayerClient } from "../../../server/types";
import type { MultiplayerManager } from "../manager";
import type { ServerEventHandler } from "./types";

/***** HANDLER IMPLEMENTATION *****/
export class PlayerLeaveHandler implements ServerEventHandler {
    constructor(private multiplayerManager: MultiplayerManager) {}

    public handleEvent(data: MultiplayerClient.Data.PlayerLeave): void {
        const remotePlayer = this.multiplayerManager.remotePlayers.get(data.id);
        if (remotePlayer) {
            remotePlayer.destroy();
            this.multiplayerManager.remotePlayers.delete(data.id);
        }
    }
}