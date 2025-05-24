import { noiseSeed, noise as perlinNoise } from "@chriscourses/perlin-noise";

export interface ChunkWorkerMessage {
  type: 'generateBackground' | 'setSeed';
  data: {
    chunkX?: number;
    chunkY?: number;
    tileSize?: number;
    chunkSize?: number;
    noiseDivisor?: number;
    seed?: string | number;
  };
}

export interface ChunkWorkerResponse {
  type: 'backgroundGenerated' | 'seedSet';
  data: {
    chunkX?: number;
    chunkY?: number;
    tiles?: Array<{
      x: number;
      y: number;
      tint: number;
    }>;
    success?: boolean;
  };
}

// Set up the worker with a default seed - this will be overridden when the worker receives a setSeed message
let isSeeded = false;

// Handle messages from the main thread
self.onmessage = (event: MessageEvent<ChunkWorkerMessage>) => {
  const { type, data } = event.data;

  if (type === 'setSeed') {
    const seedValue = typeof data.seed === 'string' ? stringToNumber(data.seed) : (data.seed || 0);
    noiseSeed(seedValue);
    isSeeded = true;
    
    const response: ChunkWorkerResponse = {
      type: 'seedSet',
      data: { success: true }
    };
    
    self.postMessage(response);
    return;
  }

  if (type === 'generateBackground') {
    // Ensure we have a seed set before generating
    if (!isSeeded) {
      console.warn('Worker generating background without seed - using default');
      noiseSeed(0);
      isSeeded = true;
    }

    const { chunkX, chunkY, tileSize, chunkSize, noiseDivisor } = data;
    
    if (chunkX === undefined || chunkY === undefined || !tileSize || !chunkSize || !noiseDivisor) {
      console.error('Missing required parameters for background generation');
      return;
    }

    const size = chunkSize * tileSize;
    const tiles: Array<{ x: number; y: number; tint: number }> = [];

    // Generate tiles for this chunk
    for (let i = 0; i < chunkSize; i++) {
      for (let j = 0; j < chunkSize; j++) {
        const x = tileSize * i;
        const y = tileSize * j;

        const xOffset = (chunkX * size) + x;
        const yOffset = (chunkY * size) + y;
        const tint = Number(seedShade(xOffset / noiseDivisor, yOffset / noiseDivisor));

        tiles.push({ x, y, tint });
      }
    }

    // Send the result back to the main thread
    const response: ChunkWorkerResponse = {
      type: 'backgroundGenerated',
      data: {
        chunkX,
        chunkY,
        tiles
      }
    };

    self.postMessage(response);
  }
};

function seedShade(x: number, y: number): string {
  // 0-1
  const _x: number = perlinNoise(x, y);
  // convert to 0-255
  const color: number = Math.floor(_x * 224);
  // convert to hex
  const hex: string = color.toString(16).padStart(2, '0').toUpperCase();

  return `0x${hex}${hex}${hex}`;
}

function stringToNumber(str: string): number {
  // Convert string to a consistent number for seeding
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}