/***** TYPE DEFINITIONS *****/
import type { EntityData, ServerMessage } from '../../server';

export interface RemotePlayer {
  id: string;
  x: number;
  y: number;
}

export interface MultiplayerEvents {
  playerJoin: (player: RemotePlayer) => void;
  playerLeave: (playerId: string) => void;
  playerUpdate: (player: RemotePlayer) => void;
  playersUpdate: (players: RemotePlayer[]) => void;
  entityPlaced: (entity: EntityData) => void;
  entityRemoved: (entityId: string) => void;
  entitiesUpdate: (entities: EntityData[]) => void;
}

/***** MULTIPLAYER CLIENT *****/
export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private events: Partial<MultiplayerEvents> = {};
  private serverUrl: string;
  private isConnected: boolean = false;
  private reconnectInterval: number = 5000;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  constructor(serverUrl: string = 'ws://localhost:8080') {
    this.serverUrl = serverUrl;
  }

  /***** CONNECTION MANAGEMENT *****/
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);
        
        this.ws.onopen = () => {
          console.log('Connected to multiplayer server');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: ServerMessage = JSON.parse(event.data);
            this.handleServerMessage(message);
          } catch (error) {
            console.error('Error parsing server message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('Disconnected from multiplayer server');
          this.isConnected = false;
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  /***** MESSAGE HANDLING *****/
  private handleServerMessage(message: ServerMessage): void {
    switch (message.type) {
      case 'player_join':
        this.events.playerJoin?.(message.data);
        break;
      case 'player_leave':
        this.events.playerLeave?.(message.data.id);
        break;
      case 'player_update':
        this.events.playerUpdate?.(message.data);
        break;
      case 'players_list':
        this.events.playersUpdate?.(message.data.players);
        break;
      case 'entity_placed':
        this.events.entityPlaced?.(message.data);
        break;
      case 'entity_removed':
        this.events.entityRemoved?.(message.data.id);
        break;
      case 'entities_list':
        this.events.entitiesUpdate?.(message.data.entities);
        break;
      default:
        console.warn('Unknown server message type:', (message as any).type);
    }
  }

  /***** EVENT SUBSCRIPTION *****/
  public on<K extends keyof MultiplayerEvents>(event: K, callback: MultiplayerEvents[K]): void {
    this.events[event] = callback;
  }

  public off<K extends keyof MultiplayerEvents>(event: K): void {
    delete this.events[event];
  }

  /***** PLAYER ACTIONS *****/
  public sendPositionUpdate(x: number, y: number): void {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'position_update',
        data: { x, y }
      }));
    }
  }

  /***** ENTITY ACTIONS *****/
  public sendEntityPlace(type: string, x: number, y: number, chunkX: number, chunkY: number): void {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'entity_placed',
        data: { type, x, y, chunkX, chunkY }
      }));
    }
  }

  public sendEntityRemove(id: string): void {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'entity_remove',
        data: { id }
      }));
    }
  }

  /***** CONNECTION STATUS *****/
  public getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /***** RECONNECTION LOGIC *****/
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(() => {
        // Reconnection failed, will try again
      });
    }, this.reconnectInterval);
  }
}