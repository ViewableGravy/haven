/***** TYPE DEFINITIONS *****/
import { join } from 'path';
import type { BunMultiplayerServer } from './bunServer';

/***** HTTP REQUEST HANDLER *****/
export class HttpHandler {
  private server: BunMultiplayerServer;
  private publicDir: string;

  constructor(server: BunMultiplayerServer) {
    this.server = server;
    // Set public directory relative to the server main directory
    this.publicDir = join(process.cwd(), 'src/server/main/public');
  }

  /***** REQUEST HANDLING *****/
  handleRequest = async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }
    
    // Upgrade WebSocket connections
    if (req.headers.get("upgrade") === "websocket") {
      const success = this.server.upgradeWebSocket(req);
      
      if (success) {
        return undefined as any; // Connection was upgraded
      }
      
      return new Response("WebSocket upgrade failed", { 
        status: 400,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Serve static files from public directory
    if (url.pathname.startsWith('/public/')) {
      return this.handleStaticFile(url.pathname);
    }

    // Basic HTTP response for health checks
    if (url.pathname === "/health") {
      return this.handleHealthCheck();
    }

    return new Response("Haven Game Server (Bun)", { 
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/plain'
      }
    });
  };

  /***** HEALTH CHECK *****/
  private handleHealthCheck = (): Response => {
    const stats = this.server.getServerStats();
    
    return new Response(JSON.stringify({
      status: "healthy",
      players: stats.playerCount,
      entities: stats.entityCount,
      chunks: stats.chunkCount,
      timestamp: Date.now()
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  };

  /***** STATIC FILE SERVING *****/
  private handleStaticFile = async (pathname: string): Promise<Response> => {
    try {
      // Remove /public/ prefix and construct file path
      const filePath = pathname.replace('/public/', '');
      const fullPath = join(this.publicDir, filePath);
      
      // Check if file exists
      const file = Bun.file(fullPath);
      if (!(await file.exists())) {
        return new Response("File not found", { status: 404 });
      }

      // Determine content type based on file extension
      const ext = fullPath.split('.').pop()?.toLowerCase();
      let contentType = 'application/octet-stream';
      
      switch (ext) {
        case 'png':
          contentType = 'image/png';
          break;
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg';
          break;
        case 'gif':
          contentType = 'image/gif';
          break;
        case 'svg':
          contentType = 'image/svg+xml';
          break;
        case 'js':
          contentType = 'application/javascript';
          break;
        case 'css':
          contentType = 'text/css';
          break;
        case 'html':
          contentType = 'text/html';
          break;
        case 'json':
          contentType = 'application/json';
          break;
      }
      
      return new Response(file, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (error) {
      console.error('Error serving static file:', error);
      return new Response("Internal server error");
    }
  };
}
