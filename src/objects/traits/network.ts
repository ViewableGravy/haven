/***** IMPORTS *****/
import { Game } from "../../utilities/game/game";
import { GameObject } from "../base";

/***** TYPE DEFINITIONS *****/
export type NetworkSyncConfig = {
  /** Which traits should be synchronized with the server */
  syncTraits: Array<string>;
  /** How frequently to sync data */
  syncFrequency?: 'immediate' | 'batched';
  /** Priority for network operations */
  priority?: 'high' | 'normal' | 'low';
  /** Whether this entity should persist on the server */
  persistent?: boolean;
};

/***** NETWORK TRAIT *****/
export class NetworkTrait {
  private entity: GameObject;
  private game: Game;
  private syncConfig: NetworkSyncConfig;
  private destroyCleanup?: () => void;
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

    // Setup onDestroy callback with EntityManager
    this.destroyCleanup = () => {
      this.handleEntityDestroy();
    };

    // Register the destroy callback
    this.game.entityManager.onEntityDestroy(this.entity, this.destroyCleanup);

    // Setup network synchronization for specified traits
    await this.setupNetworkSync();
  }
  /***** NETWORK SYNCHRONIZATION *****/
  private async setupNetworkSync(): Promise<void> {
    // Setup trait synchronization based on config
    this.setupTraitSync();
    
    // NetworkTrait ONLY handles trait synchronization, never entity creation
    // Entity creation sync is handled by the factory methods that create networked entities
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
        const trait = this.entity.getTrait(traitName as keyof import('./types').Traits);
        // Setup trait-specific sync logic here
        this.setupTraitWatcher(traitName, trait);
      } catch (error) {
        console.warn(`NetworkTrait: Entity ${this.entity.uid} does not have trait '${traitName}' for sync`);
      }
    }
  }  private setupTraitWatcher(_traitName: string, _trait: any): void {
    // For now, we'll implement basic trait watching
    // In a full implementation, this would watch for changes and sync them
    
    if (!this.shouldSyncTraitChanges()) {
      return;
    }

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
  private handleEntityDestroy(): void {
    if (!this.isRegistered) return;

    // Notify server to remove this entity
    this.notifyServerEntityRemoved();

    // Clean up local references
    this.isRegistered = false;
  }

  private notifyServerEntityRemoved(): void {
    // If this entity has a multiplayer ID, notify server to remove it
    const multiplayerId = this.entity.getMultiplayerId();
    if (multiplayerId && this.game.controllers.multiplayer?.isConnected()) {
      this.game.controllers.multiplayer.client.sendEntityRemove?.(multiplayerId);
    }
  }

  /***** TRAIT CLEANUP *****/
  public destroy(): void {
    // This is called when the trait itself is being destroyed
    if (this.destroyCleanup) {
      this.destroyCleanup();
    }
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
