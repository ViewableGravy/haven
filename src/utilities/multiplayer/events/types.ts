import type { ServerEvents } from "../../../server/main/types";

/***** TYPE DEFINITIONS *****/
export interface ServerEventHandler {
    handleEvent(data: ServerEvents.ServerMessageData): void | Promise<void>;
}