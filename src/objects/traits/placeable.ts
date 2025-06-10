/***** TYPE DEFINITIONS *****/
import type { GameObject } from "../base";

export interface IPlaceableTrait {
  isPlaced: boolean;
  place(): void;
  unplace(): void;
}

interface HasPlaceableTrait {
  placeableTrait: PlaceableTrait;
}

/***** PLACEABLE TRAIT *****/
export class PlaceableTrait {
  private _isPlaced: boolean;
  private onPlaceCallback?: () => void;
  private onUnplaceCallback?: () => void;

  constructor(_entity: GameObject, initiallyPlaced = false, onPlace?: () => void, onUnplace?: () => void) {
    this._isPlaced = initiallyPlaced;
    this.onPlaceCallback = onPlace;
    this.onUnplaceCallback = onUnplace;
  }

  get isPlaced(): boolean {
    return this._isPlaced;
  }

  place(): void {
    if (!this._isPlaced) {
      this._isPlaced = true;
      this.onPlaceCallback?.();
    }
  }

  unplace(): void {
    if (this._isPlaced) {
      this._isPlaced = false;
      this.onUnplaceCallback?.();
    }
  }

  /***** STATIC METHODS *****/
  static is(entity: GameObject): entity is GameObject & HasPlaceableTrait {
    return 'placeableTrait' in entity && entity.placeableTrait instanceof PlaceableTrait;
  }

  static place(entity: GameObject): void {
    if (PlaceableTrait.is(entity)) {
      entity.placeableTrait.place();
    }
  }

  static unplace(entity: GameObject): void {
    if (PlaceableTrait.is(entity)) {
      entity.placeableTrait.unplace();
    }
  }

  static isPlaced(entity: GameObject): boolean {
    if (PlaceableTrait.is(entity)) {
      return entity.placeableTrait.isPlaced;
    }
    return false;
  }
}