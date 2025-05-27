/***** TYPE DEFINITIONS *****/
import { v4 as uuidv4 } from 'uuid';
import { WebSocketServer, type WebSocket } from 'ws';
import type { EntityData, Player, ServerEvents } from './types';

/***** MULTIPLAYER SERVER *****/
export class MultiplayerServer {
  private wss: WebSocketServer;
  private players: Map<string, Player> = new Map();
  private entities: Map<string, EntityData> = new Map();
  private port: number;

  constructor(port: number = 8080) {
    this.port = port;
    this.wss = new WebSocketServer({ port });
    this.setupEventHandlers();
  }

  /***** SERVER SETUP *****/
  private setupEventHandlers(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      const playerId = uuidv4();

      // Create new player with default position
      const player: Player = {
        id: playerId,
        x: 100,
        y: 100,
        ws
      };

      this.players.set(playerId, player);

      // Send current players list to new player
      this.sendToPlayer(playerId, {
        type: 'players_list',
        data: {
          players: Array.from(this.players.values())
            .filter(p => p.id !== playerId)
            .map(p => ({ id: p.id, x: p.x, y: p.y }))
        }
      });

      // Send current entities list to new player
      this.sendToPlayer(playerId, {
        type: 'entities_list',
        data: {
          entities: Array.from(this.entities.values())
        }
      });

      // Notify other players about new player
      this.broadcastToOthers(playerId, {
        type: 'player_join',
        data: {
          id: playerId,
          x: player.x,
          y: player.y
        }
      });

      // Handle incoming messages
      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handlePlayerMessage(playerId, message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      // Handle disconnection
      ws.on('close', () => {
        this.players.delete(playerId);

        // Notify other players about player leaving
        this.broadcastToOthers(playerId, {
          type: 'player_leave',
          data: { id: playerId }
        });
      });
    });

    console.log(`Multiplayer server listening on port ${this.port}`);
  }

  /***** MESSAGE HANDLING *****/
  private handlePlayerMessage(playerId: string, message: any): void {
    const player = this.players.get(playerId);
    if (!player) return;

    switch (message.type) {
      case 'position_update':
        this.handlePositionUpdate(playerId, message.data);
        break;
      case 'entity_placed':
        this.handleEntityPlace(playerId, message.data);
        break;
      case 'entity_remove':
        this.handleEntityRemove(playerId, message.data);
        break;
      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  }

  private handlePositionUpdate(playerId: string, data: { x: number; y: number }): void {
    const player = this.players.get(playerId);
    if (!player) return;

    // Update player position
    player.x = data.x;
    player.y = data.y;

    // Broadcast position update to other players
    this.broadcastToOthers(playerId, {
      type: 'player_update',
      data: {
        id: playerId,
        x: data.x,
        y: data.y
      }
    });
  }

  /***** ENTITY MANAGEMENT *****/
  private handleEntityPlace(playerId: string, data: {
    type: string;
    x: number;
    y: number;
    chunkX: number;
    chunkY: number;
  }): void {
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

    // Store entity
    this.entities.set(entityId, entityData);

    // Broadcast to all players (including the one who placed it for confirmation)
    this.broadcast({
      type: 'entity_placed',
      data: entityData
    });

    console.log(`Entity ${data.type} placed by ${playerId} at (${data.x}, ${data.y})`);
  }

  private handleEntityRemove(playerId: string, data: { id: string }): void {
    const entity = this.entities.get(data.id);
    if (!entity) return;

    // Remove entity
    this.entities.delete(data.id);

    // Broadcast removal to all players
    this.broadcast({
      type: 'entity_removed',
      data: { id: data.id }
    });

    console.log(`Entity ${data.id} removed by ${playerId}`);
  }

  /***** UTILITY METHODS *****/
  private sendToPlayer(playerId: string, message: ServerEvents.ServerMessage): void {
    const player = this.players.get(playerId);
    if (player && player.ws.readyState === player.ws.OPEN) {
      player.ws.send(JSON.stringify(message));
    }
  }

  private broadcastToOthers(excludePlayerId: string, message: ServerEvents.ServerMessage): void {
    this.players.forEach((player, id) => {
      if (id !== excludePlayerId && player.ws.readyState === player.ws.OPEN) {
        player.ws.send(JSON.stringify(message));
      }
    });
  }

  private broadcast(message: ServerEvents.ServerMessage): void {
    this.players.forEach((player) => {
      if (player.ws.readyState === player.ws.OPEN) {
        player.ws.send(JSON.stringify(message));
      }
    });
  }

  public getPlayerCount(): number {
    return this.players.size;
  }

  public getEntityCount(): number {
    return this.entities.size;
  }
}

/***** SERVER STARTUP *****/
// Check if this file is being run directly
if (process.argv[1] === __filename || process.argv[1] === import.meta.url) {
  new MultiplayerServer(8080);
  console.log('Server created and listening on port 8080');

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('Shutting down server...');
    process.exit(0);
  });
}