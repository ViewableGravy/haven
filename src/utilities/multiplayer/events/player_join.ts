import type { MultiplayerClient } from "../../../server/types";
import type { MultiplayerManager } from "../manager";
import { RemotePlayer } from "../remotePlayer";
import type { ServerEventHandler } from "./types";

/***** HANDLER IMPLEMENTATION *****/
export class PlayerJoinHandler implements ServerEventHandler {
    constructor(private multiplayerManager: MultiplayerManager) {}

    public handleEvent(data: MultiplayerClient.Data.PlayerJoin): void {
        if (this.multiplayerManager.remotePlayers.has(data.id)) {
            return; // Player already exists
        }

        const remotePlayer = new RemotePlayer(
            data.id,
            data.x,
            data.y,
            this.multiplayerManager.game
        );

        this.multiplayerManager.remotePlayers.set(data.id, remotePlayer);
    }
}