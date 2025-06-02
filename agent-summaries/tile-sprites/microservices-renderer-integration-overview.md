# 🔗 Microservices Renderer Integration
```
    ╔═══════════════════════════════════════════════════════════════════════╗
    ║  __  __   ___    ____     ___    ____    _____   ____   __   __  ___   ║
    ║ |  \/  | |_ _|  / ___|   |_ _|  / ___|  | ____| |  _ \  \ \ / / |_ _|  ║
    ║ | |\/| |  | |  | |        | |  | |      |  _|   | |_) |  \ V /   | |   ║
    ║ | |  | |  | |  | |___     | |  | |___   | |___  |  _ <    | |    | |   ║
    ║ |_|  |_| |___|  \____|   |___|  \____|  |_____| |_| \_\   |_|   |___|  ║
    ║                                                                       ║
    ║    ____   _____   _   _   ____    _____   ____   _____   ____         ║
    ║   |  _ \ | ____| | \ | | |  _ \  | ____| |  _ \ | ____| |  _ \        ║
    ║   | |_) ||  _|   |  \| | | | | | |  _|   | |_) ||  _|   | |_) |       ║
    ║   |  _ < | |___  | |\  | | |_| | | |___  |  _ < | |___  |  _ <        ║
    ║   |_| \_\|_____| |_| \_| |____/  |_____| |_| \_\|_____| |_| \_\       ║
    ╚═══════════════════════════════════════════════════════════════════════╝
```

## High Level Overview

This task completes the microservices refactoring by integrating the separate renderer service with the main Haven multiplayer server. The renderer service, already created with PIXI.js for server-side chunk texture generation, needs to be connected to the main server through HTTP API calls. This will enable the main server to generate chunk textures dynamically by communicating with the renderer microservice, separating concerns between game logic and texture generation.

The integration involves implementing HTTP client functionality in the main server to call the renderer service's `/render/chunk` endpoint, updating the chunk loading flow to use generated texture URLs, and ensuring proper error handling and service health monitoring between the two services.

## Files That Will Be Modified

### Main Server Integration Files
- `src/server/main/httpHandler.ts` - Add HTTP client methods for renderer service communication
- `src/server/main/chunkRenderer.ts` - Update to use renderer service instead of local PIXI rendering
- `src/server/main/types.ts` - Add renderer service response types and error handling types
- `src/server/main/webSocketHandler.ts` - Update chunk loading to include texture URLs from renderer
- `src/server/main/config.ts` - Add renderer service configuration (URL, timeouts, retry logic)

### Service Discovery & Health Files
- `src/server/main/services/rendererClient.ts` (new) - HTTP client wrapper for renderer service
- `src/server/main/services/types.ts` (new) - Service communication types and interfaces
- `src/server/main/healthCheck.ts` - Add renderer service health monitoring to main server

### Package & Script Updates
- `package.json` - Update dev:full script to ensure proper service startup order
- `README.md` - Update documentation with microservices architecture information

## Service Communication Diagram

```
┌─────────────────────┐         ┌─────────────────────┐
│   Main Server       │         │  Renderer Service   │
│   (Bun - Port 8081) │         │  (Express - 3001)   │
├─────────────────────┤         ├─────────────────────┤
│ WebSocket Handler   │◄────────┤ Player Connections  │
│ HTTP Handler        │         │                     │
│ Chunk Generator     │         │                     │
│ Renderer Client ────┼────────►│ Chunk Renderer      │
└─────────────────────┘         │ PIXI.js Engine      │
                                │ Sprite Sheets       │
    │                           └─────────────────────┘
    │ Load Chunk Request               │
    ▼                                  │
┌─────────────────────┐               │
│ 1. Generate chunk   │               │
│    data & entities  │               │
├─────────────────────┤               │
│ 2. HTTP POST to     │──────────────►│
│    /render/chunk    │               │
├─────────────────────┤               │
│ 3. Receive texture  │◄──────────────│
│    URL response     │               │
├─────────────────────┤               │
│ 4. Send LoadChunk   │               │
│    event with URL   │               │
└─────────────────────┘               │
```

## Implementation Steps

### Phase 1: HTTP Client Setup
1. Create `RendererClient` class with methods for texture generation requests
2. Add renderer service configuration to main server config
3. Implement retry logic and timeout handling for service calls

### Phase 2: Chunk Loading Integration  
1. Update `ServerChunkRenderer` to use renderer service instead of local PIXI
2. Modify `WebSocketHandler` to include texture URLs in LoadChunkEvent responses
3. Add error fallback for when renderer service is unavailable

### Phase 3: Service Health & Monitoring
1. Add renderer service health checks to main server startup
2. Implement service discovery pattern for dynamic renderer service URLs
3. Add logging and metrics for inter-service communication

### Phase 4: Testing & Documentation
1. Test end-to-end chunk loading with texture generation
2. Verify service startup order and error recovery
3. Update documentation and development workflow instructions

## Final Implementation Notes

**Service Startup Order**: The renderer service must start before the main server to ensure texture generation is available. The `dev:full` script will be updated to handle this dependency.

**Error Handling**: If the renderer service is unavailable, the main server will fall back to sending chunk data without texture URLs, allowing the client to render chunks using default textures.

**Performance**: HTTP calls to the renderer service will be asynchronous and cached where possible to avoid blocking chunk loading operations.

**Development Workflow**: Both services will support hot reload, with the main server automatically detecting renderer service availability and reconnecting as needed.
