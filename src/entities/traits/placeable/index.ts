/***** TYPE DEFINITIONS *****/
import type { BaseEntity } from "../../base";
import { EntityBuilder } from "../../builder";

export interface PlaceableTrait {
  isPlaced: boolean;
  place(): void;
  unplace(): void;
}

export type PlaceableOptions = {
  initiallyPlaced?: boolean;
  onPlace?: () => void;
  onUnplace?: () => void;
};

/***** PLACEABLE TRAIT *****/
export const Placeable = EntityBuilder.createTrait<
  PlaceableOptions,
  PlaceableTrait
>((entity, options = {}) => {
  const { initiallyPlaced = false, onPlace, onUnplace } = options;

  let _isPlaced = initiallyPlaced;

  // Add isPlaced property
  Object.defineProperty(entity, "isPlaced", {
    get() {
      return _isPlaced;
    },
    enumerable: true,
    configurable: true,
  });

  // Add place method
  Object.defineProperty(entity, "place", {
    value() {
      if (!_isPlaced) {
        _isPlaced = true;
        onPlace?.();
      }
    },
    writable: false,
    enumerable: true,
    configurable: false,
  });

  // Add unplace method
  Object.defineProperty(entity, "unplace", {
    value() {
      if (_isPlaced) {
        _isPlaced = false;
        onUnplace?.();
      }
    },
    writable: false,
    enumerable: true,
    configurable: false,
  });

  return entity as BaseEntity & PlaceableTrait;
});
