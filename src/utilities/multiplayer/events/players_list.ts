import type { MultiplayerClient } from "../../../server/types";
import type { MultiplayerManager } from "../manager";
import { RemotePlayer } from "../remotePlayer";
import type { ServerEventHandler } from "./types";

/***** HANDLER IMPLEMENTATION *****/
export class PlayersListHandler implements ServerEventHandler {
    constructor(private multiplayerManager: MultiplayerManager) {}

    public handleEvent(data: MultiplayerClient.Data.PlayersList): void {
        data.players.forEach(playerData => {
            if (this.multiplayerManager.remotePlayers.has(playerData.id)) {
                return; // Player already exists
            }

            const remotePlayer = new RemotePlayer(
                playerData.id,
                playerData.x,
                playerData.y,
                this.multiplayerManager.game
            );

            this.multiplayerManager.remotePlayers.set(playerData.id, remotePlayer);
        });
    }
}