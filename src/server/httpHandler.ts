/***** TYPE DEFINITIONS *****/
import type { BunMultiplayerServer } from './bunServer';

/***** HTTP REQUEST HANDLER *****/
export class HttpHandler {
  private server: BunMultiplayerServer;

  constructor(server: BunMultiplayerServer) {
    this.server = server;
  }

  /***** REQUEST HANDLING *****/
  handleRequest = (req: Request): Response | Promise<Response> => {
    const url = new URL(req.url);
    
    // Upgrade WebSocket connections
    if (req.headers.get("upgrade") === "websocket") {
      const success = this.server.upgradeWebSocket(req);
      
      if (success) {
        return undefined as any; // Connection was upgraded
      }
      
      return new Response("WebSocket upgrade failed", { status: 400 });
    }

    // Basic HTTP response for health checks
    if (url.pathname === "/health") {
      return this.handleHealthCheck();
    }

    return new Response("Haven Game Server (Bun)", { status: 200 });
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
      headers: { "Content-Type": "application/json" }
    });
  };
}
