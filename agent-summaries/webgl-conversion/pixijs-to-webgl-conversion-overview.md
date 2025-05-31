# PIXI.js to Raw WebGL Conversion
```
██████╗ ██╗██╗  ██╗██╗         ████████╗ ██████╗     ██╗    ██╗███████╗██████╗  ██████╗ ██╗     
██╔══██╗██║╚██╗██╔╝██║         ╚══██╔══╝██╔═══██╗    ██║    ██║██╔════╝██╔══██╗██╔════╝ ██║     
██████╔╝██║ ╚███╔╝ ██║            ██║   ██║   ██║    ██║ █╗ ██║█████╗  ██████╔╝██║  ███╗██║     
██╔═══╝ ██║ ██╔██╗ ██║         ██╗██║   ██║   ██║    ██║███╗██║██╔══╝  ██╔══██╗██║   ██║██║     
██║     ██║██╔╝ ██╗██║         ╚█║██║   ╚██████╔╝    ╚███╔███╔╝███████╗██████╔╝╚██████╔╝███████╗
╚═╝     ╚═╝╚═╝  ╚═╝╚═╝          ╚╝╚═╝    ╚═════╝      ╚══╝╚══╝ ╚══════╝╚═════╝  ╚═════╝ ╚══════╝
                                                                                                   
 ██████╗ ██████╗ ███╗   ██╗██╗   ██╗███████╗██████╗ ███████╗██╗ ██████╗ ███╗   ██╗               
██╔════╝██╔═══██╗████╗  ██║██║   ██║██╔════╝██╔══██╗██╔════╝██║██╔═══██╗████╗  ██║               
██║     ██║   ██║██╔██╗ ██║██║   ██║█████╗  ██████╔╝███████╗██║██║   ██║██╔██╗ ██║               
██║     ██║   ██║██║╚██╗██║╚██╗ ██╔╝██╔══╝  ██╔══██╗╚════██║██║██║   ██║██║╚██╗██║               
╚██████╗╚██████╔╝██║ ╚████║ ╚████╔╝ ███████╗██║  ██║███████║██║╚██████╔╝██║ ╚████║               
 ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝               
```

## Overview

This is a comprehensive conversion of the Haven game engine from PIXI.js to raw WebGL. The conversion involves replacing PIXI.js's high-level rendering abstractions with direct WebGL API calls while maintaining all existing functionality including sprite batching, texture atlases, async chunk generation, and real-time multiplayer rendering.

The conversion will preserve the current architecture's performance optimizations, particularly the ability to batch render 256+ sprites per chunk and generate textures asynchronously for smooth gameplay. The new WebGL implementation will provide greater control over the rendering pipeline and potentially better performance through custom optimizations.

## Files to be Modified

### Core WebGL Infrastructure (New Files)
- `src/webgl/WebGLRenderer.ts` - Main renderer replacing PIXI.Application
- `src/webgl/WebGLContext.ts` - WebGL context setup and state management
- `src/webgl/Shader.ts` - Shader compilation and uniform management
- `src/webgl/Buffer.ts` - Vertex/index buffer management  
- `src/webgl/Texture.ts` - Texture loading and binding system
- `src/webgl/Framebuffer.ts` - Framebuffer operations for render-to-texture
- `src/webgl/Camera.ts` - 2D camera and viewport management
- `src/webgl/Transform.ts` - 2D transformation matrices

### Sprite System Replacement (New Files)
- `src/sprites/SpriteRenderer.ts` - Replace PIXI Container/Sprite system
- `src/sprites/SpriteBatch.ts` - Efficient batch rendering for chunks
- `src/sprites/SpriteAtlas.ts` - Replace PIXI Spritesheet functionality
- `src/sprites/SceneGraph.ts` - Custom scene graph for hierarchical rendering

### Shader Files (New Files)
- `src/shaders/sprite.vert` - Vertex shader for sprite rendering
- `src/shaders/sprite.frag` - Fragment shader for sprite rendering
- `src/shaders/batch.vert` - Optimized batch vertex shader
- `src/shaders/batch.frag` - Optimized batch fragment shader

### Existing Files to Convert
- `src/utilities/game/game.ts` - Convert from PIXI.Application to WebGL
- `src/systems/chunkManager/index.ts` - Replace PIXI Graphics/Texture
- `src/systems/chunkManager/chunk.ts` - Convert Container system
- `src/spriteSheets/meadow.ts` - Convert PIXI Spritesheet to WebGL
- `src/spriteSheets/character.ts` - Convert sprite sheet system
- `src/spriteSheets/running.ts` - Convert sprite sheet system  
- `src/spriteSheets/assembler.ts` - Convert sprite sheet system
- `src/utilities/player/index.ts` - Convert AnimatedSprite system
- `src/utilities/multiplayer/remotePlayer.ts` - Convert sprite rendering
- `src/entities/assembler/factory.tsx` - Convert sprite creation
- `src/entities/traits/container.ts` - Replace PIXI Container
- `src/systems/chunkManager/tile.ts` - Convert sprite/texture usage
- `src/components/pixi/index.tsx` - Convert React-PIXI integration
- `src/components/pixi/context.ts` - Update context provider

## Architecture Changes

```
Current PIXI.js Architecture:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Game Class    │───▶│ PIXI.Application │───▶│  PIXI.Renderer  │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   ChunkManager  │───▶│ PIXI.Container   │───▶│ PIXI.Graphics   │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  MeadowSprite   │───▶│ PIXI.Spritesheet │───▶│ PIXI.Texture    │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘

New WebGL Architecture:
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Game Class    │───▶│  WebGLRenderer   │───▶│ WebGLContext    │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   ChunkManager  │───▶│   SceneGraph     │───▶│   SpriteBatch   │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  MeadowSprite   │───▶│   SpriteAtlas    │───▶│  WebGL Texture  │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Key Implementation Details

### WebGL Renderer Features
- **Context Management**: Robust WebGL context creation with fallbacks
- **Shader Pipeline**: Compile-time shader validation and runtime uniform management
- **Batch Rendering**: Efficient sprite batching with dynamic buffer allocation
- **Texture Management**: Automatic texture atlas packing and GPU upload
- **Framebuffer Support**: Render-to-texture for chunk generation

### Performance Optimizations
- **Sprite Batching**: Maintain current 256+ sprites per batch capability
- **Buffer Pooling**: Reuse vertex/index buffers to reduce allocation overhead
- **Texture Streaming**: Async texture loading with placeholder support
- **Culling System**: View frustum culling for off-screen chunks
- **State Caching**: Minimize WebGL state changes through intelligent caching

### Compatibility Preservation
- **API Compatibility**: Maintain existing sprite sheet and rendering APIs
- **Async Texture Generation**: Preserve current chunk texture generation system
- **React Integration**: Update React components to use WebGL instead of PIXI
- **Multiplayer Support**: Ensure remote player rendering continues to work
- **Performance Metrics**: Maintain or improve current rendering performance

## Final Notes

This conversion represents a significant architectural change that will provide greater control over the rendering pipeline. The new WebGL implementation will be more lightweight than PIXI.js while maintaining all current functionality. Special attention will be paid to preserving the smooth chunk loading system and sprite batching performance that are critical to the game's user experience.

The conversion will be done in phases:
1. **Infrastructure Phase**: Create core WebGL classes and shaders
2. **Sprite System Phase**: Replace PIXI sprite and container systems
3. **Integration Phase**: Convert all existing sprite sheet classes
4. **Optimization Phase**: Fine-tune performance and add advanced features

Testing will be done progressively as each phase completes to ensure functionality is preserved throughout the conversion process.
