/***** TYPE DEFINITIONS *****/
import { v4 as uuidv4 } from 'uuid';
import { GameConstants } from '../shared/constants';
import { logger } from "../utilities/logger";
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
      }
    });

    logger.log(`Bun server started on port ${this.port} with auto-restart enabled`);
    logger.log('Auto-restart test: Server file modified!');
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

    logger.log(`Loading chunks for player ${player.id} at chunk (${playerChunkX}, ${playerChunkY})`);

    const chunkWidth = GameConstants.CHUNK_RENDER_WIDTH;
    const chunkHeight = GameConstants.CHUNK_RENDER_HEIGHT;
    const halfWidth = GameConstants.HALF_CHUNK_RENDER_WIDTH;
    const halfHeight = GameConstants.HALF_CHUNK_RENDER_HEIGHT;

    for (let x = playerChunkX - halfWidth; x <= playerChunkX + halfWidth; x++) {
      for (let y = playerChunkY - halfHeight; y <= playerChunkY + halfHeight; y++) {
        const chunkKey = createChunkKey(x, y);
        this.ensureChunkExistsAndSend(player.id, x, y);
        player.visibleChunks.add(chunkKey);
      }
    }

    logger.log(`Sent ${chunkWidth * chunkHeight} chunks to player ${player.id}`);
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
      this.ensureChunkExistsAndSend(playerId, x, y);
    });

    player.visibleChunks = newVisibleChunks;

    if (chunksToLoad.length > 0) {
      logger.log(`Sent ${chunksToLoad.length} new chunks to player ${playerId} at chunk (${newChunkX}, ${newChunkY})`);
    }
  };

  private ensureChunkExistsAndSend = (playerId: string, chunkX: number, chunkY: number): void => {
    const chunkKey = createChunkKey(chunkX, chunkY);
    
    let chunkData = chunkDatabase.getChunk(chunkKey);
    
    if (!chunkData) {
      chunkData = this.chunkGenerator.generateChunk(chunkX, chunkY);
      chunkDatabase.storeChunk(chunkKey, chunkData);
      logger.log(`Generated and stored new chunk ${chunkKey}`);
    }

    const loadChunkMessage: ServerEvents.LoadChunkMessage = {
      type: 'load_chunk',
      data: {
        chunkKey: chunkData.chunkKey,
        tiles: chunkData.tiles,
        entities: chunkData.entities
      }
    };

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
      logger.log(`Created new chunk ${chunkKey} for entity placement`);
    }

    this.broadcast({
      type: 'entity_placed',
      data: entityData
    });

    logger.log(`Entity ${entityData.type} placed by ${entityData.placedBy} at (${entityData.x}, ${entityData.y}) in chunk (${entityData.chunkX}, ${entityData.chunkY})`);
  };

  public removeEntity = (playerId: string, entityId: string): void => {
    const entity = this.entities.get(entityId);
    if (!entity) return;

    this.entities.delete(entityId);

    const chunkKey = createChunkKey(entity.chunkX, entity.chunkY);
    chunkDatabase.removeEntityFromChunk(chunkKey, entityId);

    this.broadcast({
      type: 'entity_removed',
      data: { id: entityId }
    });

    logger.log(`Entity ${entityId} removed by ${playerId} from chunk (${entity.chunkX}, ${entity.chunkY})`);
  };

  /***** UTILITY METHODS *****/
  public sendToPlayer = (playerId: string, message: ServerEvents.ServerMessage): void => {
    const player = this.players.get(playerId);
    if (player && player.ws.readyState === 1) { // 1 = OPEN
      player.ws.send(JSON.stringify(message));
    }
  };

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
      logger.log('Server stopped');
    }
  };
}

/***** SERVER STARTUP *****/
// Check if this file is being run directly
if (process.argv[1] === __filename || process.argv[1] === import.meta.url) {
  const server = new BunMultiplayerServer(); // Use default port from constants
  logger.log('Bun server created and listening on port 8081');
  logger.log('Chunk generation system initialized');

  // Log server statistics periodically
  setInterval(() => {
    const chunkStats = server.getChunkStats();
    logger.log(`Server Stats - Players: ${server.getPlayerCount()}, Entities: ${server.getEntityCount()}, Chunks: ${chunkStats.chunkCount}, Chunk Entities: ${chunkStats.totalEntities}`);
  }, 30000); // Every 30 seconds

  // Graceful shutdown
  process.on('SIGINT', () => {
    logger.log('Shutting down server...');
    server.stop();
    process.exit(0);
  });
}
