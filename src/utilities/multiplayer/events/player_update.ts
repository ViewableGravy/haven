import type { MultiplayerClient } from "../../../server/types";
import type { MultiplayerManager } from "../manager";
import type { ServerEventHandler } from "./types";

/***** HANDLER IMPLEMENTATION *****/
export class PlayerUpdateHandler implements ServerEventHandler {
    constructor(private multiplayerManager: MultiplayerManager) {}

    public handleEvent(data: MultiplayerClient.Data.PlayerUpdate): void {
        const remotePlayer = this.multiplayerManager.remotePlayers.get(data.id);

        console.log(remotePlayer)
        if (remotePlayer) {
            remotePlayer.updatePosition(data.x, data.y);
        }
    }
}