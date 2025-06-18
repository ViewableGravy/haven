import { Container } from 'pixi.js';
import type { Game } from './game';

/***** TYPE DEFINITIONS *****/
export type LayerType = 'background' | 'entity';

export type LayeredEntity = Container & {
  _isLayeredEntity?: boolean;
  _currentLayer?: LayerType;
};

/***** LAYER MANAGER CLASS *****/
export class LayerManager {
  private game: Game;
  private backgroundLayer: Container | null = null;
  private entityLayer: Container | null = null;
  private initialized: boolean = false;

  constructor(game: Game) {
    this.game = game;
  }

  /***** INITIALIZATION *****/
  /**
   * Initialize the layer system with background and entity layers
   * This should be called after the world container is created
   */
  public initialize(): void {
    if (this.initialized) {
      return; // Already initialized
    }
    
    this.backgroundLayer = new Container();
    this.entityLayer = new Container();
    
    this.backgroundLayer.zIndex = -10;
    this.entityLayer.zIndex = 0;
    
    // Add layers to the world container so they inherit zoom transforms
    this.game.world.addChild(this.backgroundLayer);
    this.game.world.addChild(this.entityLayer);
    
    // Enable sorting for the world container and entity layer
    this.game.world.sortableChildren = true;
    this.entityLayer.sortableChildren = true;
    
    this.initialized = true;
  }

  /***** LAYER ACCESS *****/
  /**
   * Get the background layer container
   */
  public getBackgroundLayer(): Container {
    this.ensureInitialized();
    return this.backgroundLayer!;
  }

  /**
   * Get the entity layer container
   */
  public getEntityLayer(): Container {
    this.ensureInitialized();
    return this.entityLayer!;
  }

  /***** LAYER OPERATIONS *****/
  /**
   * Add an object to a specific layer
   */
  public addToLayer(object: Container, layer: LayerType): void {
    this.ensureInitialized();
    
    const layeredObject = object as LayeredEntity;
    
    // Remove from current layer if any
    if (layeredObject._currentLayer) {
      this.removeFromLayer(object);
    }
    
    // Add to appropriate layer
    if (layer === 'background') {
      this.backgroundLayer!.addChild(object);
    } else {
      layeredObject._isLayeredEntity = true;
      this.entityLayer!.addChild(object);
      this.updateEntitySorting();
    }
    
    layeredObject._currentLayer = layer;
  }

  /**
   * Remove an object from its current layer
   */
  public removeFromLayer(object: Container): void {
    this.ensureInitialized();
    
    const layeredObject = object as LayeredEntity;
    
    if (layeredObject._currentLayer === 'background') {
      this.backgroundLayer!.removeChild(object);
    } else if (layeredObject._currentLayer === 'entity') {
      this.entityLayer!.removeChild(object);
      layeredObject._isLayeredEntity = false;
    }
    
    layeredObject._currentLayer = undefined;
  }

  /***** ENTITY SORTING *****/
  /**
   * Update entity sorting based on y-position for proper depth perception
   */
  public updateEntitySorting(): void {
    this.ensureInitialized();
    
    // Sort entities by y-position for proper depth perception
    const entities = this.entityLayer!.children as Array<LayeredEntity>;
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      if (entity._isLayeredEntity) {
        // Use y-position for z-index, with small offset to maintain stable sorting
        entity.zIndex = entity.y + (i * 0.001);
      }
    }
  }

  /***** CLEANUP *****/
  /**
   * Destroy the layer manager and clean up resources
   */
  public destroy(): void {
    if (!this.initialized) {
      return;
    }

    // Remove layers from world container
    if (this.backgroundLayer && this.game.world.children.includes(this.backgroundLayer)) {
      this.game.world.removeChild(this.backgroundLayer);
    }
    
    if (this.entityLayer && this.game.world.children.includes(this.entityLayer)) {
      this.game.world.removeChild(this.entityLayer);
    }

    // Destroy layer containers
    this.backgroundLayer?.destroy({ children: true });
    this.entityLayer?.destroy({ children: true });

    this.backgroundLayer = null;
    this.entityLayer = null;
    this.initialized = false;
  }

  /***** UTILITY METHODS *****/
  /**
   * Check if the layer manager is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get the current layer of an object
   */
  public getObjectLayer(object: Container): LayerType | undefined {
    const layeredObject = object as LayeredEntity;
    return layeredObject._currentLayer;
  }

  /**
   * Get all objects in a specific layer
   */
  public getObjectsInLayer(layer: LayerType): Array<Container> {
    this.ensureInitialized();
    
    if (layer === 'background') {
      return [...this.backgroundLayer!.children];
    } else {
      return [...this.entityLayer!.children];
    }
  }

  /***** PRIVATE METHODS *****/
  /**
   * Ensure the layer manager is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('LayerManager not initialized. Call initialize() first.');
    }
  }
}
