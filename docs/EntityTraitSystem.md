# 🔧 Entity Trait System

The Trait System is a composition-based architecture that allows entities to gain functionality by adding modular traits. Each trait encapsulates specific behavior and can be mixed and matched to create complex entities.

## Overview

Traits are reusable components that provide specific functionality to entities. Instead of inheritance, entities use composition to combine multiple traits, making the system flexible and maintainable.

## Core Concepts

### 1. Trait Structure

Each trait follows a standard structure:

```typescript
export class ExampleTrait {
  private entity: GameObject;
  private someProperty: any;

  constructor(entity: GameObject, initialValue: any) {
    this.entity = entity;
    this.someProperty = initialValue;
  }

  // Trait-specific methods
  public doSomething(): void {
    // Trait functionality
  }

  // Cleanup when trait is removed
  public destroy(): void {
    // Cleanup logic
  }

  // Static type guard
  static is(entity: GameObject): boolean {
    try {
      entity.getTrait('example');
      return true;
    } catch {
      return false;
    }
  }
}
```

### 2. Adding Traits to Entities

```typescript
// Add trait to entity
entity.addTrait('transform', new TransformTrait(entity, game, x, y, 'global'));
entity.addTrait('container', new ContainerTrait(entity, transformTrait));
entity.addTrait('network', new NetworkTrait(entity, game, networkConfig));

// Access trait
const transform = entity.getTrait('transform');
const position = transform.position.position;

// Check if entity has trait
if (TransformTrait.is(entity)) {
  // Safe to use transform trait methods
}
```

## Built-in Traits

### TransformTrait
- **Purpose**: Handles entity position, rotation, and scale
- **Key Properties**: `position`, `rotation`, `scale`, `size`
- **Usage**: Required for all entities that exist in world space

```typescript
const transform = TransformTrait.createLarge(game, x, y, 'global');
entity.addTrait('position', transform);

// Access position
const { x, y } = transform.position.position;
```

### ContainerTrait
- **Purpose**: Manages PIXI.js display objects and rendering
- **Key Properties**: `container` (PIXI Container)
- **Usage**: Required for all visual entities

```typescript
const container = new ContainerTrait(entity, transformTrait);
entity.addTrait('container', container);

// Add sprites to container
container.container.addChild(sprite);
```

### NetworkTrait
- **Purpose**: Handles multiplayer synchronization
- **Key Properties**: `syncConfig`, network connection management
- **Usage**: Added automatically by factory system for networked entities

```typescript
const networkTrait = new NetworkTrait(entity, game, {
  syncTraits: ['position', 'placeable'],
  syncFrequency: 'batched',
  priority: 'normal'
});
entity.addTrait('network', networkTrait);
```

### PlaceableTrait
- **Purpose**: Manages entity placement state and validation
- **Key Properties**: `isPlaced`, placement callbacks
- **Usage**: For entities that can be placed in the world

```typescript
const placeable = new PlaceableTrait(entity, false, () => {
  // Callback when entity is placed
  entity.getTrait('ghostable').ghostMode = false;
});
entity.addTrait('placeable', placeable);
```

### GhostableTrait
- **Purpose**: Handles preview/ghost mode rendering
- **Key Properties**: `ghostMode`, visual transparency
- **Usage**: For entities that show placement previews

```typescript
const ghostable = new GhostableTrait(entity, true); // Start in ghost mode
entity.addTrait('ghostable', ghostable);

// Toggle ghost mode
GhostableTrait.setGhostMode(entity, false);
```

## Trait Synchronization

### Network Sync Configuration

Traits can be synchronized across the network:

```typescript
const networkConfig: NetworkSyncConfig = {
  syncTraits: ['position', 'placeable'],  // Which traits to sync
  syncFrequency: 'batched',               // How often to sync
  priority: 'normal',                     // Sync priority
  persistent: true                        // Server persistence
};
```

### Sync Behavior

- **Immediate**: Changes sync instantly to server
- **Batched**: Changes are batched and sent periodically
- **Manual**: Sync only when explicitly triggered

## Advanced Usage

### Custom Traits

Create custom traits for specific functionality:

```typescript
export class InventoryTrait {
  private entity: GameObject;
  private items: Array<Item> = [];
  private capacity: number;

  constructor(entity: GameObject, capacity: number) {
    this.entity = entity;
    this.capacity = capacity;
  }

  public addItem(item: Item): boolean {
    if (this.items.length >= this.capacity) return false;
    this.items.push(item);
    return true;
  }

  public removeItem(itemId: string): Item | null {
    const index = this.items.findIndex(item => item.id === itemId);
    if (index === -1) return null;
    return this.items.splice(index, 1)[0];
  }

  public getItems(): Array<Item> {
    return [...this.items];
  }

  static is(entity: GameObject): boolean {
    try {
      entity.getTrait('inventory');
      return true;
    } catch {
      return false;
    }
  }
}
```

### Trait Communication

Traits can interact with each other:

```typescript
export class MovementTrait {
  private entity: GameObject;

  public moveTo(x: number, y: number): void {
    // Update position trait
    const transform = this.entity.getTrait('position');
    transform.position.position = { x, y, type: 'global' };

    // Update container position for rendering
    if (ContainerTrait.is(this.entity)) {
      const container = this.entity.getTrait('container');
      container.container.x = x;
      container.container.y = y;
    }

    // Sync to server if networked
    if (NetworkTrait.is(this.entity)) {
      // Network trait will handle syncing position changes
    }
  }
}
```

### Conditional Trait Logic

```typescript
// Safe trait access with type guards
if (TransformTrait.is(entity) && ContainerTrait.is(entity)) {
  const transform = entity.getTrait('position');
  const container = entity.getTrait('container');
  
  // Both traits are available
  container.container.x = transform.position.position.x;
}

// Utility functions for common trait combinations
export function isRenderableEntity(entity: GameObject): boolean {
  return TransformTrait.is(entity) && ContainerTrait.is(entity);
}

export function isNetworkedEntity(entity: GameObject): boolean {
  return NetworkTrait.is(entity);
}
```

## Best Practices

### 1. Trait Dependencies
- Document trait dependencies clearly
- Validate required traits in constructors
- Use type guards for safe trait access

### 2. Resource Management
- Always implement `destroy()` methods
- Clean up event listeners and references
- Remove from external systems (EntityManager, etc.)

### 3. State Management
- Keep trait state isolated and focused
- Communicate between traits through the entity
- Avoid tight coupling between traits

### 4. Performance
- Use static type guards for frequent checks
- Batch trait updates when possible
- Consider trait pooling for frequently created/destroyed entities

## Integration with Other Systems

### Entity Manager
- Automatically manages trait lifecycles
- Calls `destroy()` on all traits when entity is removed
- Handles trait registration and cleanup

### Network System
- NetworkTrait automatically syncs specified traits
- Trait changes trigger network updates based on sync configuration
- Server validates trait state changes

### Rendering System
- ContainerTrait manages PIXI.js display objects
- Integrates with layer management for proper z-ordering
- Handles transform inheritance and updates

The trait system provides a flexible, maintainable foundation for entity behavior that scales from simple objects to complex game systems.
