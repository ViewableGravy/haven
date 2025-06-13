/***** TYPE DEFINITIONS *****/
import { v4 as uuidv4 } from 'uuid';
import { hasContainer, hasPosition, hasRectangle, hasSize, type HasContainer, type HasPosition, type HasRectangle } from "./interfaces";
import { Traitable } from './traits';

export interface EntityMeta {
  name: string;
  meta?: { [key: string]: string };
}

/***** BASE ENTITY CLASS *****/
export class GameObject extends Traitable {
  public readonly uid: string;
  public readonly entityMeta: EntityMeta;
  
  // Multiplayer properties
  public multiplayerId?: string; // Server-assigned ID for remote entities
  public placedBy?: string; // Player ID who placed this entity
  public isRemoteEntity: boolean = false; // True if entity came from server
  
  constructor(entityMeta: EntityMeta) {
    super();
    this.entityMeta = entityMeta;
    this.uid = this.generateUID(entityMeta);
  }

  /***** UID GENERATION *****/
  private generateUID(entityMeta: EntityMeta): string {
    const uuid = uuidv4();
    const baseName = `${entityMeta.name}-${uuid}`;
    
    if (!entityMeta.meta || Object.keys(entityMeta.meta).length === 0) {
      return baseName;
    }
    
    // Append meta properties as key-value pairs
    const metaPairs = Object.entries(entityMeta.meta)
      .map(([key, value]) => `${key}-${value}`)
      .join('-');
    
    return `${baseName}-${metaPairs}`;
  }

  /***** MULTIPLAYER METHODS *****/
  public setAsRemoteEntity(multiplayerId: string, placedBy?: string): void {
    this.multiplayerId = multiplayerId;
    this.placedBy = placedBy;
    this.isRemoteEntity = true;
  }

  public getMultiplayerId(): string {
    // Use multiplayer ID if available, otherwise use local UID
    return this.multiplayerId || this.uid;
  }

  /***** TYPE IDENTIFICATION *****/
  public getEntityType(): string {
    return this.entityMeta.name;
  }

  /***** INTERFACE CHECKS *****/
  public hasContainer = (): this is HasContainer => hasContainer(this);
  public hasPosition = (): this is HasPosition => hasPosition(this);
  public hasSize = (): this is hasSize => hasSize(this);
  public hasRectangle = (): this is HasRectangle => hasRectangle(this);

  /***** CLEANUP *****/
  /**
   * Generic destroy method that cleans up all traits
   * This should be called when an entity is being removed from the game
   */
  public destroy(): void {
    this.cleanupTraits();
  }
}