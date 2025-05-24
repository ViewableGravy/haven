import { Application, Assets, Container, type ContainerChild } from "pixi.js";
import { ChunkManager } from "../chunkManager";
import { ChunkGenerator } from "../chunkManager/generator";
import { ChunkLoader } from "../chunkManager/loader";
import { ChunkManagerMeta } from "../chunkManager/meta";
import { KeyboardController } from "../keyboardController";
import { Player } from "../player";

import Selection from "../../assets/selection.png";
import { AssemblerSprite } from "../../spriteSheets/assembler";
import { store } from "../store";

type GlobalControllers = {
  keyboard: KeyboardController;
  chunkManager: ChunkManager;
}

export class Game {
  public initialized: boolean = false;
  public initializing: boolean = false;
  public world!: ContainerChild;

  public controllers: GlobalControllers = {
    keyboard: undefined!,
    chunkManager: undefined!
  }

  constructor() {
    store.game.app = new Application();
  }

  public initialize = async (el: HTMLElement) => {
    if (this.initialized || this.initializing) {
      return;
    }

    this.initializing = true;

    // Initialize the application
    await store.game.app.init({
      resizeTo: window
    });

    this.world = new Container();

    store.game.app.stage.addChild(this.world);

    // Append the application canvas to the document body
    el.appendChild(store.game.app.canvas);

    const { width, height } = store.game.app.screen;
    const chunkDimensions = store.consts.chunkSize * store.consts.tileSize;

    this.controllers.keyboard = new KeyboardController();
    const player = new Player({
      position: { x: 100, y: 100 },
      controller: this.controllers.keyboard
    })
    const chunkMeta = new ChunkManagerMeta({
      debug: true,
      loadRadius: {
        x: Math.floor(width / chunkDimensions / 2) + 4,
        y: Math.floor(height / chunkDimensions / 2) + 4
      }
    });

    this.controllers.chunkManager = new ChunkManager(
      this.world,
      chunkMeta,
      new ChunkGenerator(store.game.app, chunkMeta),
      new ChunkLoader()
    )

    // Update the world the container offset based on the worldOffset.
    store.game.worldOffset.subscribeImmediately(({ x, y }) => {
      this.world.x = x;
      this.world.y = y;
    });

    // Set the stage based on the player position
    player.position.subscribeImmediately(({ x, y }) => {
      store.game.worldOffset.position = {
        x: -x + store.game.app.screen.width / 2,
        y: -y + store.game.app.screen.height / 2,
      }
    });

    // Enable interactivity!
    store.game.app.stage.eventMode = 'static';
    store.game.app.stage.hitArea = {
      contains: () => true
    }
    this.world.eventMode = 'static';
    this.world.hitArea = {
      contains: () => true
    }
    
    // Get the current pointer position
    store.game.app.stage.addEventListener("pointermove", ({ x, y }) => {
      store.game.worldPointer.x = x - store.game.worldOffset.x;
      store.game.worldPointer.y = y - store.game.worldOffset.y;
      store.game.screenPointer.x = x;
      store.game.screenPointer.y = y;
    })


    /***** PLAYGROUND START *****/



    
    
    // Load assets for sprite sheets
    await AssemblerSprite.load();
    await Assets.load(Selection);




    /***** PLAYGROUND END *****/

    this.controllers.chunkManager.subscribe(player.position);

    // Listen for animate update
    store.game.app.ticker.add((ticker) => {
      player.handleMovement(ticker);
    });

    // finish initialization
    this.initialized = true;
    this.initializing = false;
  }
}
