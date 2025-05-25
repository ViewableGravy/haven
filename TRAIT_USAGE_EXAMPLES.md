# Trait Usage Examples

## New Trait System Usage

After the refactoring, here are examples of how to use the new trait system:

### 1. Type Checking with Static `is()` Methods

```typescript
import { GhostableTrait, PlaceableTrait, ContainerTrait } from './src/entities/traits/';

// Type-safe checking if entity has a trait
if (GhostableTrait.is(entity)) {
  // TypeScript now knows entity has ghostableTrait property
  entity.ghostableTrait.ghostMode = true;
}

if (PlaceableTrait.is(entity)) {
  // TypeScript knows entity has placeableTrait property
  console.log('Entity is placed:', entity.placeableTrait.isPlaced);
}

if (ContainerTrait.is(entity)) {
  // TypeScript knows entity has containerTrait property
  entity.containerTrait.container.addChild(someSprite);
}
```

### 2. Static Helper Methods

```typescript
// Using static methods for common operations
PlaceableTrait.place(entity);        // Places entity if it has placeable trait
PlaceableTrait.unplace(entity);      // Unplaces entity if it has placeable trait
PlaceableTrait.isPlaced(entity);     // Returns placement status

GhostableTrait.setGhostMode(entity, true);   // Sets ghost mode if entity supports it
GhostableTrait.getGhostMode(entity);         // Gets ghost mode status
```

### 3. Direct Trait Access

```typescript
// You can still access traits directly on entities
entity.ghostableTrait.ghostMode = false;
entity.placeableTrait.place();
entity.containerTrait.container.addChild(sprite);
```

### 4. Compatibility Properties

The assembler entity still maintains compatibility properties for EntityManager:

```typescript
// These still work for backward compatibility
entity.ghostMode = true;
entity.isPlaced;
entity.container;
```

## Benefits

1. **Type Safety**: Static `is()` methods provide proper TypeScript inference
2. **Cleaner API**: Static helper methods eliminate redundant entity methods
3. **Flexible Usage**: Can use static methods or direct trait access
4. **Backward Compatibility**: Essential properties still available on entities
