/// <reference types="vite/client" />

declare module "@chriscourses/perlin-noise" {
  /**
   * Perlin noise function that generates a pseudo-random number between 0 and 1;
   * @param x - The x coordinate for the noise function.
   * @param y - The y coordinate for the noise function (optional).
   * @param z - The z coordinate for the noise function (optional).
   */
  function noise(x, y?: number, z?: number): number;
}