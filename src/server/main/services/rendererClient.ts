import { logger } from '../../../utilities/logger';
import { ServerConfig } from '../config';

/***** TYPE DEFINITIONS *****/
export interface RenderRequest {
  spriteData: Array<{ x: number; y: number; spriteIndex: number }>;
  chunkSize?: number;
  tileSize?: number;
}

export interface RenderResponse {
  success: boolean;
  texture?: string;
  error?: string;
}

export interface ServiceHealthResponse {
  status: string;
  initialized: boolean;
  timestamp: string;
}

/***** RENDERER SERVICE CLIENT *****/
export class RendererServiceClient {
  private serviceUrl: string;
  private isServiceAvailable: boolean = false;

  constructor() {
    this.serviceUrl = `http://${ServerConfig.rendererService.host}:${ServerConfig.rendererService.port}`;
  }

  /***** INITIALIZATION *****/
  public initialize = async (): Promise<void> => {
    await this.waitForService();
    logger.log('RendererServiceClient: Successfully connected to renderer service');
  };

  /***** SERVICE HEALTH MONITORING *****/
  private waitForService = async (): Promise<void> => {
    const { healthCheckRetries, healthCheckDelayMs } = ServerConfig.rendererService;
    
    for (let attempt = 1; attempt <= healthCheckRetries; attempt++) {
      try {
        const response = await fetch(`${this.serviceUrl}/health`);
        if (response.ok) {
          const health: ServiceHealthResponse = await response.json();
          if (health.initialized) {
            this.isServiceAvailable = true;
            logger.log(`RendererServiceClient: Service available (attempt ${attempt}/${healthCheckRetries})`);
            return;
          }
        }
      } catch (error) {
        // Service not ready yet, continue trying
      }

      logger.log(`RendererServiceClient: Waiting for service... (attempt ${attempt}/${healthCheckRetries})`);
      await new Promise((resolve) => setTimeout(resolve, healthCheckDelayMs));
    }

    throw new Error(`Renderer service did not become available within ${healthCheckRetries} attempts`);
  };

  public checkServiceHealth = async (): Promise<boolean> => {
    try {
      const response = await fetch(`${this.serviceUrl}/health`);
      const isHealthy = response.ok;
      if (!isHealthy && this.isServiceAvailable) {
        logger.log('RendererServiceClient: Service became unavailable');
        this.isServiceAvailable = false;
      }
      return isHealthy;
    } catch {
      if (this.isServiceAvailable) {
        logger.log('RendererServiceClient: Service connection lost');
        this.isServiceAvailable = false;
      }
      return false;
    }
  };

  /***** TEXTURE GENERATION *****/
  public generateChunkTexture = async (
    spriteData: Array<{ x: number; y: number; spriteIndex: number }>,
    chunkSize: number = 1024,
    tileSize: number = 64
  ): Promise<string> => {
    if (!this.isServiceAvailable) {
      throw new Error('Renderer service is not available');
    }

    const requestBody: RenderRequest = {
      spriteData,
      chunkSize,
      tileSize
    };

    try {
      const response = await fetch(`${this.serviceUrl}/render/chunk`, {
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
      logger.error('RendererServiceClient: Failed to generate chunk texture:', error);
      
      // Mark service as unavailable if it's a network error
      if (error instanceof TypeError && error.message.includes('fetch')) {
        this.isServiceAvailable = false;
      }
      
      throw error;
    }
  };

  /***** UTILITY METHODS *****/
  public isServiceReady = (): boolean => {
    return this.isServiceAvailable;
  };

  public getServiceUrl = (): string => {
    return this.serviceUrl;
  };
}
