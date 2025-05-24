import { useCallback } from "react";
import { useCleanupRef } from "./useCleanupRef";

/***** TYPE DEFINITIONS *****/
type CleanupRef = React.RefObject<(() => void) | null>;

/***** HOOKS *****/
/**
 * Creates a callback function with automatic cleanup handling
 */
export const useCleanupCallback = <T = void>(
  callback: (ref: CleanupRef, opts: T) => void
) => {
  const { cleanup, ref } = useCleanupRef();

  return useCallback((opts: T) => {
     // Attempt to cleanup previous runs if there are any
     cleanup();

     // Invoke the callback with the ref
     callback(ref, opts);
  }, [cleanup, callback]);
}