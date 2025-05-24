import { useEffect } from "react";

/***** TYPE DEFINITIONS *****/
type KeyboardHandler = (event: KeyboardEvent) => void;

/***** UTILITY FUNCTIONS *****/
const isCastableToNumber = (value: string): boolean => {
  return !isNaN(Number(value));
}

/***** HOOKS *****/
/**
 * Hook for handling keyboard shortcuts with cleanup
 */
export const useKeyboardShortcut = (
  index: number, 
  onShortcut: () => void
): void => {
  useEffect(() => {
    const handleKeyDown: KeyboardHandler = (event: KeyboardEvent) => {
      if (isCastableToNumber(event.key)) {
        if (Number(event.key) === index) {
          onShortcut();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    }
  }, [index, onShortcut]);
}