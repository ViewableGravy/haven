/***** TYPE DEFINITIONS *****/
import type { BaseEntity } from "../../base";
import { EntityBuilder } from "../../builder";

export interface GhostableTrait {
  ghostMode: boolean;
}

export type GhostableOptions = {
  initialGhostMode?: boolean;
  ghostAlpha?: number;
  normalAlpha?: number;
};

/***** GHOSTABLE TRAIT *****/
export const Ghostable = EntityBuilder.createTrait<GhostableOptions, GhostableTrait>(
  (entity, options = {}) => {
    const { 
      initialGhostMode = false, 
      ghostAlpha = 0.7, 
      normalAlpha = 1.0
    } = options;

    let _ghostMode = initialGhostMode;

    // Add the ghostMode property
    Object.defineProperty(entity, 'ghostMode', {
      get() { return _ghostMode; },
      set(value: boolean) {
        _ghostMode = value;
        // Apply visual changes if entity has a container
        if ('container' in entity && entity.container) {
          (entity.container as any).alpha = value ? ghostAlpha : normalAlpha;
        }
      }
    });

    // Set initial ghost mode
    (entity as any).ghostMode = initialGhostMode;

    return entity as BaseEntity & GhostableTrait;
  }
);