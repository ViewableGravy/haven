export function waitForIdle(): Promise<void> {
  return new Promise((resolve) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => resolve());
    } else {
      setTimeout(resolve, 8); // fallback to ~1 frame
    }
  });
}
