```
███╗   ███╗██╗ ██████╗██████╗  ██████╗ ███████╗███████╗██████╗ ██╗   ██╗██╗ ██████╗███████╗
████╗ ████║██║██╔════╝██╔══██╗██╔═══██╗██╔════╝██╔════╝██╔══██╗██║   ██║██║██╔════╝██╔════╝
██╔████╔██║██║██║     ██████╔╝██║   ██║███████╗█████╗  ██████╔╝██║   ██║██║██║     █████╗  
██║╚██╔╝██║██║██║     ██╔══██╗██║   ██║╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██║██║     ██╔══╝  
██║ ╚═╝ ██║██║╚██████╗██║  ██║╚██████╔╝███████║███████╗██║  ██║ ╚████╔╝ ██║╚██████╗███████╗
╚═╝     ╚═╝╚═╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚═╝ ╚═════╝╚══════╝

 ██████╗██╗  ██╗██╗   ██╗███╗   ██╗██╗  ██╗    ██████╗ ███████╗███╗   ██╗██████╗ ███████╗██████╗ ███████╗██████╗ 
██╔════╝██║  ██║██║   ██║████╗  ██║██║ ██╔╝    ██╔══██╗██╔════╝████╗  ██║██╔══██╗██╔════╝██╔══██╗██╔════╝██╔══██╗
██║     ███████║██║   ██║██╔██╗ ██║█████╔╝     ██████╔╝█████╗  ██╔██╗ ██║██║  ██║█████╗  ██████╔╝█████╗  ██████╔╝
██║     ██╔══██║██║   ██║██║╚██╗██║██╔═██╗     ██╔══██╗██╔══╝  ██║╚██╗██║██║  ██║██╔══╝  ██╔══██╗██╔══╝  ██╔══██╗
╚██████╗██║  ██║╚██████╔╝██║ ╚████║██║  ██╗    ██║  ██║███████╗██║ ╚████║██████╔╝███████╗██║  ██║███████╗██║  ██║
 ╚═════╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝    ╚═╝  ╚═╝╚══════╝╚═╝  ╚═══╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
```

## High Level Overview

The current server-side chunk rendering system encounters Node.js ABI compatibility issues with the `canvas` module when running under Bun. This prevents the PIXI-based server-side rendering from functioning correctly.

The solution is to separate the chunk renderer into a dedicated Node.js microservice that handles texture generation, while keeping the main game server running on Bun. This architecture isolates the rendering concerns and allows each service to run in its optimal environment.

The main Bun server will communicate with the Node.js renderer service via HTTP API calls to generate chunk textures as needed.

## Files That Will Be Modified

### Directory Restructure
- `src/server/` → `src/server/main/` (existing Bun server code)
- New: `src/server/renderer/` (Node.js microservice)

### Main Server (Bun)
- `src/server/main/bunServer.ts` - Update to call renderer API
- `src/server/main/chunkRenderer.ts` - Convert to API client
- `src/server/main/config.ts` - Add renderer service configuration

### Renderer Service (Node.js)
- `src/server/renderer/app.ts` - Express server for rendering
- `src/server/renderer/chunkRenderer.ts` - Move PIXI rendering logic
- `src/server/renderer/spriteSheets/` - Move sprite sheet implementations
- `src/server/renderer/package.json` - Node.js specific dependencies

### Configuration
- `package.json` - Update scripts for both services
- New: `src/server/renderer/package.json` - Renderer dependencies

## Diagram of Changes

```
Current Architecture (Broken):
Bun Server → ServerChunkRenderer → @pixi/node → canvas.node (ABI mismatch) → ❌

New Architecture (Working):
┌─────────────────┐    HTTP API    ┌─────────────────────┐
│   Bun Server    │────────────────→│ Node.js Renderer    │
│                 │                 │                     │
│ • Game Logic    │←────────────────│ • PIXI Rendering    │
│ • WebSockets    │   Base64 PNG    │ • Sprite Loading    │
│ • File Storage  │                 │ • Texture Gen       │
└─────────────────┘                 └─────────────────────┘
```

### API Communication Flow:
```
1. Chunk Request → 2. Check Cache → 3. API Call → 4. Render → 5. Return Base64
    ↓               ↓               ↓            ↓          ↓
BunServer → File System → Renderer API → PIXI → HTTP Response
```

### Service Startup Flow:
```
1. Start Renderer Service (Node.js) on port 3001
2. Start Main Server (Bun) on port 8081
3. Main server waits for renderer health check
4. Services communicate via localhost HTTP
```

## API Endpoints

### Renderer Service (Node.js)
- `POST /render/chunk` - Generate chunk texture
  - Body: `{ spriteData: Array<{x, y, spriteIndex}>, chunkSize?, tileSize? }`
  - Response: `{ success: boolean, texture: string (base64), error?: string }`
- `GET /health` - Health check endpoint
- `GET /sprites/loaded` - Check sprite loading status

## Implementation Strategy

1. **Phase 1**: Directory restructure and file moves
2. **Phase 2**: Create Node.js renderer service with Express
3. **Phase 3**: Convert main server to use HTTP API client
4. **Phase 4**: Update build scripts and configuration
5. **Phase 5**: Add health checks and error handling

## Benefits

- **Isolation**: Rendering issues don't crash main server
- **Technology Optimization**: Each service runs in its optimal runtime
- **Scalability**: Renderer can be scaled independently
- **Maintainability**: Clear separation of concerns
- **Reliability**: Main game server remains stable

## Final Notes

This microservice architecture provides a robust solution to the ABI compatibility issue while maintaining all existing functionality. The separation allows for better resource management and makes the system more resilient to rendering-related failures.
