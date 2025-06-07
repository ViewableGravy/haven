import { Store } from "@tanstack/react-store";

/***** TYPE DEFINITIONS *****/
export type StoreAction<TState, TArgs extends Array<any> = Array<any>> = {
  readonly handler: (store: Store<TState>, ...args: TArgs) => void;
};

export type StoreOptions<TState, TActions extends Record<string, StoreAction<TState, any>>> = {
  state: TState;
  actions?: TActions;
};

export type StoreWithActions<TState, TActions extends Record<string, StoreAction<TState, any>>> = 
  Store<TState> & {
    [K in keyof TActions]: TActions[K] extends StoreAction<TState, infer TArgs> 
      ? (...args: TArgs) => void 
      : never;
  };

/***** UTILITY FUNCTIONS *****/
export function createStoreAction<TState, TArgs extends Array<any> = []>(
  handler: (store: Store<TState>, ...args: TArgs) => void
): StoreAction<TState, TArgs> {
  return {
    handler,
  };
}

export function createStore<TState, TActions extends Record<string, StoreAction<TState, any>>>(
  options: StoreOptions<TState, TActions>
): StoreWithActions<TState, TActions> {
  const store = new Store(options.state);
  
  // Add action methods to the store
  const storeWithActions = store as StoreWithActions<TState, TActions>;
  
  if (options.actions) {
    for (const [actionName, action] of Object.entries(options.actions)) {
      Object.assign(storeWithActions, {
        [actionName]: (...args: any[]) => {
          action.handler(store, ...args);
        },
      });
    }
  }
  
  return storeWithActions;
}

export function createStoreState<TState>(initialState: TState): TState {
  return initialState;
}
