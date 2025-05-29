/***** TYPE DEFINITIONS *****/
import { v4 as uuidv4 } from 'uuid';
import { WebSocketServer, type WebSocket } from 'ws';
import { GameConstants } from '../shared/constants';
import { logger } from "../utilities/logger";
import { createChunkKey } from '../utilities/tagged';
import { chunkDatabase } from './chunkdb';
import { ServerChunkGenerator } from './chunkGenerator';
import type { EntityData, Player, ServerEvents } from './types';

/***** MULTIPLAYER SERVER *****/
export class MultiplayerServer {
  private wss: WebSocketServer;
  private players: Map<string, Player> = new Map();
  private entities: Map<string, EntityData> = new Map();
  private port: number;
  private chunkGenerator: ServerChunkGenerator;
  private readonly chunkAbsolute: number = GameConstants.CHUNK_ABSOLUTE;

  constructor(port: number = GameConstants.DEFAULT_SERVER_PORT) {
    this.port = port;
    this.wss = new WebSocketServer({ port });
    this.chunkGenerator = new ServerChunkGenerator(GameConstants.DEFAULT_SEED);
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
        ws,
        visibleChunks: new Set<string>()
      };

      logger.log(`Player ${playerId} connected at (${player.x}, ${player.y})`);

      this.players.set(playerId, player);

      // Send current players list to new player
      this.sendToPlayer(playerId, {
        type: 'players_list',
        data: {
          players: Array.from(this.players.values())
            .filter((p) => p.id !== playerId)
            .map((p) => ({ id: p.id, x: p.x, y: p.y }))
        }
      });

      // Send current entities list to new player
      this.sendToPlayer(playerId, {
        type: 'entities_list',
        data: {
          entities: Array.from(this.entities.values())
        }
      });

      // Generate and send chunks around the player's spawn position
      this.generateAndSendChunksForPlayer(playerId, player.x, player.y);

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

    logger.log(`Multiplayer server listening on port ${this.port}`);
  }

  /***** CHUNK MANAGEMENT *****/
  /**
   * Generate and send chunks within a configurable radius around the player
   * @param playerId - The ID of the player to send chunks to
   * @param playerX - The player's x position
   * @param playerY - The player's y position
   */
  private generateAndSendChunksForPlayer(playerId: string, playerX: number, playerY: number): void {
    const player = this.players.get(playerId);
    if (!player) return;

    // Calculate which chunk the player is in
    const playerChunkX = Math.floor(playerX / this.chunkAbsolute);
    const playerChunkY = Math.floor(playerY / this.chunkAbsolute);

    logger.log(`Generating chunks for player ${playerId} at chunk (${playerChunkX}, ${playerChunkY})`);

    // Generate chunks around the player using shared constants
    const chunkRadius = GameConstants.DEFAULT_LOAD_RADIUS;
    const halfRadius = GameConstants.HALF_LOAD_RADIUS;

    for (let x = playerChunkX - halfRadius; x <= playerChunkX + halfRadius; x++) {
      for (let y = playerChunkY - halfRadius; y <= playerChunkY + halfRadius; y++) {
        const chunkKey = createChunkKey(x, y);
        this.ensureChunkExistsAndSend(playerId, x, y);
        player.visibleChunks.add(chunkKey);
      }
    }

    logger.log(`Sent ${chunkRadius * chunkRadius} chunks to player ${playerId}`);
  }

  /**
   * Send only newly visible chunks when player moves across chunk boundaries
   * @param playerId - The ID of the player
   * @param newChunkX - The new chunk x coordinate
   * @param newChunkY - The new chunk y coordinate
   */
  private sendNewChunksForPlayer(playerId: string, newChunkX: number, newChunkY: number): void {
    const player = this.players.get(playerId);
    if (!player) return;

    // Calculate new visible chunk set
    const newVisibleChunks = new Set<string>();
    const halfRadius = GameConstants.HALF_LOAD_RADIUS;

    for (let x = newChunkX - halfRadius; x <= newChunkX + halfRadius; x++) {
      for (let y = newChunkY - halfRadius; y <= newChunkY + halfRadius; y++) {
        const chunkKey = createChunkKey(x, y);
        newVisibleChunks.add(chunkKey);
      }
    }

    // Find chunks that are newly visible (not in current visible set)
    const chunksToLoad: Array<{x: number, y: number}> = [];
    newVisibleChunks.forEach((chunkKey) => {
      if (!player.visibleChunks.has(chunkKey)) {
        const [x, y] = chunkKey.split(',').map(Number);
        chunksToLoad.push({x, y});
      }
    });

    // Send only the new chunks
    chunksToLoad.forEach(({x, y}) => {
      this.ensureChunkExistsAndSend(playerId, x, y);
    });

    // Update player's visible chunks set
    player.visibleChunks = newVisibleChunks;

    if (chunksToLoad.length > 0) {
      logger.log(`Sent ${chunksToLoad.length} new chunks to player ${playerId} at chunk (${newChunkX}, ${newChunkY})`);
    }
  }

  /**
   * Ensure a chunk exists in the database and send it to the player
   * @param playerId - The ID of the player to send the chunk to
   * @param chunkX - The chunk x coordinate
   * @param chunkY - The chunk y coordinate
   */
  private ensureChunkExistsAndSend(playerId: string, chunkX: number, chunkY: number): void {
    const chunkKey = createChunkKey(chunkX, chunkY);
    
    // Check if chunk already exists in database
    let chunkData = chunkDatabase.getChunk(chunkKey);
    
    if (!chunkData) {
      // Generate new chunk if it doesn't exist
      chunkData = this.chunkGenerator.generateChunk(chunkX, chunkY);
      
      // Store in database
      chunkDatabase.storeChunk(chunkKey, chunkData);
      
      logger.log(`Generated and stored new chunk ${chunkKey}`);
    }

    // Send load_chunk message to the player
    const loadChunkMessage: ServerEvents.LoadChunkMessage = {
      type: 'load_chunk',
      data: {
        chunkKey: chunkData.chunkKey,
        tiles: chunkData.tiles,
        entities: chunkData.entities
      }
    };

    this.sendToPlayer(playerId, loadChunkMessage);
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
        logger.log(`Unknown message type: ${message.type}`);
    }
  }

  private handlePositionUpdate(playerId: string, data: { x: number; y: number }): void {
    const player = this.players.get(playerId);
    if (!player) return;

    // Calculate old and new chunk positions
    const oldChunkX = Math.floor(player.x / this.chunkAbsolute);
    const oldChunkY = Math.floor(player.y / this.chunkAbsolute);
    const newChunkX = Math.floor(data.x / this.chunkAbsolute);
    const newChunkY = Math.floor(data.y / this.chunkAbsolute);

    // Update player position
    player.x = data.x;
    player.y = data.y;

    // Check if player crossed chunk boundaries
    if (oldChunkX !== newChunkX || oldChunkY !== newChunkY) {
      // Send only newly visible chunks
      this.sendNewChunksForPlayer(playerId, newChunkX, newChunkY);
    }

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

    // Store entity in server memory
    this.entities.set(entityId, entityData);

    // Add entity to the appropriate chunk in the database
    const chunkKey = createChunkKey(data.chunkX, data.chunkY);
    const success = chunkDatabase.addEntityToChunk(chunkKey, entityData);
    
    if (!success) {
      console.warn(`Failed to add entity ${entityId} to chunk ${chunkKey} - chunk doesn't exist`);
      // Could generate the chunk here if needed
      const chunkData = this.chunkGenerator.generateChunk(data.chunkX, data.chunkY);
      chunkData.entities.push(entityData);
      chunkDatabase.storeChunk(chunkKey, chunkData);
      logger.log(`Created new chunk ${chunkKey} for entity placement`);
    }

    // Broadcast to all players (including the one who placed it for confirmation)
    this.broadcast({
      type: 'entity_placed',
      data: entityData
    });

    logger.log(`Entity ${data.type} placed by ${playerId} at (${data.x}, ${data.y}) in chunk (${data.chunkX}, ${data.chunkY})`);
  }

  private handleEntityRemove(playerId: string, data: { id: string }): void {
    const entity = this.entities.get(data.id);
    if (!entity) return;

    // Remove from server memory
    this.entities.delete(data.id);

    // Remove from chunk database
    const chunkKey = createChunkKey(entity.chunkX, entity.chunkY);
    chunkDatabase.removeEntityFromChunk(chunkKey, data.id);

    // Broadcast removal to all players
    this.broadcast({
      type: 'entity_removed',
      data: { id: data.id }
    });

    logger.log(`Entity ${data.id} removed by ${playerId} from chunk (${entity.chunkX}, ${entity.chunkY})`);
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

  /***** SERVER STATISTICS *****/
  public getPlayerCount(): number {
    return this.players.size;
  }

  public getEntityCount(): number {
    return this.entities.size;
  }

  public getChunkStats(): { chunkCount: number; totalEntities: number } {
    return chunkDatabase.getStats();
  }
}

/***** SERVER STARTUP *****/
// Check if this file is being run directly
if (process.argv[1] === __filename || process.argv[1] === import.meta.url) {
  const server = new MultiplayerServer(8080);
  logger.log('Server created and listening on port 8080');
  logger.log('Chunk generation system initialized');

  // Log server statistics periodically
  setInterval(() => {
    const chunkStats = server.getChunkStats();
    logger.log(`Server Stats - Players: ${server.getPlayerCount()}, Entities: ${server.getEntityCount()}, Chunks: ${chunkStats.chunkCount}, Chunk Entities: ${chunkStats.totalEntities}`);
  }, 30000); // Every 30 seconds

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.log('Shutting down server...');
    process.exit(0);
  });
}