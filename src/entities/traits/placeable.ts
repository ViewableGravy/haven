/***** TYPE DEFINITIONS *****/
import type { BaseEntity } from "../base";

export interface IPlaceableTrait {
  isPlaced: boolean;
  place(): void;
  unplace(): void;
}

/***** PLACEABLE TRAIT *****/
export class PlaceableTrait {
  private _isPlaced: boolean;
  private onPlaceCallback?: () => void;
  private onUnplaceCallback?: () => void;

  constructor(_entity: BaseEntity, initiallyPlaced = false, onPlace?: () => void, onUnplace?: () => void) {
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
}