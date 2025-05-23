
/***** CHUNK LOADER META *****/
type ChunkLoaderMetaOptions = {
  loadRadius?: number | { x: number; y: number };
  seed?: string;
  debug?: boolean;
}

export class ChunkManagerMeta {
  SCALE: number = 1;
  LOAD_RADIUS: { x: number; y: number };
  SEED: string = 'chunk';
  DEBUG: boolean = false;

  constructor(opts?: ChunkLoaderMetaOptions) {
    this.LOAD_RADIUS = {
      x: this.getLoadRadiusX(opts?.loadRadius),
      y: this.getLoadRadiusY(opts?.loadRadius)
    }
    this.SEED = opts?.seed ?? this.SEED;
    this.DEBUG = opts?.debug ?? this.DEBUG;
  }

  private getLoadRadiusX = (val?: number | { x: number; y: number }) => typeof val === 'number' ? val : val?.x ?? 2;
  private getLoadRadiusY = (val?: number | { x: number; y: number }) => typeof val === 'number' ? val : val?.y ?? 2;
}