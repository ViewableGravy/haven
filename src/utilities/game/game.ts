import { Application, Assets, Container, type ContainerChild } from "pixi.js";
import type { BaseEntity } from "../../entities/base";
import { ChunkManager } from "../chunkManager";
import { ChunkGenerator } from "../chunkManager/generator";
import { ChunkLoader } from "../chunkManager/loader";
import { ChunkManagerMeta } from "../chunkManager/meta";
import type { Chunk } from "../chunkManager/type";
import { KeyboardController } from "../keyboardController";
import { Player } from "../player";

import Selection from "../../assets/selection.png";
import { AssemblerSprite } from "../../spriteSheets/assembler";
import { Position } from "../position";
import { SubscribablePosition } from "../position/subscribable";
import type { ChunkKey } from "../tagged";

type GlobalControllers = {
  keyboard: KeyboardController;
  chunkManager: ChunkManager;
}

type GameConstants = {
  tileSize: number;
  chunkSize: number;
  get chunkAbsolute(): number;
}

type GameState = {
  app: Application;
  worldPointer: Position;
  screenPointer: Position;
  worldOffset: SubscribablePosition;
  entities: Set<BaseEntity>;
  entitiesByChunk: Map<ChunkKey, Set<BaseEntity>>;
  activeChunkKeys: Set<ChunkKey>;
  activeChunksByKey: Map<ChunkKey, Chunk>;
}

export class Game {
  public initialized: boolean = false;
  public initializing: boolean = false;
  public world!: ContainerChild;

  // Game constants
  public readonly consts: GameConstants = {
    tileSize: 32,
    chunkSize: 32,
    get chunkAbsolute() { return this.tileSize * this.chunkSize; }
  };

  // Game state
  public readonly state: GameState;

  // Controllers
  public controllers: GlobalControllers = {
    keyboard: undefined!,
    chunkManager: undefined!
  }

  private chunkGenerator?: ChunkGenerator;

  constructor() {
    this.state = {
      app: new Application(),
      worldPointer: new Position(0, 0, "global"),
      screenPointer: new Position(0, 0, "screenspace"),
      worldOffset: new SubscribablePosition(0, 0),
      entities: new Set(),
      entitiesByChunk: new Map(),
      activeChunkKeys: new Set(),
      activeChunksByKey: new Map()
    };
  }

  public initialize = async (el: HTMLElement) => {
    if (this.initialized || this.initializing) {
      return;
    }

    this.initializing = true;

    // Initialize the application
    await this.state.app.init({
      resizeTo: window
    });

    this.world = new Container();
    this.state.app.stage.addChild(this.world);

    // Append the application canvas to the document body
    el.appendChild(this.state.app.canvas);

    const { width, height } = this.state.app.screen;
    const chunkDimensions = this.consts.chunkSize * this.consts.tileSize;

    this.controllers.keyboard = new KeyboardController();
    const player = new Player({
      position: new Position(100, 100),
      controller: this.controllers.keyboard
    })
    const chunkMeta = new ChunkManagerMeta({
      debug: true,
      loadRadius: {
        x: Math.floor(width / chunkDimensions / 2) + 4,
        y: Math.floor(height / chunkDimensions / 2) + 4
      }
    });

    // Create and store chunk generator reference for cleanup
    this.chunkGenerator = new ChunkGenerator(this.state.app, chunkMeta, this);

    this.controllers.chunkManager = new ChunkManager(
      this,
      this.world,
      chunkMeta,
      this.chunkGenerator,
      new ChunkLoader(this)
    )

    // Update the world the container offset based on the worldOffset.
    this.state.worldOffset.subscribeImmediately(({ x, y }) => {
      this.world.x = x;
      this.world.y = y;
    });

    // Set the stage based on the player position
    player.position.subscribeImmediately(({ x, y }) => {
      this.state.worldOffset.position = {
        x: -x + this.state.app.screen.width / 2,
        y: -y + this.state.app.screen.height / 2,
      }
    });

    // Enable interactivity!
    this.state.app.stage.eventMode = 'static';
    this.state.app.stage.hitArea = {
      contains: () => true
    }
    this.world.eventMode = 'static';
    this.world.hitArea = {
      contains: () => true
    }
    
    // Get the current pointer position
    this.state.app.stage.addEventListener("pointermove", ({ x, y }) => {
      this.state.worldPointer.x = x - this.state.worldOffset.x;
      this.state.worldPointer.y = y - this.state.worldOffset.y;
      this.state.screenPointer.x = x;
      this.state.screenPointer.y = y;
    })


    /***** PLAYGROUND START *****/
    
    // Load assets for sprite sheets
    await AssemblerSprite.load();
    await Assets.load(Selection);

    /***** PLAYGROUND END *****/

    this.controllers.chunkManager.subscribe(player.position);

    // Listen for animate update
    this.state.app.ticker.add((ticker) => {
      player.handleMovement(ticker);
    });

    // finish initialization
    this.initialized = true;
    this.initializing = false;
  }

  // Add cleanup method
  public destroy = () => {
    // Clean up chunk generator and its worker pool
    if (this.chunkGenerator) {
      this.chunkGenerator.destroy();
      this.chunkGenerator = undefined;
    }

    // Clean up PIXI application
    this.state.app.destroy(true, { children: true, texture: true });
    
    this.initialized = false;
  }

  // Helper methods for accessing game state
  public addEntity(entity: BaseEntity): void {
    this.state.entities.add(entity);
  }

  public removeEntity(entity: BaseEntity): void {
    this.state.entities.delete(entity);
  }

  public getEntities(): Set<BaseEntity> {
    return this.state.entities;
  }

  public setEntitiesForChunk(chunkKey: ChunkKey, entities: Set<BaseEntity>): void {
    this.state.entitiesByChunk.set(chunkKey, entities);
  }

  public getEntitiesForChunk(chunkKey: ChunkKey): Set<BaseEntity> | undefined {
    return this.state.entitiesByChunk.get(chunkKey);
  }

  public addActiveChunk(chunkKey: ChunkKey, chunk: Chunk): void {
    this.state.activeChunkKeys.add(chunkKey);
    this.state.activeChunksByKey.set(chunkKey, chunk);
  }

  public removeActiveChunk(chunkKey: ChunkKey): void {
    this.state.activeChunkKeys.delete(chunkKey);
    this.state.activeChunksByKey.delete(chunkKey);
  }

  public getActiveChunk(chunkKey: ChunkKey): Chunk | undefined {
    return this.state.activeChunksByKey.get(chunkKey);
  }

  public getActiveChunkKeys(): Set<ChunkKey> {
    return this.state.activeChunkKeys;
  }
}
