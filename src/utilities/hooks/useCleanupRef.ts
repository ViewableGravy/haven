import { useCallback, useEffect, useRef } from "react";

/***** TYPE DEFINITIONS *****/

/***** HOOKS *****/
export const useCleanupRef = () => {
  const ref = useRef<(() => void) | null>(null);

  const cleanup = useCallback(() => {
    ref.current?.();
    ref.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  return { cleanup, ref };
}