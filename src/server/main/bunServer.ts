/***** TYPE DEFINITIONS *****/
import { v4 as uuidv4 } from 'uuid';
import { GameConstants } from '../../shared/constants';
import { logger } from "../../utilities/logger";
import { createChunkKey } from '../../utilities/tagged';
import { chunkDatabase } from './chunkdb';
import { ServerChunkGenerator } from './chunkGenerator';
import { ServerConfig } from "./config";
import { HttpHandler } from './httpHandler';
import { RendererServiceClient } from './services/rendererClient';
import type { EntityData, Player, ServerEvents } from './types';
import { WebSocketHandler } from './webSocketHandler';

/***** BUN MULTIPLAYER SERVER *****/
export class BunMultiplayerServer {
  private server: any;
  private players: Map<string, Player> = new Map();
  private entities: Map<string, EntityData> = new Map();
  private port: number;
  private chunkGenerator: ServerChunkGenerator;
  private chunkRenderer: RendererServiceClient;
  private httpHandler: HttpHandler;
  private webSocketHandler: WebSocketHandler;
  private readonly chunkAbsolute: number = GameConstants.CHUNK_ABSOLUTE;

  constructor(port: number = GameConstants.DEFAULT_SERVER_PORT) {
    this.port = port;
    this.chunkGenerator = new ServerChunkGenerator(GameConstants.DEFAULT_SEED);
    this.httpHandler = new HttpHandler(this);
    this.webSocketHandler = new WebSocketHandler(this);
    this.chunkRenderer = new RendererServiceClient();
    this.setupServer();
    this.initializeServices();
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

  /***** SERVICE INITIALIZATION *****/
  private initializeServices = async (): Promise<void> => {
    try {
      logger.log('Initializing renderer service connection...');
      await this.chunkRenderer.initialize();
      logger.log('Renderer service connection established');
    } catch (error) {
      logger.log(`Warning: Renderer service unavailable: ${error}`);
      logger.log('Server will fall back to tile-based chunk rendering');
    }
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

    let totalLoadedChunks = 0;
    for (const chunkKey of newVisibleChunks) {
      if (!player.visibleChunks.has(chunkKey)) {
        const [x, y] = chunkKey.split(',').map(Number);
        totalLoadedChunks++;
        this.ensureChunkExistsAndSend(playerId, x, y)
      }
    }

    player.visibleChunks = newVisibleChunks;

    if (totalLoadedChunks) {
      logger.log(`Sent ${totalLoadedChunks} new chunks to player ${playerId} at chunk (${newChunkX}, ${newChunkY})`);
    }
  };

  private ensureChunkExistsAndSend = async (playerId: string, chunkX: number, chunkY: number): Promise<void> => {
    // For testing purposes, always use chunk (0, 0)
    chunkX = 0;
    chunkY = 0; 

    const chunkKey = createChunkKey(chunkX, chunkY);

    let chunkData = chunkDatabase.getChunk(chunkKey);
      
    if (!chunkData) {
      chunkData = this.chunkGenerator.generateChunk(chunkX, chunkY);
      chunkDatabase.storeChunk(chunkKey, chunkData);
      logger.log(`Generated and stored new chunk ${chunkKey}`);
    }

    if (ServerConfig.experimental_serverSideChunkRendering) {
      const file = `src/server/main/public/chunks/chunk_${chunkX}_${chunkY}.png`;
      const publicUrl = `http://${ServerConfig.host}:${ServerConfig.port}/public/chunks/chunk_${chunkX}_${chunkY}.png`;

      if (await Bun.file(file).exists()) {
        const loadChunkMessage: ServerEvents.LoadChunkMessage = {
          type: 'load_chunk',
          data: {
            type: 'texture',
            chunkKey: chunkData.chunkKey,
            texture: publicUrl, // Send public URL instead of file path
            entities: chunkData.entities
          }
        };
        return this.sendToPlayer(playerId, loadChunkMessage);
      }

      // file does not exist, generate texture
      const spriteData = chunkData.tiles.map((tile) => ({
        x: tile.x,
        y: tile.y,
        spriteIndex: tile.spriteIndex
      }));

      try {
        // Generate chunk texture via renderer service
        const base64Texture = await this.chunkRenderer.generateChunkTexture(spriteData);

        // Convert base64 to buffer and write to file
        const base64Data = base64Texture.replace(/^data:image\/png;base64,/, '');
        await Bun.write(file, Buffer.from(base64Data, 'base64'));
        
        const loadChunkMessage: ServerEvents.LoadChunkMessage = {
          type: "load_chunk",
          data: {
            type: "texture",
            chunkKey: chunkData.chunkKey,
            texture: publicUrl, // Send public URL instead of file path
            entities: chunkData.entities
          }
        };

        logger.log(`Sent chunk texture for ${chunkKey} to player ${playerId}`);
        return this.sendToPlayer(playerId, loadChunkMessage);
      } catch (error) {
        console.error(`Failed to generate chunk texture for ${chunkKey}:`, error);
        // continue onto fallback of tile based rendering
      }
    }
    
    const loadChunkMessage: ServerEvents.LoadChunkMessage = {
      type: 'load_chunk',
      data: {
        chunkKey: chunkData.chunkKey,
        type: "tiles",
        tiles: chunkData.tiles,
        entities: chunkData.entities
      }
    };

    return this.sendToPlayer(playerId, loadChunkMessage);
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
