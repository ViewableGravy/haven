import invariant from "tiny-invariant";
import type { GetTagMetadata, Tagged } from "type-fest";

/***** TYPE DEFINITIONS *****/
export type MappableValue<
  TFromA extends number = number, 
  TFromB extends number = number
> = Tagged<number, "MappableValue", {
  fromA: TFromA;
  fromB: TFromB;
}>;

/***** FUNCTIONS *****/
export function mapToRange<TMappableValue extends MappableValue, TToA extends number, TToB extends number>(
  value: TMappableValue,
  fromA: GetTagMetadata<TMappableValue, "MappableValue">['fromA'],
  fromB: GetTagMetadata<TMappableValue, "MappableValue">['fromB'],
  toA: TToA,
  toB: TToB
): MappableValue<TToA, TToB> {
  invariant(fromA !== fromB, "fromA and fromB cannot be the same value.");
  invariant(toA as any !== toB, "toA and toB cannot be the same value.");

  // From Line 605 of https://github.com/processing/p5.js/blob/main/src/math/calculation.js
  return createMappableValue((value - fromA) / (fromB - fromA) * (toB - toA) + toA, toA, toB);
}



type CreateMapToRangeReturnType<TFromA extends number, TFromB extends number, TToA extends number, TToB extends number> =
  (value: MappableValue<TFromA, TFromB>) => MappableValue<TToA, TToB>

/***** FUNCTIONS *****/
export function createMapToRange<
  TFromA extends number, 
  TFromB extends number, 
  TToA extends number, 
  TToB extends number
>(
  fromA: TFromA,
  fromB: TFromB,
  toA: TToA,
  toB: TToB
): CreateMapToRangeReturnType<
  TFromA, 
  TFromB, 
  TToA, 
  TToB
> {
  invariant(fromA as any !== fromB, "fromA and fromB cannot be the same value.");
  invariant(toA as any !== toB, "toA and toB cannot be the same value.");

  return (value: MappableValue<TFromA, TFromB>): MappableValue<TToA, TToB> => mapToRange(value, fromA, fromB, toA, toB);
}


/***** FUNCTIONS *****/
export const createMappableValue = <TFromA extends number, TFromB extends number>(
  value: number,
  fromA: TFromA,
  fromB: TFromB
): MappableValue<TFromA, TFromB> => {
  invariant(fromA as any !== fromB, "fromA and fromB cannot be the same value.");

  return value as Tagged<number, "MappableValue", {
    fromA: TFromA;
    fromB: TFromB;
  }>;
}
