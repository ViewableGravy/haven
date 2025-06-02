
import { ServerConfig } from './config';

/***** TYPE DEFINITIONS *****/
interface RenderRequest {
  spriteData: Array<{ x: number; y: number; spriteIndex: number }>;
  chunkSize?: number;
  tileSize?: number;
}

interface RenderResponse {
  success: boolean;
  texture?: string;
  error?: string;
}

type Base64URLString = string;

/***** CHUNK RENDERER API CLIENT *****/
export class ServerChunkRenderer {
  private rendererServiceUrl: string;
  private isRendererAvailable: boolean = false;

  constructor() {
    this.rendererServiceUrl = `http://${ServerConfig.rendererService.host}:${ServerConfig.rendererService.port}`;
  }

  /***** INITIALIZATION *****/
  public initialize = async (): Promise<void> => {
    // Wait for renderer service to be available
    await this.waitForRendererService();
    console.log('Chunk renderer API client initialized');
  };

  /***** HEALTH CHECK *****/
  private waitForRendererService = async (
    maxAttempts: number = ServerConfig.rendererService.healthCheckRetries, 
    delayMs: number = ServerConfig.rendererService.healthCheckDelayMs
  ): Promise<void> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(`${this.rendererServiceUrl}/health`);
        if (response.ok) {
          const health = await response.json();
          if (health.initialized) {
            this.isRendererAvailable = true;
            console.log('Renderer service is available and initialized');
            return;
          }
        }
      } catch (error) {
        // Service not ready yet
      }

      console.log(`Waiting for renderer service... (attempt ${attempt}/${maxAttempts})`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    throw new Error('Renderer service did not become available within the timeout period');
  };

  /***** CHUNK TEXTURE GENERATION *****/
  public generateChunkTexture = async (
    spriteData: Array<{ x: number; y: number; spriteIndex: number }>,
    chunkSize: number = 1024,
    tileSize: number = 64
  ): Promise<string> => {
    if (!this.isRendererAvailable) {
      throw new Error('Renderer service is not available');
    }

    const requestBody: RenderRequest = {
      spriteData,
      chunkSize,
      tileSize
    };

    try {
      console.log('Sending chunk texture generation request to renderer service:', requestBody);

      const response = await fetch(`${this.rendererServiceUrl}/render/chunk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(ServerConfig.rendererService.requestTimeoutMs)
      });

      if (!response.ok) {
        throw new Error(`Renderer service responded with status ${response.status}`);
      }

      const result: RenderResponse = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Unknown rendering error');
      }

      if (!result.texture) {
        throw new Error('No texture data received from renderer service');
      }

      return result.texture;
    } catch (error) {
      console.error('Failed to generate chunk texture:', error);
      // Mark service as unavailable if it's not reachable
      if (error instanceof TypeError && error.message.includes('fetch')) {
        this.isRendererAvailable = false;
      }
      throw error;
    }
  };

  /***** UTILITY METHODS *****/
  public isServiceAvailable = (): boolean => {
    return this.isRendererAvailable;
  };

  public checkServiceHealth = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${this.rendererServiceUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  };
}
