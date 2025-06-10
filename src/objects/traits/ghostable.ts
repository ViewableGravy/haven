/***** TYPE DEFINITIONS *****/
import type { GameObject } from "../base";
import { ContainerTrait } from "./container";

/***** GHOSTABLE TRAIT *****/
export class GhostableTrait {
  private _ghostMode: boolean;
  private ghostAlpha: number;
  private normalAlpha: number;
  private entity: GameObject;

  constructor(entity: GameObject, initialGhostMode = false, ghostAlpha = 0.7, normalAlpha = 1.0) {
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
    if (ContainerTrait.is(this.entity)) {
      this.entity.getTrait('container').container.alpha = value ? this.ghostAlpha : this.normalAlpha;
    }
  }

  /***** STATIC METHODS *****/
  static is(entity: GameObject): entity is GameObject {
    try {
      entity.getTrait('ghostable');
      return true;
    } catch {
      return false;
    }
  }

  static setGhostMode(entity: GameObject, ghostMode: boolean): void {
    if (GhostableTrait.is(entity)) {
      entity.getTrait('ghostable').ghostMode = ghostMode;
    }
  }

  static getGhostMode(entity: GameObject): boolean {
    if (GhostableTrait.is(entity)) {
      return entity.getTrait('ghostable').ghostMode;
    }
    return false;
  }
}