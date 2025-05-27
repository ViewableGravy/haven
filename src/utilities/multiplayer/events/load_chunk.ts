import type { ServerEvents } from "../../../server/types";
import type { LoadChunkEvent } from "../../../server/types/events/load_chunk";
import type { MultiplayerManager } from "../manager";

interface ServerEventHandler {
    handleEvent(data: ServerEvents.ServerMessageData): void;
}

export class RemoteChunkLoadHandler implements ServerEventHandler {
    constructor(private multiplayerManager: MultiplayerManager) {}

    public handleEvent(data: LoadChunkEvent.LoadChunkData ) {
        // TODO
    }
}
