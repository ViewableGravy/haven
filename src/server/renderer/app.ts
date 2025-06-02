import cors from 'cors';
import express from 'express';
import { ServerChunkRenderer } from './chunkRenderer';

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

/***** RENDERER SERVICE *****/
class RendererService {
  private app: express.Application;
  private chunkRenderer: ServerChunkRenderer;
  private port: number;
  private isInitialized: boolean = false;

  constructor(port: number = 3001) {
    this.app = express();
    this.port = port;
    this.chunkRenderer = new ServerChunkRenderer();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /***** MIDDLEWARE SETUP *****/
  private setupMiddleware = (): void => {
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  };

  /***** ROUTE SETUP *****/
  private setupRoutes = (): void => {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        initialized: this.isInitialized,
        timestamp: new Date().toISOString()
      });
    });

    // Sprite loading status
    this.app.get('/sprites/loaded', (req, res) => {
      res.json({ 
        loaded: this.isInitialized,
        timestamp: new Date().toISOString()
      });
    });

    // Main chunk rendering endpoint
    this.app.post('/render/chunk', async (req, res) => {
      try {
        if (!this.isInitialized) {
          return res.status(503).json({
            success: false,
            error: 'Renderer not initialized'
          } as RenderResponse);
        }

        const { spriteData, chunkSize = 1024, tileSize = 64 }: RenderRequest = req.body;

        if (!spriteData || !Array.isArray(spriteData)) {
          return res.status(400).json({
            success: false,
            error: 'Invalid spriteData provided'
          } as RenderResponse);
        }

        // Generate the chunk texture
        const texture = this.chunkRenderer.generateChunkTexture(spriteData, chunkSize, tileSize);
        
        // Convert to base64
        const base64Texture = await this.chunkRenderer.textureToDataURL(texture);

        res.json({
          success: true,
          texture: base64Texture
        } as RenderResponse);

      } catch (error) {
        console.error('Chunk rendering error:', error);
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown rendering error'
        } as RenderResponse);
      }
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });
  };

  /***** SERVICE LIFECYCLE *****/
  public initialize = async (): Promise<void> => {
    try {
      console.log('Initializing chunk renderer...');
      await this.chunkRenderer.initialize();
      this.isInitialized = true;
      console.log('Chunk renderer initialized successfully');
    } catch (error) {
      console.error('Failed to initialize chunk renderer:', error);
      throw error;
    }
  };

  public start = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const server = this.app.listen(this.port, () => {
        console.log(`Renderer service listening on port ${this.port}`);
        resolve();
      });

      server.on('error', (error) => {
        console.error('Failed to start renderer service:', error);
        reject(error);
      });
    });
  };
}

/***** SERVICE STARTUP *****/
const startService = async () => {
  try {
    const service = new RendererService();
    
    // Initialize the renderer
    await service.initialize();
    
    // Start the HTTP server
    await service.start();
    
    console.log('Chunk renderer service is ready');
  } catch (error) {
    console.error('Failed to start renderer service:', error);
    process.exit(1);
  }
};

// Start the service if this file is run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  startService();
}
