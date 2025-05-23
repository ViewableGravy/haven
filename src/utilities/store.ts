import type { TestEntity } from "../entities/test";


type GlobalStore = {
  consts: {
    tileSize: number;
    chunkSize: number;
    chunkAbsolute: number;
  },
  // Change to better spatial querying structure in the future
  entities: Array<TestEntity>;
}

export const store: GlobalStore = {
  consts: {
    tileSize: 64,
    chunkSize: 16,
    get chunkAbsolute() { return this.tileSize * this.chunkSize; }
  },
  entities: []
}
