import { noiseSeed, noise as perlinNoise } from "@chriscourses/perlin-noise";
import type { Tagged } from "type-fest";
import { GameConstants } from "../../../shared/constants";
import { clamp } from "../../../utilities/clamp";
import { hashString } from "../../../utilities/hashString";
import { mapToRange, type MappableValue } from "../../../utilities/mapRange";

/***** TYPE DEFINITIONS *****/
export type Temperature = MappableValue<-10, 30> & Tagged<number, "Temperature">
export type Precipitation = MappableValue<0, 400> & Tagged<number, "Precipitation">

export type BiomeName = 
  | "Tundra"
  | "Taiga"
  | "Temperate Grassland"
  | "Temperate Forest" 
  | "Temperate Rainforest"
  | "Desert"
  | "Shrubland"
  | "Woodland"
  | "Tropical Grassland"
  | "Tropical Forest"
  | "Tropical Rainforest";

type BiomeRange = {
  minTemp: number;
  maxTemp: number;
  minPrecip: number;
  maxPrecip: number;
  biome: BiomeName;
};

const createTemperature = (value: MappableValue<-10, 30>): Temperature => {
  return value as Temperature;
};
const createPrecipitation = (value: MappableValue<0, 400>): Precipitation => {
  return value as Precipitation;
};

export class BiomeManager {
  private annualPrecipitationNoiseOffset: number = 10_0000;
  private annualAverageTemperatureNoiseOffset: number = 20_0000;
  private xOffset: number = 200_000;
  private yOffset: number = -300_000;

  constructor(seed: string = GameConstants.DEFAULT_SEED) {
    // Update the noise seed to ensure consistent generation
    noiseSeed(hashString(seed))
  }

  /**
   * Generates an annual precipitation value for a given coordinate. This should map from
   * 0 to 400 mm of precipitation.
   * 
   * Note: Precipitation is ultimately determined by temperature (as you cannot have rain when it is too cold) and as such, this function
   * refers to the temperature at this tile to determine the effective precipitation.
   * 
   * @param x - The x coordinate for the noise function.
   * @param y - The y coordinate for the noise function.
   * @returns A number representing the annual precipitation in mm.
   */
  public getAnnualPrecipitation(x: number, y: number): Precipitation {
    const rawTemp = this.getAnnualAverageTemperature(x, y);
    const rawPrecipNoise = perlinNoise(
      (x + this.xOffset) / GameConstants.NOISE_DIVISOR,
      (y + this.yOffset) / GameConstants.NOISE_DIVISOR,
      this.annualPrecipitationNoiseOffset
    );

    // Normalize temp from -10–30 → 0–1
    const tempNormalized = clamp(mapToRange(rawTemp, -10, 30, 0, 1), 0, 1);

    // Dampen precipitation based on temperature curve (e.g. cold → dry)
    const precipitationModifier = Math.pow(tempNormalized, 1.5); // more aggressive dampening for low temps

    // This should always be between 0 and 1, due to calling `pow` on a normalized value which will never go over 1
    // but we are clamping just in case to prevent any unexpected values.
    const effectivePrecip = clamp(rawPrecipNoise * precipitationModifier, 0, 1);

    // Map the effective precipitation to a range of 0 to 400 mm
    return createPrecipitation(mapToRange(effectivePrecip, 0, 1, 0, 400));
  }

  public getAnnualAverageTemperature(x: number, y: number): Temperature {
    // Generate a noise value based on the coordinates and the offset
    const noiseValue = perlinNoise(
      (x + this.xOffset) / GameConstants.NOISE_DIVISOR,
      (y + this.yOffset) / GameConstants.NOISE_DIVISOR,
      this.annualAverageTemperatureNoiseOffset
    );

    return createTemperature(mapToRange(noiseValue, 0, 1, -10, 30));
  }

  /**
   * Determines the biome type based on temperature and precipitation using Whittaker biome classification.
   * 
   * @param x - The x coordinate for the biome lookup.
   * @param y - The y coordinate for the biome lookup.
   * @returns The name of the biome at the given coordinates.
   */
  public getBiome(x: number, y: number): BiomeName {
    const temperature = this.getAnnualAverageTemperature(x, y);
    const precipitation = this.getAnnualPrecipitation(x, y);

    // Find the matching biome based on temperature and precipitation ranges
    for (const range of BiomeManager.WHITTAKER_BIOME_MAP) {
      if (
        temperature >= range.minTemp &&
        temperature < range.maxTemp &&
        precipitation >= range.minPrecip &&
        precipitation < range.maxPrecip
      ) {
        return range.biome;
      }
    }

    // Fallback to temperate grassland if no match found
    return "Temperate Grassland";
  }

  /***** BIOME CLASSIFICATION *****/
  // Whittaker biome classification based on temperature and precipitation
  private static readonly WHITTAKER_BIOME_MAP: Array<BiomeRange> = [
    // Cold biomes
    { minTemp: -10, maxTemp: -5, minPrecip: 0, maxPrecip: 400, biome: "Tundra" },
    { minTemp: -5, maxTemp: 5, minPrecip: 0, maxPrecip: 200, biome: "Taiga" },
    { minTemp: -5, maxTemp: 5, minPrecip: 200, maxPrecip: 400, biome: "Taiga" },
    
    // Temperate biomes
    { minTemp: 5, maxTemp: 20, minPrecip: 0, maxPrecip: 200, biome: "Temperate Grassland" },
    { minTemp: 5, maxTemp: 20, minPrecip: 200, maxPrecip: 1000, biome: "Temperate Forest" },
    { minTemp: 5, maxTemp: 20, minPrecip: 1000, maxPrecip: 400, biome: "Temperate Rainforest" },
    
    // Hot/dry biomes
    { minTemp: 20, maxTemp: 30, minPrecip: 0, maxPrecip: 200, biome: "Desert" },
    { minTemp: 20, maxTemp: 30, minPrecip: 200, maxPrecip: 600, biome: "Shrubland" },
    { minTemp: 20, maxTemp: 30, minPrecip: 600, maxPrecip: 1200, biome: "Woodland" },
    
    // Tropical biomes
    { minTemp: 20, maxTemp: 30, minPrecip: 600, maxPrecip: 1200, biome: "Tropical Grassland" },
    { minTemp: 20, maxTemp: 30, minPrecip: 1200, maxPrecip: 2000, biome: "Tropical Forest" },
    { minTemp: 20, maxTemp: 30, minPrecip: 2000, maxPrecip: 400, biome: "Tropical Rainforest" },
  ];
}