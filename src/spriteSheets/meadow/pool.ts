import type { Sprite } from "pixi.js";
import invariant from "tiny-invariant";
import { GameConstants } from "../../shared/constants";

/**********************************************************************************************************
 *   TYPE DEFINITIONS
 **********************************************************************************************************/
type BorrowedSpriteResult = [
    sprite: Sprite,
    returnFunction: () => void
]

/**********************************************************************************************************
 *   COMPONENT START
 **********************************************************************************************************/
export abstract class SpritePool<TPoolName> {
// private:
    private pools: Map<TPoolName, Array<Sprite>> = new Map();
// protected:
    protected MAX_POOL_SIZE = GameConstants.CHUNK_SIZE * GameConstants.CHUNK_SIZE;
// abstract:
    abstract createSprite(name: TPoolName): Sprite

// public:
    public borrowSprite = (name: TPoolName): BorrowedSpriteResult => {
        const sprite = this.getOrCreateSprite(name);
        const returnSprite = () => this.returnSprite(name, sprite);

        return [sprite, returnSprite];
    }

    public returnSprite = (name: TPoolName, sprite: Sprite): void => {
        invariant(sprite, "Sprite must not be null or undefined");
        invariant(sprite.parent, "Sprite must be removed from its parent before returning to pool");

        const pool = this.getSpritePool(name);
        if (pool && pool.length < this.MAX_POOL_SIZE) {
            pool.push(sprite);
        }
    }

// protected:
    protected getOrCreateSprite = (name: TPoolName): Sprite => {
        const pool = this.getSpritePool(name);

        const sprite = pool.length > 0
            ? pool.pop()!
            : this.createSprite(name);

        return sprite;
    }

// private:
    private getSpritePool = (index: TPoolName): Array<Sprite> => {
        if (!this.pools.has(index)) {
            this.pools.set(index, []);
        }

        return this.pools.get(index)!;
    }
}