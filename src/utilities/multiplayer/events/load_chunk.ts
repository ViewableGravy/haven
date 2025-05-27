import type { LoadChunkEvent } from "../../../server/types/events/load_chunk";
import type { MultiplayerManager } from "../manager";
import type { ServerEventHandler } from "./types";

export class RemoteChunkLoadHandler implements ServerEventHandler {
    constructor(private multiplayerManager: MultiplayerManager) {}

    public handleEvent(data: LoadChunkEvent.LoadChunkData ) {
        // TODO
    }
}
