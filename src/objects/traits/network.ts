/***** IMPORTS *****/
import type { TraitNames } from "objects/traits/types";
import { Game } from "../../utilities/game/game";
import { GameObject } from "../base";

/***** TYPE DEFINITIONS *****/
export type NetworkSyncConfig = {
  /** Which traits should be synchronized with the server */
  syncTraits: Array<TraitNames>;
  /** How frequently to sync data */
  syncFrequency?: 'immediate' | 'batched';
  /** Priority for network operations */
  priority?: 'high' | 'normal' | 'low';
  /** Whether this entity should persist on the server */
  persistent?: boolean;
};

/***** NETWORK TRAIT *****/
/**
 * NetworkTrait is responsible for managing network synchronization of game entities.
 * It automatically registers the entity with the EntityManager and sets up synchronization
 * for specified traits based on the provided NetworkSyncConfig.
 * 
 * This trait does not sync on first creation, but rather sets up the necessary
 * infrastructure to sync changes to the server when the entity is modified.
 */
export class NetworkTrait {
  private entity: GameObject;
  private game: Game;
  private syncConfig: NetworkSyncConfig;
  private isRegistered: boolean = false;

  constructor(entity: GameObject, game: Game, syncConfig: NetworkSyncConfig) {
    this.entity = entity;
    this.game = game;
    this.syncConfig = syncConfig;
    
    // Auto-register with EntityManager and setup network sync (async)
    this.initialize().catch(error => {
      console.error('NetworkTrait initialization failed:', error);
    });
  }

  /***** INITIALIZATION *****/
  private async initialize(): Promise<void> {
    // Register entity with EntityManager automatically
    this.game.entityManager.addEntity(this.entity);
    this.isRegistered = true;

    // Register the destroy callback
    this.game.entityManager.onEntityDestroy(this.entity, this.destroy);

    // Setup network synchronization for specified traits
    await this.setupNetworkSync();
  }
  /***** NETWORK SYNCHRONIZATION *****/
  private async setupNetworkSync(): Promise<void> {
    // Setup trait synchronization based on config
    this.setupTraitSync();
  }

  private shouldSyncTraitChanges(): boolean {
    // For trait changes, we always want to sync back to server if connected
    // (even for server entities, since local changes should be synced)
    return this.game.controllers.multiplayer?.isConnected() ?? false;
  }

  private setupTraitSync(): void {
    // For each trait specified in syncConfig, setup synchronization
    for (const traitName of this.syncConfig.syncTraits) {
      try {
        // Check if trait exists (we need to cast because syncTraits contains strings)
        const trait = this.entity.getTrait(traitName);
        // Setup trait-specific sync logic here
        this.setupTraitWatcher(traitName, trait);
      } catch (error) {
        console.warn(`NetworkTrait: Entity ${this.entity.uid} does not have trait '${traitName}' for sync`);
      }
    }
  }  
  
  private setupTraitWatcher(_traitName: string, _trait: any): void {
    // For now, we'll implement basic trait watching
    // In a full implementation, this would watch for changes and sync them
    
    if (!this.shouldSyncTraitChanges()) {
      return;
    }

    // This should ultimately create a proxy or observer around the trait that we can use to detect changes.
    // Alternatively, all traits might need to implement a changeDetection interface so that we can easily hook into changes.
    switch (this.syncConfig.syncFrequency) {
      case 'immediate':
        // Setup immediate sync on trait changes
        // TODO: Implement immediate trait change detection and sync
        break;
      case 'batched':
      default:
        // Setup batched sync (default)
        // TODO: Implement batched trait change detection and sync
        break;
    }
  }

  /***** DESTROY HANDLING *****/
  private notifyServerEntityRemoved(): void {
    // If this entity has a multiplayer ID, notify server to remove it
    const multiplayerId = this.entity.getMultiplayerId();
    if (multiplayerId && this.game.controllers.multiplayer?.isConnected()) {
      this.game.controllers.multiplayer.client.sendEntityRemove?.(multiplayerId);
    }
  }  
  
  /***** TRAIT CLEANUP *****/
  public destroy = (notifyServer: boolean = true): void => {
    if (notifyServer) {
      this.notifyServerEntityRemoved();
    }

    this.isRegistered = false;
  }

  /***** CONFIGURATION METHODS *****/
  public updateSyncConfig(newConfig: Partial<NetworkSyncConfig>): void {
    this.syncConfig = { ...this.syncConfig, ...newConfig };

    // Re-setup sync with new configuration
    this.setupTraitSync();
  }

  public getSyncConfig(): NetworkSyncConfig {
    return { ...this.syncConfig };
  }

  public isNetworkEnabled(): boolean {
    return this.isRegistered && (this.game.controllers.multiplayer?.isConnected() ?? false);
  }

  /***** STATIC METHODS *****/
  static is(entity: GameObject): boolean {
    try {
      entity.getTrait('network');
      return true;
    } catch {
      return false;
    }
  }

  static updateSyncConfig(entity: GameObject, config: Partial<NetworkSyncConfig>): void {
    if (NetworkTrait.is(entity)) {
      entity.getTrait('network').updateSyncConfig(config);
    }
  }

  static getSyncConfig(entity: GameObject): NetworkSyncConfig | null {
    if (NetworkTrait.is(entity)) {
      return entity.getTrait('network').getSyncConfig();
    }
    return null;
  }

  static isNetworkEnabled(entity: GameObject): boolean {
    if (NetworkTrait.is(entity)) {
      return entity.getTrait('network').isNetworkEnabled();
    }
    return false;
  }
}
