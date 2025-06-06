import invariant from "tiny-invariant";
import { createMappableValue, type MappableValue } from "./mapRange";

/**
 * Clamps a value between a minimum and maximum value.
 * If the value is less than the minimum, it returns the minimum.
 * If the value is greater than the maximum, it returns the maximum.
 * If the value is within the range, it returns the value itself.
 * 
 * @param value - The value to clamp.
 * @param min - The minimum value.
 * @param max - The maximum value.
 * @returns The clamped value as a `MappableValue` type. 
 */
export const clamp = <TMin extends number, TMax extends number>(value: number, min: TMin, max: TMax): MappableValue<TMin, TMax> => {
  invariant(min <= max, "Minimum value must be less than or equal to maximum value.");

  return createMappableValue(
    Math.min(Math.max(value, min), max), 
    min, 
    max
  );
};