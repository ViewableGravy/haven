/***** TYPE DEFINITIONS *****/
import type { EntityData } from "../../server/main/types";
import type { Game } from "../game/game";
import type { Player } from "../player";
import { MultiplayerClient, type RemotePlayer as RemotePlayerData } from "./client";
import { EntitySyncManager } from "./entitySync";
import { EntitiesListHandler } from "./events/entities_list";
import { EntityPlacedHandler } from "./events/entity_placed";
import { EntityRemovedHandler } from "./events/entity_removed";
import { RemoteChunkLoadHandler } from "./events/load_chunk";
import { PlayerJoinHandler } from "./events/player_join";
import { PlayerLeaveHandler } from "./events/player_leave";
import { PlayerUpdateHandler } from "./events/player_update";
import { PlayersListHandler } from "./events/players_list";
import { RemotePlayer } from "./remotePlayer";

/***** MULTIPLAYER MANAGER *****/
export class MultiplayerManager {
  public client: MultiplayerClient;
  public game: Game;
  public localPlayer: Player;
  public remotePlayers: Map<string, RemotePlayer> = new Map();
  public entitySync: EntitySyncManager;

  // Event Handlers
  private remoteChunkLoadHandler: RemoteChunkLoadHandler;
  private playerJoinHandler: PlayerJoinHandler;
  private playerLeaveHandler: PlayerLeaveHandler;
  private playerUpdateHandler: PlayerUpdateHandler;
  private playersListHandler: PlayersListHandler;
  private entityPlacedHandler: EntityPlacedHandler;
  private entityRemovedHandler: EntityRemovedHandler;
  private entitiesListHandler: EntitiesListHandler;

  constructor(game: Game, localPlayer: Player, serverUrl?: string) {
    this.game = game;
    this.localPlayer = localPlayer;
    this.client = new MultiplayerClient(serverUrl);
    this.entitySync = new EntitySyncManager(game);
    this.setupEventHandlers();

    // Initialize handlers
    this.remoteChunkLoadHandler = new RemoteChunkLoadHandler(this);
    this.playerJoinHandler = new PlayerJoinHandler(this);
    this.playerLeaveHandler = new PlayerLeaveHandler(this);
    this.playerUpdateHandler = new PlayerUpdateHandler(this);
    this.playersListHandler = new PlayersListHandler(this);
    this.entityPlacedHandler = new EntityPlacedHandler(this);
    this.entityRemovedHandler = new EntityRemovedHandler(this);
    this.entitiesListHandler = new EntitiesListHandler(this);
  }

  /***** INITIALIZATION *****/
  public async initialize(): Promise<void> {
    try {
      await this.client.connect();
      
      // Initialize entity sync after connection is established
      this.entitySync.initialize();
      
      // Set the multiplayer client on the player for position updates
      this.localPlayer.setMultiplayerClient(this.client);
    } catch (error) {
      console.error('Failed to initialize multiplayer:', error);
      throw error;
    }
  }

  /***** EVENT HANDLING *****/
  private setupEventHandlers(): void {
    this.client.on('player_join', (data: RemotePlayerData) => {
      this.playerJoinHandler.handleEvent(data);
    });

    this.client.on('player_leave', (data: { id: string }) => {
      this.playerLeaveHandler.handleEvent(data);
    });

    this.client.on('player_update', (data: RemotePlayerData) => {
      this.playerUpdateHandler.handleEvent(data);
    });

    this.client.on('players_list', (data: { players: RemotePlayerData[] }) => {
      this.playersListHandler.handleEvent(data);
    });

    // Entity synchronization events
    this.client.on('entity_placed', (data: EntityData) => {
      this.entityPlacedHandler.handleEvent(data);
    });

    this.client.on('entity_removed', (data: { id: string }) => {
      this.entityRemovedHandler.handleEvent(data);
    });

    this.client.on('entities_list', (data: { entities: EntityData[] }) => {
      this.entitiesListHandler.handleEvent(data);
    });

    this.client.on('load_chunk', async (data) => {
      await this.remoteChunkLoadHandler.handleEvent(data);
    });
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
    // Remove multiplayer client from player
    this.localPlayer.setMultiplayerClient(null);
    
    // Clean up all remote players
    this.remotePlayers.forEach((player) => player.destroy());
    this.remotePlayers.clear();
    
    // Clean up entity sync
    this.entitySync.destroy();
    
    // Disconnect from server
    this.client.disconnect();
  }

  public destroy(): void {
    // Remove multiplayer client from player
    this.localPlayer.setMultiplayerClient(null);
    
    // Clean up all remote players
    this.remotePlayers.forEach((player) => player.destroy());
    this.remotePlayers.clear();
    
    // Clean up entity sync
    this.entitySync.destroy();
    
    // Disconnect from server
    this.client.disconnect();
  }
}