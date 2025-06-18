```


__/\\\_______________________________________________________________________________________________________        
 _\/\\\_______________________________________________________________________________________________________       
  _\/\\\________________________________/\\\__________/\\\_______/\\\__________________________________________      
   _\/\\\______________/\\\\\\\\\_____/\\\\\\\\\\\__/\\\\\\\\\\\_\///______/\\\\\\\\__/\\\____/\\\__/\\\\\\\\\\_     
    _\/\\\_____________\////////\\\___\////\\\////__\////\\\////___/\\\___/\\\//////__\/\\\___\/\\\_\/\\\//////__    
     _\/\\\_______________/\\\\\\\\\\_____\/\\\_________\/\\\______\/\\\__/\\\_________\/\\\___\/\\\_\/\\\\\\\\\\_   
      _\/\\\______________/\\\/////\\\_____\/\\\_/\\_____\/\\\_/\\__\/\\\_\//\\\________\/\\\___\/\\\_\////////\\\_  
       _\/\\\\\\\\\\\\\\\_\//\\\\\\\\/\\____\//\\\\\______\//\\\\\___\/\\\__\///\\\\\\\\_\//\\\\\\\\\___/\\\\\\\\\\_ 
        _\///////////////___\////////\//______\/////________\/////____\///_____\////////___\/////////___\//////////__


```

## High Level Overview

Latticus is a sophisticated multiplayer 2D game built with React, TypeScript, and PIXI.js for rendering. The project implements a modern ECS (Entity Component System) architecture with a custom chunk-based world system for infinite terrain generation. The game features real-time multiplayer capabilities using WebSockets, with server-authoritative chunk generation and entity synchronization.

The application utilizes a modular architecture with clear separation between client and server logic. The client handles rendering, user interaction, and visual effects through PIXI.js, while the server manages world state, chunk generation using Perlin noise, and multiplayer synchronization. The system is designed for scalability with worker pools, efficient chunk loading/unloading, and optimized entity management.

## How to Run the Application

### Prerequisites
- **Bun**: Install from [bun.sh](https://bun.sh)
- **Node.js**: v18+ (for compatibility)

### Development Setup
1. **Install Dependencies**:
   ```bash
   bun install
   ```

2. **Start Full Development Environment** (Recommended):
   ```bash
   bun run dev:full
   ```
   This runs both the **Bun server with auto-restart** and client concurrently.

3. **Individual Services**:
   ```bash
   # Start Bun server with auto-restart (recommended)
   bun run server
   
   # Start legacy Node.js server (fallback)
   bun run server:legacy
   
   # Start only the client
   bun run dev
   ```

4. **Production Build**:
   ```bash
   bun run build
   bun run preview
   ```

### Development URLs
- **Client**: http://localhost:5173 (Vite dev server)
- **Server**: WebSocket on port 8081 (Bun server)
- **Health Check**: http://localhost:8081/health

### 🔄 Auto-Restart Feature
The server now **automatically restarts** when you save changes to:
- `src/server/**/*.ts` - Server-side code
- `src/shared/**/*.ts` - Shared constants and types

No more manual server restarts during development! 🎉

## Additional Documentation

- `BUN_SERVER_MIGRATION.md` - **NEW**: Bun server migration details and auto-restart setup
- `SERVER_CHUNK_SYSTEM.md` - Detailed chunk generation system documentation
- `agent-summaries/` - Historical code change documents (performed with agents instead of manual changes)
- `instructions.md` - Project coding standards and conventions

## 📚 System Documentation

This section provides comprehensive documentation for all major systems in the Haven game engine. Each document includes architecture details, usage examples, and implementation guides.

### Core Systems

#### 🏭 [Entity Factory System](docs/EntityFactorySystem.md)
Unified entity creation with consistent APIs across all entity types. Handles both local (client-only) and networked (server-synchronized) entity creation.

**Key Features:**
- Consistent factory API for all entities
- Server-first networking with automatic synchronization
- Type-safe entity creation with full TypeScript support
- Easy conversion between local and networked entities

**Usage:**
```typescript
// Create networked entities
const tree = await WorldObjects.spruceTree.createNetworked(game, { x: 100, y: 200 });

// Create local entities
const preview = WorldObjects.assembler.createLocal(game, { x: 300, y: 400 });

// Convert local to networked
const converted = await WorldObjects.spruceTree.createNetworkedFromLocal(preview, game);
```

#### 🔧 [Entity Trait System](docs/EntityTraitSystem.md)
Composition-based architecture that allows entities to gain functionality through modular traits. Replaces inheritance with flexible composition patterns.

**Key Features:**
- Modular trait system (Transform, Container, Network, Placeable, Ghostable)
- Type-safe trait access with static type guards
- Automatic trait synchronization across the network
- Easy trait communication and dependencies

**Usage:**
```typescript
// Add traits to entities
entity.addTrait('position', new TransformTrait(entity, game, x, y, 'global'));
entity.addTrait('container', new ContainerTrait(entity, transformTrait));

// Access traits safely
if (TransformTrait.is(entity)) {
  const position = entity.getTrait('position').position.position;
}
```

#### 🌐 [Multiplayer Networking System](docs/MultiplayerNetworking.md)
Server-authoritative multiplayer with automatic synchronization, entity management, and real-time communication between clients and server.

**Key Features:**
- Server-first architecture with authoritative game state
- Automatic trait synchronization with configurable frequency
- Promise-based async requests with timeout handling
- Real-time WebSocket communication with message routing

**Usage:**
```typescript
// Async entity creation with server validation
const entity = await WorldObjects.spruceTree.createNetworked(game, { x, y });

// Automatic trait synchronization
entity.getTrait('position').setPosition(newX, newY);
// ↑ Automatically syncs to server and other clients
```

#### 🌍 [World and Chunk System](docs/WorldChunkSystem.md)
Procedurally generated infinite world divided into manageable chunks. Handles terrain generation, dynamic loading, and performance optimization.

**Key Features:**
- Infinite procedural world generation using Perlin noise
- Dynamic chunk loading/unloading based on player proximity
- Entity-chunk decoupling for simplified management
- Biome system with different terrain types and spawning rules

**Usage:**
```typescript
// Automatic chunk loading around player
worldManager.setPlayerPosition(playerX, playerY);

// Entities positioned independently of chunks
const entity = WorldObjects.spruceTree.createLocal(game, { x: 1500, y: 800 });
// ↑ Automatically positioned correctly regardless of chunk boundaries
```

### Development Guides

Each documentation file includes:
- **Architecture Overview**: High-level system design and concepts
- **Implementation Details**: Code examples and API references  
- **Usage Patterns**: Common use cases and best practices
- **Integration Guide**: How systems work together
- **Performance Considerations**: Optimization tips and patterns
- **Error Handling**: Common issues and solutions

### Getting Started

1. **New to the codebase?** Start with [Entity Factory System](docs/EntityFactorySystem.md) for entity creation
2. **Want to understand entities?** Read [Entity Trait System](docs/EntityTraitSystem.md) for composition patterns
3. **Building multiplayer features?** Check [Multiplayer Networking](docs/MultiplayerNetworking.md) for sync patterns
4. **Working on world generation?** See [World and Chunk System](docs/WorldChunkSystem.md) for terrain systems

### Contributing

When adding new systems or modifying existing ones, please:
- Update the relevant documentation files
- Include code examples in your documentation
- Follow the established architectural patterns
- Add your system to this README's documentation index

## Files Modified (Key Components)

### Core Application
- `src/App.tsx` - Main React application entry point
- `src/main.tsx` - Vite application bootstrap
- `package.json` - Dependencies and build scripts

### Server Architecture
- `src/server/bunServer.ts` - Bun-native multiplayer server with WebSocket handling
- `src/server/chunkdb.ts` - In-memory chunk database system
- `src/server/chunkGenerator.ts` - Server-side chunk generation with Perlin noise
- `src/server/types.ts` - Server-specific type definitions

### Client Systems
- `src/systems/chunkManager/` - Client-side chunk loading and management
- `src/utilities/multiplayer/manager.ts` - Multiplayer client coordination
- `src/utilities/game/game.ts` - Core game state management
- `src/utilities/player/index.ts` - Player entity and controls

### Entity System
- `src/entities/base.ts` - Base entity class
- `src/entities/interfaces.ts` - Entity system interfaces
- `src/entities/traits/` - Reusable entity behaviors (container, placeable, rotatable)
- `src/entities/assembler/` - Factory building entity implementation

### Rendering & UI
- `src/components/pixi/index.tsx` - PIXI.js React context provider
- `src/components/hotbar/` - Player inventory hotbar UI
- `src/components/infographic/` - Debug/info display component

### Utilities & Helpers
- `src/utilities/eventEmitter/` - Custom event system
- `src/utilities/logger/` - Centralized logging system
- `src/workers/` - Web worker pool for background processing

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │   React App     │    │   PIXI.js       │    │   Multiplayer Client    │  │
│  │  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────────────┐  │  │
│  │  │ Hotbar    │  │    │  │ Renderer  │  │    │  │ WebSocket Client  │  │  │
│  │  │ Component │  │◄──►│  │           │  │◄──►│  │                   │  │  │
│  │  └───────────┘  │    │  │ Sprites   │  │    │  │ Event Handlers    │  │  │
│  │  ┌───────────┐  │    │  │ Chunks    │  │    │  │                   │  │  │
│  │  │Infographic│  │    │  │ Entities  │  │    │  │ Entity Sync       │  │  │
│  │  │ Component │  │    │  └───────────┘  │    │  └───────────────────┘  │  │
│  │  └───────────┘  │    └─────────────────┘    └─────────────────────────┘  │
│  └─────────────────┘             │                         │                │
│           │                      │                         │                │
│           └──────────────────────┼─────────────────────────┘                │
│                                  │                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                         GAME SYSTEMS LAYER                             │  │
│  │  ┌───────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │  │
│  │  │ Chunk Manager │  │Entity System│  │   Player    │  │ Event System│  │  │
│  │  │               │  │             │  │  Controls   │  │             │  │  │
│  │  │ • Loading     │  │ • ECS Base  │  │             │  │ • Custom    │  │  │
│  │  │ • Unloading   │  │ • Traits    │  │ • Movement  │  │ • Emitters  │  │  │
│  │  │ • Registry    │  │ • Factory   │  │ • Camera    │  │ • Listeners │  │  │
│  │  └───────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                ┌───────┴───────┐
                                │  WebSocket    │
                                │  Connection   │
                                └───────┬───────┘
                                        │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SERVER ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────────┐  │
│  │ WebSocket Server│    │  Chunk System   │    │    Entity Manager       │  │
│  │                 │    │                 │    │                         │  │
│  │ • Player Mgmt   │◄──►│ • Generator     │◄──►│ • Placement/Removal     │  │
│  │ • Connection    │    │ • Database      │    │ • State Sync            │  │
│  │ • Broadcasting  │    │ • Perlin Noise  │    │ • Validation            │  │
│  │ • Event Router  │    │ • 5x5 Radius    │    │ • Persistence           │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────────────┘  │
│           │                       │                         │               │
│  ┌─────────────────────────────────────────────────────────────────────────┐  │
│  │                          SERVER STORAGE                                │  │
│  │  ┌─────────────┐         ┌─────────────┐         ┌─────────────────┐   │  │
│  │  │ Player Map  │         │ Chunk Cache │         │ Entity Database │   │  │
│  │  │             │         │             │         │                 │   │  │
│  │  │ • Positions │         │ • In-Memory │         │ • Global State  │   │  │
│  │  │ • WebSocket │         │ • 1024x1024 │         │ • Type Safety   │   │  │
│  │  │ • Visibility│         │ • Generated │         │ • Relationships │   │  │
│  │  └─────────────┘         └─────────────┘         └─────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Systems & Features

### 🌍 Chunk-Based World System
- **Infinite Terrain**: Server generates chunks using Perlin noise algorithm
- **Efficient Loading**: 5x5 chunk radius loaded around each player
- **Memory Management**: Automatic chunk unloading when players move away
- **Database Persistence**: In-memory chunk caching with generation timestamps

### 🎮 Entity Component System (ECS)
- **Base Entity Class**: Core entity functionality with lifecycle management
- **Trait System**: Modular behaviors (Placeable, Rotatable, Container, Ghostable)
- **Factory Pattern**: Assembler entities with complex manufacturing logic
- **Type Safety**: Comprehensive TypeScript interfaces and namespaces

### 👥 Multiplayer Architecture
- **Real-time Sync**: WebSocket-based player and entity synchronization
- **Event-Driven**: Structured event system for game state changes
- **Server Authority**: Server validates all entity placements and movements
- **Scalable Design**: Modular event handlers and manager classes

### 🎨 Rendering Pipeline
- **PIXI.js Integration**: Hardware-accelerated 2D rendering
- **Sprite Management**: Efficient sprite sheet loading and caching
- **React Context**: Clean integration between React UI and PIXI rendering
- **Performance Optimized**: Worker pools for background processing

### 🛠️ Development Tools
- **Modern Toolchain**: Vite build system with TypeScript and React
- **Bun Runtime**: Fast JavaScript runtime for server and package management
- **Linting & Formatting**: ESLint configuration with React hooks support
- **Debug Systems**: Comprehensive logging and infographic display components
