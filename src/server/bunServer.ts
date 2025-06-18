/***** TYPE DEFINITIONS *****/
import { v4 as uuidv4 } from 'uuid';
import { GameConstants } from '../shared/constants';
import { Logger } from "../utilities/logger";
import { createChunkKey } from '../utilities/tagged';
import { chunkDatabase } from './chunkdb';
import { ServerChunkGenerator } from './chunkGenerator';
import { HttpHandler } from './httpHandler';
import type { EntityData, Player, ServerEvents } from './types';
import { WebSocketHandler } from './webSocketHandler';

/***** BUN MULTIPLAYER SERVER *****/
export class BunMultiplayerServer {
  private server: any;
  private players: Map<string, Player> = new Map();
  private entities: Map<string, EntityData> = new Map();
  private port: number;
  private chunkGenerator: ServerChunkGenerator;
  private httpHandler: HttpHandler;
  private webSocketHandler: WebSocketHandler;
  private readonly chunkAbsolute: number = GameConstants.CHUNK_ABSOLUTE;

  constructor(port: number = GameConstants.DEFAULT_SERVER_PORT) {
    this.port = port;
    this.chunkGenerator = new ServerChunkGenerator(GameConstants.DEFAULT_SEED);
    this.httpHandler = new HttpHandler(this);
    this.webSocketHandler = new WebSocketHandler(this);
    this.setupServer();
  }

  /***** SERVER SETUP *****/
  private setupServer = (): void => {
    this.server = Bun.serve({
      port: this.port,
      fetch: this.httpHandler.handleRequest,
      websocket: {
        message: this.webSocketHandler.handleMessage,
        open: this.webSocketHandler.handleOpen,
        close: this.webSocketHandler.handleClose,
        drain: this.webSocketHandler.handleDrain
      }    });    // Setup graceful shutdown handlers
    process.on('SIGINT', () => {
      this.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.shutdown();
      process.exit(0);
    });
  };

  /***** PUBLIC METHODS FOR HANDLERS *****/
  public upgradeWebSocket = (req: Request): boolean => {
    return this.server.upgrade(req, {
      data: {
        playerId: uuidv4()
      }
    });
  };

  public addPlayer = (player: Player): void => {
    this.players.set(player.id, player);
  };

  public removePlayer = (playerId: string): void => {
    this.players.delete(playerId);
  };

  public getPlayer = (playerId: string): Player | undefined => {
    return this.players.get(playerId);
  };

  public getOtherPlayers = (excludePlayerId: string): Array<Player> => {
    return Array.from(this.players.values()).filter((p) => p.id !== excludePlayerId);
  };

  public getAllEntities = (): Array<EntityData> => {
    return Array.from(this.entities.values());
  };

  public getServerStats = (): { playerCount: number; entityCount: number; chunkCount: number } => {
    const chunkStats = this.getChunkStats();
    return {
      playerCount: this.players.size,
      entityCount: this.entities.size,
      chunkCount: chunkStats.chunkCount
    };
  };
  /***** CHUNK MANAGEMENT *****/
  public loadChunksAroundPlayer = (player: Player): void => {
    const playerChunkX = Math.floor(player.x / this.chunkAbsolute);
    const playerChunkY = Math.floor(player.y / this.chunkAbsolute);
    
    // Debug: Show what chunks are currently in memory
    chunkDatabase.debugListChunks();

    const halfWidth = GameConstants.HALF_CHUNK_RENDER_WIDTH;
    const halfHeight = GameConstants.HALF_CHUNK_RENDER_HEIGHT;

    for (let x = playerChunkX - halfWidth; x <= playerChunkX + halfWidth; x++) {
      for (let y = playerChunkY - halfHeight; y <= playerChunkY + halfHeight; y++) {
        const chunkKey = createChunkKey(x, y);
        this.ensureChunkExistsAndSend(player.id, x, y);
        player.visibleChunks.add(chunkKey);
      }
    }
  };

  private sendNewChunksForPlayer = (playerId: string, newChunkX: number, newChunkY: number): void => {
    const player = this.players.get(playerId);
    if (!player) return;

    const newVisibleChunks = new Set<string>();
    const halfWidth = GameConstants.HALF_CHUNK_RENDER_WIDTH;
    const halfHeight = GameConstants.HALF_CHUNK_RENDER_HEIGHT;

    for (let x = newChunkX - halfWidth; x <= newChunkX + halfWidth; x++) {
      for (let y = newChunkY - halfHeight; y <= newChunkY + halfHeight; y++) {
        const chunkKey = createChunkKey(x, y);
        newVisibleChunks.add(chunkKey);
      }
    }

    const chunksToLoad: Array<{x: number, y: number}> = [];
    newVisibleChunks.forEach((chunkKey) => {
      if (!player.visibleChunks.has(chunkKey)) {
        const [x, y] = chunkKey.split(',').map(Number);
        chunksToLoad.push({x, y});
      }
    });

    chunksToLoad.forEach(({x, y}) => {
      this.ensureChunkExistsAndSend(playerId, x, y);    });

    player.visibleChunks = newVisibleChunks;
  };
  private ensureChunkExistsAndSend = (playerId: string, chunkX: number, chunkY: number): void => {
    const chunkKey = createChunkKey(chunkX, chunkY);
    
    let chunkData = chunkDatabase.getChunk(chunkKey);
    
    if (!chunkData) {
      chunkData = this.chunkGenerator.generateChunk(chunkX, chunkY);
      chunkDatabase.storeChunk(chunkKey, chunkData);
    } else {
      Logger.log(`Server: Chunk ${chunkKey} already exists in database, loading from cache`, 0.01);
    }

    const loadChunkMessage: ServerEvents.LoadChunkMessage = {
      type: 'load_chunk',
      data: {
        chunkKey: chunkData.chunkKey,
        tiles: chunkData.tiles,
        entities: chunkData.entities
      }
    };

    Logger.log(`Server: Sending chunk ${chunkKey} to player ${playerId} with ${chunkData.entities.length} entities`, 0.001);
    this.sendToPlayer(playerId, loadChunkMessage);
  };

  /***** PLAYER AND ENTITY MANAGEMENT *****/
  public updatePlayerPosition = (playerId: string, x: number, y: number): void => {
    const player = this.players.get(playerId);
    if (!player) return;

    const oldChunkX = Math.floor(player.x / this.chunkAbsolute);
    const oldChunkY = Math.floor(player.y / this.chunkAbsolute);
    const newChunkX = Math.floor(x / this.chunkAbsolute);
    const newChunkY = Math.floor(y / this.chunkAbsolute);

    player.x = x;
    player.y = y;

    if (oldChunkX !== newChunkX || oldChunkY !== newChunkY) {
      this.sendNewChunksForPlayer(playerId, newChunkX, newChunkY);
    }

    this.broadcastToOthers(playerId, {
      type: 'player_update',
      data: {
        id: playerId,
        x: x,
        y: y
      }
    });
  };
  public placeEntity = (entityData: EntityData): void => {
    this.entities.set(entityData.id, entityData);

    const chunkKey = createChunkKey(entityData.chunkX, entityData.chunkY);
    
    const success = chunkDatabase.addEntityToChunk(chunkKey, entityData);
    
    if (!success) {
      const chunkData = this.chunkGenerator.generateChunk(entityData.chunkX, entityData.chunkY);
      chunkData.entities.push(entityData);
      chunkDatabase.storeChunk(chunkKey, chunkData);
    } else {
      const chunkData = chunkDatabase.getChunk(chunkKey);
    }

    this.broadcast({
      type: 'entity_placed',
      data: entityData
    });

  };

  public removeEntity = (playerId: string, entityId: string): boolean => {
    const entity = this.entities.get(entityId);
    if (!entity) return false;

    this.entities.delete(entityId);

    const chunkKey = createChunkKey(entity.chunkX, entity.chunkY);
    chunkDatabase.removeEntityFromChunk(chunkKey, entityId);

    this.broadcast({
      type: 'entity_removed',
      data: { id: entityId }
    });

    return true;
  };

  /***** UTILITY METHODS *****/
  public sendToPlayer(playerId: string, message: ServerEvents.ServerMessage): void;
  public sendToPlayer(playerId: string, message: ServerEvents.ServerMessageWithAsyncResponse): void;
  public sendToPlayer(playerId: string, message: ServerEvents.ServerMessage | ServerEvents.ServerMessageWithAsyncResponse): void {
    const player = this.players.get(playerId);
    if (player && player.ws.readyState === 1) { // 1 = OPEN
      player.ws.send(JSON.stringify(message));
    }
  }

  public broadcastToOthers = (excludePlayerId: string, message: ServerEvents.ServerMessage): void => {
    this.players.forEach((player, id) => {
      if (id !== excludePlayerId && player.ws.readyState === 1) {
        player.ws.send(JSON.stringify(message));
      }
    });
  };

  public broadcast = (message: ServerEvents.ServerMessage): void => {
    this.players.forEach((player) => {
      if (player.ws.readyState === 1) {
        player.ws.send(JSON.stringify(message));
      }
    });
  };

  /***** SERVER STATISTICS *****/
  public getPlayerCount = (): number => {
    return this.players.size;
  };

  public getEntityCount = (): number => {
    return this.entities.size;
  };

  public getChunkStats = (): { chunkCount: number; totalEntities: number } => {
    return chunkDatabase.getStats();
  };

  public stop = (): void => {
    if (this.server) {
      this.server.stop();
    }
  };

  /***** SHUTDOWN HANDLING *****/
  public shutdown(): void {
    chunkDatabase.shutdown();
    if (this.server) {
      this.server.stop();
    }
  }

  /***** DEBUG ENDPOINTS *****/
  public debugGetChunkInfo = (chunkX: number, chunkY: number): any => {
    const chunkKey = createChunkKey(chunkX, chunkY);
    const chunkData = chunkDatabase.getChunk(chunkKey);
    
    if (!chunkData) {
      return { error: `Chunk ${chunkKey} not found in database` };
    }
    
    return {
      chunkKey,
      entityCount: chunkData.entities.length,
      entities: chunkData.entities.map((entity) => ({
        id: entity.id,
        type: entity.type,
        x: entity.x,
        y: entity.y,
        placedBy: entity.placedBy
      })),
      generatedAt: new Date(chunkData.generatedAt).toISOString()
    };
  };
}

/***** SERVER STARTUP *****/
// Check if this file is being run directly
if (process.argv[1] === __filename || process.argv[1] === import.meta.url) {
  const server = new BunMultiplayerServer(); // Use default port from constants

  // Log server statistics periodically
  setInterval(() => {
    const chunkStats = server.getChunkStats();
    Logger.log(`Server Stats - Players: ${server.getPlayerCount()}, Chunks: ${chunkStats.chunkCount}`);
  }, 30000); // Every 30 seconds

  // Graceful shutdown
  process.on('SIGINT', () => {
    server.stop();
    process.exit(0);
  });
}
