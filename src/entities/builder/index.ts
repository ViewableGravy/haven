/***** TYPE DEFINITIONS *****/
import type { BaseEntity } from "../base";

type TraitApplier<TOptions, TTrait = {}> = {
  apply: (entity: BaseEntity, options?: TOptions) => BaseEntity;
  is(entity: any): entity is TTrait;
};

type BuildCallback<T extends BaseEntity, TResult> = (entity: T) => TResult;

/***** ENTITY BUILDER *****/
export class EntityBuilder {
  constructor(private entity: BaseEntity) {}

  /**
   * Create a new EntityBuilder with a base entity
   */
  static create(entity: BaseEntity): EntityBuilder {
    return new EntityBuilder(entity);
  }

  /**
   * Apply a trait to the entity
   */
  apply<TOptions, TTrait>(
    trait: TraitApplier<TOptions, TTrait>, 
    options?: TOptions
  ): EntityBuilder {
    const enhancedEntity = trait.apply(this.entity, options);
    return new EntityBuilder(enhancedEntity);
  }

  /**
   * Get the final built entity without finalization
   */
  build(): BaseEntity {
    return this.entity;
  }

  /**
   * Build with a finalization callback that determines the return type
   */
  buildWith<TResult>(callback: BuildCallback<BaseEntity, TResult>): TResult {
    return callback(this.entity);
  }

  /**
   * Create a trait with automatic symbol-based type checking
   */
  static createTrait<TOptions = {}, TTrait = {}>(
    applyFunction: (entity: BaseEntity, options?: TOptions) => BaseEntity
  ): TraitApplier<TOptions, TTrait> & { symbol: symbol } {
    const symbol = Symbol('Trait');

    return {
      symbol,
      apply: (entity: BaseEntity, options?: TOptions) => {
        return Object.assign(applyFunction(entity, options), {
          [symbol]: true
        });
      },
      is: (entity: any): entity is TTrait => {
        return entity && entity[symbol] === true;
      }
    };
  }
}