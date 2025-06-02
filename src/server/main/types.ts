/***** TYPE DEFINITIONS *****/
import type { ServerWebSocket } from 'bun';
import type { LoadChunkEvent } from './types/events/load_chunk';

/***** BUN WEBSOCKET TYPES *****/
export type BunWebSocket = ServerWebSocket<{ playerId: string }>;

export interface ServerEvent {
    type: string;
    data: unknown;
}

export interface Player {
    id: string;
    x: number;
    y: number;
    ws: BunWebSocket;
    visibleChunks: Set<string>;
}

export interface EntityData {
    id: string;
    type: string;
    x: number;
    y: number;
    chunkX: number;
    chunkY: number;
    placedBy: string;
}

export interface PlayerUpdateMessage extends ServerEvent {
    type: "player_update";
    data: {
        id: string;
        x: number;
        y: number;
    };
}

export interface PlayerJoinMessage {
  type: 'player_join';
  data: {
    id: string;
    x: number;
    y: number;
  };
}

export interface PlayerLeaveMessage {
  type: 'player_leave';
  data: {
    id: string;
  };
}

export interface PlayersListMessage {
  type: 'players_list';
  data: {
    players: Array<{
      id: string;
      x: number;
      y: number;
    }>;
  };
}

export interface EntityPlacedMessage {
  type: 'entity_placed';
  data: EntityData;
}

export interface EntityRemovedMessage {
  type: 'entity_removed';
  data: {
    id: string;
  };
}

export interface EntitiesListMessage {
  type: 'entities_list';
  data: {
    entities: EntityData[];
  };
}

export namespace ServerEvents {
  export type LoadChunkMessage = {
    type: LoadChunkEvent.LoadChunkType;
    data: LoadChunkEvent.LoadChunkData;
  }

  export type ServerMessage = 
    | PlayerUpdateMessage 
    | PlayerJoinMessage 
    | PlayerLeaveMessage 
    | PlayersListMessage 
    | EntityPlacedMessage 
    | EntityRemovedMessage 
    | EntitiesListMessage
    | LoadChunkMessage

  export type ServerMessageType = ServerMessage['type'];
  export type ServerMessageData = ServerMessage['data'];
}

/***** MULTIPLAYER CLIENT NAMESPACE *****/
export namespace MultiplayerClient {
  export namespace Data {
    export type PlayerJoin = PlayerJoinMessage['data'];
    export type PlayerLeave = PlayerLeaveMessage['data'];
    export type PlayerUpdate = PlayerUpdateMessage['data'];
    export type PlayersList = PlayersListMessage['data'];
    export type EntityPlaced = EntityPlacedMessage['data'];
    export type EntityRemoved = EntityRemovedMessage['data'];
    export type EntitiesList = EntitiesListMessage['data'];
  }

  export type MultiplayerEvents = {
    player_join: Data.PlayerJoin;
    player_leave: Data.PlayerLeave;
    player_update: Data.PlayerUpdate;
    players_list: Data.PlayersList;
    entity_placed: Data.EntityPlaced;
    entity_removed: Data.EntityRemoved;
    entities_list: Data.EntitiesList;
  };
}