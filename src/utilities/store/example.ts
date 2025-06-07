/**
 * Example usage of the createStore utility
 * This shows how to convert existing stores to use the new pattern
 */

import { createStore, createStoreAction } from "./index";

/***** TYPE DEFINITIONS *****/
interface CounterState {
  count: number;
  name: string;
}

/***** ACTIONS *****/
const increment = createStoreAction<CounterState, [amount?: number]>((store, amount = 1) => {
  store.setState((state) => ({
    ...state,
    count: state.count + amount,
  }));
});

const decrement = createStoreAction<CounterState, [amount?: number]>((store, amount = 1) => {
  store.setState((state) => ({
    ...state,
    count: state.count - amount,
  }));
});

const reset = createStoreAction<CounterState, []>((store) => {
  store.setState((state) => ({
    ...state,
    count: 0,
  }));
});

const setName = createStoreAction<CounterState, [name: string]>((store, name) => {
  store.setState((state) => ({
    ...state,
    name,
  }));
});

/***** STORE CREATION *****/
export const counterStore = createStore({
  state: {
    count: 0,
    name: "Counter",
  },
  actions: {
    increment,
    decrement,
    reset,
    setName,
  },
});

/***** USAGE EXAMPLES *****/
// Now you can use it like this:
// counterStore.increment(); // increment by 1
// counterStore.increment(5); // increment by 5
// counterStore.decrement(3); // decrement by 3
// counterStore.reset(); // reset to 0
// counterStore.setName("My Counter"); // set name

// The store still works with useStore:
// const { count, name } = useStore(counterStore);
// const count = useStore(counterStore, (state) => state.count);
