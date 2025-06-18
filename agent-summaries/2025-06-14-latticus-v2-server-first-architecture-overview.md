# LATTICUS V2 - SERVER FIRST ARCHITECTURE MIGRATION

```
██╗      █████╗ ████████╗████████╗██╗ ██████╗██╗   ██╗███████╗    ██╗   ██╗██████╗ 
██║     ██╔══██╗╚══██╔══╝╚══██╔══╝██║██╔════╝██║   ██║██╔════╝    ██║   ██║╚════██╗
██║     ███████║   ██║      ██║   ██║██║     ██║   ██║███████╗    ██║   ██║ █████╔╝
██║     ██╔══██║   ██║      ██║   ██║██║     ██║   ██║╚════██║    ╚██╗ ██╔╝██╔═══╝ 
███████╗██║  ██║   ██║      ██║   ██║╚██████╗╚██████╔╝███████║     ╚████╔╝ ███████╗
╚══════╝╚═╝  ╚═╝   ╚═╝      ╚═╝   ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝      ╚═══╝  ╚══════╝
```

## High Level Overview

This implementation creates Latticus V2, a complete reimagining of the game architecture that transitions from a client-first to a server-first approach. The new system maintains the excellent components from V1 (traits, entities, chunk system) while implementing a modern server-authoritative architecture with **shared object networking** that makes server interactions completely transparent to game logic.

The migration involves creating a new modular system within the `/latticus` directory that leverages the knowledge and patterns learned from building V1. The new architecture introduces **proxy-based networked objects** where reading and writing to objects automatically makes network requests behind the scenes, server-side entity persistence, and trait-based network abstractions that make multiplayer feel like single-player development.

## Files That Will Be Modified/Created

### New Latticus V2 Structure:
```
latticus/
├── server/
│   ├── main.ts - New Bun server entry point
│   ├── handlers/
│   │   ├── mutations.ts - Client mutation handlers
│   │   ├── queries.ts - Client query handlers  
│   │   └── invalidation.ts - Server invalidation events
│   ├── entities/
│   │   ├── manager.ts - Server-side entity management
│   │   └── persistence.ts - Entity state persistence
│   ├── chunks/
│   │   ├── generator.ts - Ported chunk generation
│   │   └── manager.ts - Server chunk management
│   └── traits/
│       ├── networkable.ts - Network abstraction trait
│       └── persistent.ts - Entity persistence trait
├── client/
│   ├── main.tsx - New client entry point
│   ├── api/
│   │   ├── queries.ts - Tanstack query definitions
│   │   ├── mutations.ts - Mutation functions
│   │   └── socket.ts - WebSocket client
│   ├── entities/
│   │   ├── base.ts - Client WorldObject class
│   │   └── traits/
│   ├── systems/
│   │   ├── entitySync.ts - Query-based entity sync
│   │   └── chunkManager.ts - Client chunk management
│   └── components/
│       ├── Game.tsx - Main game component
│       ├── World.tsx - World rendering
│       └── UI/
├── shared/
│   ├── utilities/
│   │   ├── createStore.ts - Ported from V1
│   │   ├── Logger.ts - Ported logging system
│   │   └── eventEmitter.ts - Ported event system
│   ├── traits/
│   │   ├── base.ts - Ported Traitable system
│   │   ├── transform.ts - Ported transform trait
│   │   └── inventory.ts - Ported inventory trait
│   ├── types/
│   │   ├── entities.ts - Shared entity types
│   │   ├── chunks.ts - Shared chunk types
│   │   └── network.ts - Network message types
│   └── assets/
│       └── spriteSheets/ - Ported sprite systems
└── package.json - New package config
```

### Modified Root Files:
- `package.json` - Add `dev:new:full` script
- `bun.lockb` - Updated dependencies

### Ported V1 Systems:
- `src/utilities/store/` → `latticus/shared/utilities/createStore.ts`
- `src/objects/traits/` → `latticus/shared/traits/`
- `src/spriteSheets/` → `latticus/shared/assets/spriteSheets/`
- `src/utilities/game/Logger.ts` → `latticus/shared/utilities/logger.ts`
- `src/server/chunkGenerator.ts` → `latticus/server/chunks/generator.ts`

## Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │  Latticus V2    │    │   Server App    │
│                 │    │   Architecture  │    │                 │
│ ┌─────────────┐ │    │                 │    │ ┌─────────────┐ │
│ │ React UI    │ │    │ ┌─────────────┐ │    │ │ Bun Server  │ │
│ │ Components  │ │◄───┤ │ WebSocket   │ │────┤ │ HTTP/WS     │ │
│ └─────────────┘ │    │ │ Bridge      │ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ └─────────────┘ │    │ ┌─────────────┐ │
│ │ PIXI.js     │ │    │ ┌─────────────┐ │    │ │ Entity      │ │
│ │ Renderer    │ │    │ │ Tanstack    │ │    │ │ Manager     │ │ 
│ └─────────────┘ │    │ │ Query       │ │    │ └─────────────┘ │
│ ┌─────────────┐ │    │ └─────────────┘ │    │ ┌─────────────┐ │
│ │ Client      │ │    │ ┌─────────────┐ │    │ │ Chunk       │ │
│ │ Entities    │ │    │ │ Trait       │ │    │ │ Generator   │ │
│ └─────────────┘ │    │ │ System      │ │    │ └─────────────┘ │
└─────────────────┘    │ └─────────────┘ │    └─────────────────┘
                       └─────────────────┘

Flow: Client mutations → Query invalidation → Server authority → State sync
```

## Key Implementation Details

### Server-First Entity Management
Instead of client-side entity creation, all entities are created and managed server-side. The client sends mutations (place tree, move player) which the server validates and processes. The server then sends invalidation events that trigger Tanstack Query cache updates.

### Trait-Based Network Abstraction
Network operations are abstracted behind traits on WorldObjects using JavaScript Proxy objects. When code calls `entity.getTrait('position').setPosition(x, y)`, the proxy automatically intercepts the call and handles sending the network request to the server, making server interactions completely invisible to game logic.

### Shared Object State Management
Instead of queries and mutations, objects behave like normal local objects but are automatically synchronized across the network. Individual entities are proxy-wrapped to intercept property access and modification, while batching and optimization happens transparently behind the scenes.

### Preserved V1 Systems
The excellent chunk generation, render texture pooling, trait system, and sprite management from V1 are preserved and ported over. The player becomes a regular WorldObject with traits for enhanced functionality.

This architecture provides a solid foundation for scalable multiplayer gameplay while maintaining the modularity and clean code patterns established in V1.
