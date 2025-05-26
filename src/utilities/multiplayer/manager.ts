/***** TYPE DEFINITIONS *****/
import type { EntityData } from "../../server";
import type { Game } from "../game/game";
import type { Player } from "../player";
import { MultiplayerClient, type RemotePlayer as RemotePlayerData } from "./client";
import { EntitySyncManager } from "./entitySync";
import { RemotePlayer } from "./remotePlayer";

/***** MULTIPLAYER MANAGER *****/
export class MultiplayerManager {
  private client: MultiplayerClient;
  private game: Game;
  private localPlayer: Player;
  private remotePlayers: Map<string, RemotePlayer> = new Map();
  private entitySync: EntitySyncManager;
  private positionUpdateThrottle: number = 50; // ms
  private lastPositionUpdate: number = 0;

  constructor(game: Game, localPlayer: Player, serverUrl?: string) {
    this.game = game;
    this.localPlayer = localPlayer;
    this.client = new MultiplayerClient(serverUrl);
    this.entitySync = new EntitySyncManager(game);
    this.setupEventHandlers();
  }

  /***** INITIALIZATION *****/
  public async initialize(): Promise<void> {
    try {
      await this.client.connect();
      
      // Initialize entity sync after connection is established
      this.entitySync.initialize();
      
      this.startPositionUpdates();
      this.setupEntityPlacementListener();
    } catch (error) {
      console.error('Failed to initialize multiplayer:', error);
      throw error;
    }
  }

  /***** EVENT HANDLING *****/
  private setupEventHandlers(): void {
    this.client.on('player_join', (data: RemotePlayerData) => {
      this.addRemotePlayer(data);
    });

    this.client.on('player_leave', (data: { id: string }) => {
      this.removeRemotePlayer(data.id);
    });

    this.client.on('player_update', (data: RemotePlayerData) => {
      this.updateRemotePlayer(data);
    });

    this.client.on('players_list', (data: { players: RemotePlayerData[] }) => {
      data.players.forEach(playerData => this.addRemotePlayer(playerData));
    });

    // Entity synchronization events
    this.client.on('entity_placed', (data: EntityData) => {
      this.entitySync.handleRemoteEntityPlaced(data);
    });

    this.client.on('entity_removed', (data: { id: string }) => {
      this.entitySync.handleRemoteEntityRemoved(data.id);
    });

    this.client.on('entities_list', (data: { entities: EntityData[] }) => {
      this.entitySync.syncExistingEntities(data.entities);
    });
  }

  /***** ENTITY PLACEMENT LISTENER *****/
  private setupEntityPlacementListener(): void {
    // Listen to entity placement events from EntityManager
    this.game.entityManager.onEntityPlacement((event) => {
      // Only sync locally placed entities (not remote ones)
      if (!(event.entity as any).multiplayerId) {
        this.client.sendEntityPlace(
          event.entityType,
          event.globalPosition.x,
          event.globalPosition.y,
          event.chunkX,
          event.chunkY
        );
      }
    });
  }

  /***** REMOTE PLAYER MANAGEMENT *****/
  private addRemotePlayer(playerData: RemotePlayerData): void {
    if (this.remotePlayers.has(playerData.id)) {
      return; // Player already exists
    }

    const remotePlayer = new RemotePlayer(
      playerData.id,
      playerData.x,
      playerData.y,
      this.game
    );

    this.remotePlayers.set(playerData.id, remotePlayer);
  }

  private removeRemotePlayer(playerId: string): void {
    const remotePlayer = this.remotePlayers.get(playerId);
    if (remotePlayer) {
      remotePlayer.destroy();
      this.remotePlayers.delete(playerId);
    }
  }

  private updateRemotePlayer(playerData: RemotePlayerData): void {
    const remotePlayer = this.remotePlayers.get(playerData.id);
    if (remotePlayer) {
      remotePlayer.updatePosition(playerData.x, playerData.y);
    }
  }

  /***** POSITION UPDATES *****/
  private startPositionUpdates(): void {
    // Subscribe to local player position changes
    this.localPlayer.position.subscribe(({ x, y }) => {
      this.throttledPositionUpdate(x, y);
    });
  }

  private throttledPositionUpdate(x: number, y: number): void {
    const now = Date.now();
    if (now - this.lastPositionUpdate >= this.positionUpdateThrottle) {
      this.client.sendPositionUpdate(x, y);
      this.lastPositionUpdate = now;
    }
  }

  /***** STATUS AND CLEANUP *****/
  public isConnected(): boolean {
    return this.client.getConnectionStatus();
  }

  public getRemotePlayerCount(): number {
    return this.remotePlayers.size;
  }

  public getRemoteEntityCount(): number {
    return this.entitySync.getRemoteEntityCount();
  }

  public disconnect(): void {
    // Clean up all remote players
    this.remotePlayers.forEach(player => player.destroy());
    this.remotePlayers.clear();
    
    // Clean up entity sync
    this.entitySync.destroy();
    
    // Disconnect from server
    this.client.disconnect();
  }

  public destroy(): void {
    this.disconnect();
  }
}