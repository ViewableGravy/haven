

type GlobalStore = {
  consts: {
    tileSize: number;
    chunkSize: number;
    chunkAbsolute: number;
  }
}

export const store: GlobalStore = {
  consts: {
    tileSize: 64,
    chunkSize: 16,
    get chunkAbsolute() { return this.tileSize * this.chunkSize; }
  }
}
