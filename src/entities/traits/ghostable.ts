/***** TYPE DEFINITIONS *****/
import type { BaseEntity } from "../base";

interface HasGhostableTrait {
  ghostableTrait: GhostableTrait;
}

/***** GHOSTABLE TRAIT *****/
export class GhostableTrait {
  private _ghostMode: boolean;
  private ghostAlpha: number;
  private normalAlpha: number;
  private entity: BaseEntity;

  constructor(entity: BaseEntity, initialGhostMode = false, ghostAlpha = 0.7, normalAlpha = 1.0) {
    this.entity = entity;
    this._ghostMode = initialGhostMode;
    this.ghostAlpha = ghostAlpha;
    this.normalAlpha = normalAlpha;
  }

  get ghostMode(): boolean {
    return this._ghostMode;
  }

  set ghostMode(value: boolean) {
    this._ghostMode = value;
    // Apply visual changes if entity has a container
    if ('containerTrait' in this.entity && (this.entity as any).containerTrait) {
      (this.entity as any).containerTrait.container.alpha = value ? this.ghostAlpha : this.normalAlpha;
    }
  }

  /***** STATIC METHODS *****/
  static is(entity: BaseEntity): entity is BaseEntity & HasGhostableTrait {
    return 'ghostableTrait' in entity && entity.ghostableTrait instanceof GhostableTrait;
  }

  static setGhostMode(entity: BaseEntity, ghostMode: boolean): void {
    if (GhostableTrait.is(entity)) {
      entity.ghostableTrait.ghostMode = ghostMode;
    }
  }

  static getGhostMode(entity: BaseEntity): boolean {
    if (GhostableTrait.is(entity)) {
      return entity.ghostableTrait.ghostMode;
    }
    return false;
  }
}