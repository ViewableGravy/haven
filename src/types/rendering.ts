import type { Container } from 'pixi.js';

/***** TYPE DEFINITIONS *****/

export type LayerType = 'background' | 'entity';

export type LayerManager = {
  backgroundLayer: Container;
  entityLayer: Container;
  addToLayer: (object: Container, layer: LayerType) => void;
  removeFromLayer: (object: Container) => void;
  updateEntitySorting: () => void;
};

export type LayeredEntity = Container & {
  _isLayeredEntity?: boolean;
  _currentLayer?: LayerType;
};
