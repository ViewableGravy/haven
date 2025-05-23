import type { Subscribe } from "../eventEmitter";


export type Position = {
  x: number;
  y: number;
}

export type SubscribablePosition = Position & {
  subscribe: Subscribe<Position>;
  subscribeImmediately: Subscribe<Position>;
  position: Position;
};