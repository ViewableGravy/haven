import { createEntityId, type EntityId } from "../utilities/tagged";
import { hasContainer, hasPosition, hasRectangle, hasSize, type HasContainer, type HasPosition, type HasRectangle } from "./interfaces";

/**
 * Provides absolute basic information such as uid and logging as well as global utilities for identifying traits
 * on a particular entity.
 */
export class BaseEntity {
  public readonly uid: EntityId;

  constructor(uid: string | number) {
    this.uid = createEntityId(uid);
  }

  public hasPosition = (): this is HasPosition => hasPosition(this);
  public hasContainer = (): this is HasContainer => hasContainer(this);
  public hasSize = (): this is hasSize => hasSize(this);
  public hasRectangle = (): this is HasRectangle => hasRectangle(this);
}