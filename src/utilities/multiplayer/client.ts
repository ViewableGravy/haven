/***** TYPE DEFINITIONS *****/
import type { EntityData, ServerEvents } from "../../server/types";
import type { LoadChunkEvent } from "../../server/types/events/load_chunk";
import { logger } from "../logger";

export interface RemotePlayer {
  id: string;
  x: number;
  y: number;
}

export type CreateMultiplayerEvents<T extends Record<ServerEvents.ServerMessageType, (data: any) => void>> = T
export type MultiplayerEvents = CreateMultiplayerEvents<{
  player_join: (data: RemotePlayer) => void;
  player_leave: (data: { id: string }) => void;
  player_update: (data: RemotePlayer) => void;
  players_list: (data: { players: RemotePlayer[] }) => void;
  entity_placed: (data: EntityData) => void;
  entity_removed: (data: { id: string }) => void;
  entities_list: (data: { entities: EntityData[] }) => void;
  load_chunk: (data: LoadChunkEvent.LoadChunkData) => void;
  chunk_data: (data: any) => void; // Added for server chunk data
}>

/***** MULTIPLAYER CLIENT *****/
export class MultiplayerClient {
  private ws: WebSocket | null = null;
  private events: Partial<MultiplayerEvents> = {};
  private serverUrl: string;
  private isConnected: boolean = false;
  private reconnectInterval: number = 5000;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;

  constructor(serverUrl: string = 'ws://localhost:8081') {
    this.serverUrl = serverUrl;
  }

  /***** CONNECTION MANAGEMENT *****/
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.serverUrl);
        
        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: ServerEvents.ServerMessage = JSON.parse(event.data);
            this.handleServerMessage(message);
          } catch (error) {
            console.error('Error parsing server message:', error);
          }
        };

        this.ws.onclose = () => {
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
    
    // Clear all event handlers to prevent memory leaks
    this.events = {};
  }

  /***** MESSAGE HANDLING *****/
  private handleServerMessage(message: ServerEvents.ServerMessage): void {
    const handler = this.events[message.type as keyof MultiplayerEvents];
    if (handler) {
      handler(message.data as any);
    } else {
      console.warn('Unknown server message type:', message.type);
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
    logger.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch(() => {
        // Reconnection failed, will try again
      });
    }, this.reconnectInterval);
  }
}