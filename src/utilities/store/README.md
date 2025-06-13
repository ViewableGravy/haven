# Store Utility

A utility for creating type-safe Tanstack stores with predefined actions.

## Features

- **Type-safe actions**: Actions are fully typed with proper argument types
- **Clean API**: Simple, declarative way to define stores and actions
- **Compatible**: Works seamlessly with existing `useStore` hooks
- **Extensible**: Easy to add new actions to existing stores

## Usage

### 1. Define Actions

```typescript
import { createStoreAction } from "src/utilities/store";

// Action with no arguments
const reset = createStoreAction<CounterState, []>((store) => {
  store.setState(() => store.initialState);
});

// Action with argument
const increment = createStoreAction<CounterState, [amount: number]>((store, amount = 1) => {
  store.setState((state) => ({
    ...state,
    count: state.count + amount,
  }));
});

// Types can also be inferred by typing the arguments directly
const increment = createStoreAction((store: Store<CounterState>, amount: number = 1) => {
  store.setState((state) => ({
    ...state,
    count: state.count + amount,
  }));
});
```

### 2. Create Store

```typescript
import { createStore } from "@/utilities/store";

// Note: We can use the `createStoreState` utility to define the type on the state, such that 
// `createStore` will automatically infer the state as well as the actions. Without this, you would
// need to define the type of the state and actions in the createStore function
export const myStore = createStore({
  state: createStoreState<CounterState>({
    count: 0,
    name: "My Store",
  }),
  actions: {
    increment,
    reset,
    // ... other actions
  },
});
```

### 3. Use in Components

```typescript
import { useStore } from "@tanstack/react-store";
import { myStore } from "./store";

function MyComponent() {
  // Subscribe to entire state (Works identical to tanstack store by default)
  const { count, name } = useStore(myStore);
  
  // Subscribe to specific value
  const count = useStore(myStore, (state) => state.count);
  
  // Call actions
  const handleIncrement = () => {
    myStore.increment(5); // Fully typed!
  };
  
  const handleReset = () => {
    myStore.reset();
  };
  
  return (
    <div>
      <p>{name}: {count}</p>
      <button onClick={handleIncrement}>+5</button>
      <button onClick={handleReset}>Reset</button>
    </div>
  );
}
```

## Benefits

### Type Safety
- Actions are fully typed with proper argument validation
- TypeScript will catch incorrect action calls at compile time
- Auto-completion for action names and parameters

### Clean Separation
- Actions are defined separately from the store
- Easy to test actions in isolation or with custom stores
- Clear separation of concerns

### Performance
- Uses the same Tanstack Store underneath
- Efficient re-rendering with selectors
- No additional performance overhead

## Migration from Existing Stores

### Before (Manual Store)
```typescript
class MyStore extends Store<State> {
  constructor() {
    super(initialState);
  }
  
  increment = (amount = 1) => {
    this.setState((state) => ({
      ...state,
      count: state.count + amount,
    }));
  };
}
```

### After (Utility Store)
```typescript
const increment = createStoreAction<State, [amount?: number]>((store, amount = 1) => {
  store.setState((state) => ({
    ...state,
    count: state.count + amount,
  }));
});

export const myStore = createStore({
  state: initialState,
  actions: { increment },
});
```

## Examples

See `example.ts` for a complete working example with a counter store.
