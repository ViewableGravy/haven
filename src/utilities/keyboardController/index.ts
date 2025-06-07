/**
 * https://pixijs.com/8.x/tutorials/spine-boy-adventure#7
 */

import { Store } from "@tanstack/react-store";

/***** TYPE DEFINITIONS *****/
interface KeyState {
  pressed: boolean;
  doubleTap: boolean;
  timestamp: number;
}

interface KeyboardState {
  up: KeyState;
  left: KeyState;
  down: KeyState;
  right: KeyState;
  space: KeyState;
  escape: KeyState;
  inventory: KeyState;
}

/***** KEYBOARD CONTROLLER *****/
export class KeyboardController extends Store<KeyboardState> {
  public get keys() {
    return this.state;
  }

  constructor() {
    const initialKeyState: KeyState = { pressed: false, doubleTap: false, timestamp: 0 };
    
    super({
      up: { ...initialKeyState },
      left: { ...initialKeyState },
      down: { ...initialKeyState },
      right: { ...initialKeyState },
      space: { ...initialKeyState },
      escape: { ...initialKeyState },
      inventory: { ...initialKeyState },
    });

    // Register event listeners for keydown and keyup events.
    window.addEventListener("keydown", this.keydownHandler);
    window.addEventListener("keyup", this.keyupHandler);
  }

  private keydownHandler = (event: KeyboardEvent) => {
    if (!KeyboardController.isValidKey(event.code)) return;

    const keyName = KeyboardController.keyMap[event.code];
    const now = Date.now();
    const currentKey = this.state[keyName];

    this.setState((state: KeyboardState) => ({
      ...state,
      [keyName]: {
        ...currentKey,
        pressed: true,
        // If not already in the double-tap state, toggle the double tap state if the key was pressed twice within 300ms.
        doubleTap: currentKey.doubleTap || now - currentKey.timestamp < 300,
      },
    }));
  };

  private keyupHandler = (event: KeyboardEvent) => {
    if (!KeyboardController.isValidKey(event.code)) return;

    const keyName = KeyboardController.keyMap[event.code];
    const now = Date.now();
    const currentKey = this.state[keyName];

    this.setState((state: KeyboardState) => ({
      ...state,
      [keyName]: {
        ...currentKey,
        pressed: false,
        // Reset double tap only if the key is in the double-tap state.
        doubleTap: false,
        // Update the timestamp to track the time difference till the next potential key down.
        timestamp: currentKey.doubleTap ? currentKey.timestamp : now,
      },
    }));
  };

  private static isValidKey = (
    key: string
  ): key is keyof typeof KeyboardController.keyMap => {
    return key in this.keyMap;
  };

  private static keyMap = {
    Space: "space",
    KeyW: "up",
    ArrowUp: "up",
    KeyA: "left",
    ArrowLeft: "left",
    KeyS: "down",
    ArrowDown: "down",
    KeyD: "right",
    ArrowRight: "right",
    KeyI: "inventory",
    Escape: "escape",
  } as const;

  /***** CLEANUP *****/
  public destroy(): void {
    window.removeEventListener("keydown", this.keydownHandler);
    window.removeEventListener("keyup", this.keyupHandler);
  }
}
