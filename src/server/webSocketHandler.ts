/***** TYPE DEFINITIONS *****/
import { v4 as uuidv4 } from 'uuid';
import { Logger } from "../utilities/Logger";
import type { BunMultiplayerServer } from './bunServer';
import type { BunWebSocket, EntityData, Player } from './types';

/***** WEBSOCKET EVENT HANDLER *****/
export class WebSocketHandler {
  private server: BunMultiplayerServer;

  constructor(server: BunMultiplayerServer) {
    this.server = server;
  }

  /***** WEBSOCKET EVENT HANDLERS *****/
  handleOpen = (ws: BunWebSocket): void => {
    const playerId = ws.data.playerId;

    // Create new player with default position
    const player: Player = {
      id: playerId,
      x: 100,
      y: 100,
      ws,
      visibleChunks: new Set<string>()
    };

    Logger.log(`Player ${playerId} connected at (${player.x}, ${player.y})`);

    this.server.addPlayer(player);

    // Send current players list to new player
    this.server.sendToPlayer(playerId, {
      type: 'players_list',
      data: {
        players: this.server.getOtherPlayers(playerId)
          .map((p) => ({ id: p.id, x: p.x, y: p.y }))
      }
    });

    // Send current entities list to new player
    this.server.sendToPlayer(playerId, {
      type: 'entities_list',
      data: {
        entities: this.server.getAllEntities()
      }
    });

    // Load chunks around player
    this.server.loadChunksAroundPlayer(player);

    // Broadcast player join to all other players
    this.server.broadcastToOthers(playerId, {
      type: 'player_join',
      data: { id: playerId, x: player.x, y: player.y }
    });
  };

  handleMessage = (ws: BunWebSocket, message: string | Buffer): void => {
    const playerId = ws.data.playerId;
    const player = this.server.getPlayer(playerId);
    
    if (!player) {
      Logger.error(`Received message from unknown player: ${playerId}`);
      return;
    }

    try {
      const data = JSON.parse(message.toString()) as any; // Use any for now, could be any server event
      this.handlePlayerMessage(player, data);
    } catch (error) {
      Logger.error(`Failed to parse message from player ${playerId}:`, error);
    }
  };

  handleClose = (ws: BunWebSocket): void => {
    const playerId = ws.data.playerId;
    const player = this.server.getPlayer(playerId);

    if (player) {
      Logger.log(`Player ${playerId} disconnected`);
      this.server.removePlayer(playerId);

      // Broadcast player leave to all other players
      this.server.broadcastToOthers(playerId, {
        type: 'player_leave',
        data: { id: playerId }
      });
    }
  };

  handleDrain = (_ws: BunWebSocket): void => {
    // Called when the socket is ready to receive more data
    // Can be used for backpressure handling
  };

  /***** MESSAGE HANDLING *****/
  private handlePlayerMessage = (player: Player, message: any): void => {
    // Extract requestId if present for async responses
    const requestId = message.requestId;
    
    switch (message.type) {
      case 'position_update':
        this.handlePositionUpdate(player.id, message.data);
        break;
      case 'entity_placed':
        this.handleEntityPlace(player.id, message.data, requestId);
        break;
      case 'entity_remove':
        this.handleEntityRemove(player.id, message.data, requestId);
        break;
      default:
        Logger.log(`Unknown message type: ${message.type}`);
    }
  };

  private handlePositionUpdate = (playerId: string, data: { x: number; y: number }): void => {
    this.server.updatePlayerPosition(playerId, data.x, data.y);
  };

  private handleEntityPlace = (playerId: string, data: {
    type: string;
    x: number;
    y: number;
    chunkX: number;
    chunkY: number;
  }, requestId?: string): void => {
    const entityId = uuidv4();
    const entityData: EntityData = {
      id: entityId,
      type: data.type,
      x: data.x,
      y: data.y,
      chunkX: data.chunkX,
      chunkY: data.chunkY,
      placedBy: playerId
    };

    this.server.placeEntity(entityData);
    
    // Send async response if requestId is provided
    if (requestId) {
      this.server.sendToPlayer(playerId, {
        type: 'entity_placed',
        data: entityData,
        requestId
      } as any);
    }
  };

  private handleEntityRemove = (playerId: string, data: { id: string }, requestId?: string): void => {
    const success = this.server.removeEntity(playerId, data.id);
    
    // Send async response if requestId is provided
    if (requestId) {
      this.server.sendToPlayer(playerId, {
        type: 'entity_removed',
        data: { success },
        requestId
      } as any);
    }
  };
}
