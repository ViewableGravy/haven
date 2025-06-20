/// <reference types="vite/client" />

declare module "@chriscourses/perlin-noise" {
  /**
   * Perlin noise function that generates a pseudo-random number between 0 and 1;
   * @param x - The x coordinate for the noise function.
   * @param y - The y coordinate for the noise function (optional).
   * @param z - The z coordinate for the noise function (optional).
   */
  function noise(x, y?: number, z?: number): import("./utilities/mapRange").MappableValue<0, 1>;

  /**
   * Sets the seed for the perlin noise function to ensure consistent results
   * @param seed - The seed value for the noise generator
   */
  function noiseSeed(seed: number): void;
}