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
  public app: Application;
  public world!: ContainerChild;

  public controllers: GlobalControllers = {
    keyboard: undefined!,
    chunkManager: undefined!
  }

  public screenPointerX: number = 0;
  public screenPointerY: number = 0;
  public worldPointerX: number = 0;
  public worldPointerY: number = 0;

  constructor() {
    this.app = new Application();
  }

  public initialize = async (el: HTMLElement) => {
    if (this.initialized || this.initializing) {
      return;
    }

    this.initializing = true;

    // Initialize the application
    await this.app.init({
      resizeTo: window
    });

    this.world = new Container();

    this.app.stage.addChild(this.world);

    // Append the application canvas to the document body
    el.appendChild(this.app.canvas);

    const { width, height } = this.app.screen;
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
      new ChunkGenerator(this.app, chunkMeta),
      new ChunkLoader()
    )

    // Set the stage based on the player position
    player.position.subscribeImmediately(({ x, y }) => {
      this.world.x = -x + this.app.screen.width / 2;
      this.world.y = -y + this.app.screen.height / 2;
    });

    // Enable interactivity!
    this.world.eventMode = 'static';
    this.world.hitArea = {
      contains: () => true
    }
    
    // Get the current pointer position
    this.world.addEventListener("pointermove", ({ x, y }) => {
      this.worldPointerX = x - this.world.x;
      this.worldPointerY = y - this.world.y;
      this.screenPointerX = x;
      this.screenPointerY = y;
    })


    /***** PLAYGROUND START *****/



    
    
    // Load assets for sprite sheets
    await AssemblerSprite.load();
    await Assets.load(Selection);




    /***** PLAYGROUND END *****/

    this.controllers.chunkManager.subscribe(player.position);

    // Listen for animate update
    this.app.ticker.add((ticker) => {
      player.handleMovement(ticker);
    });

    // finish initialization
    this.initialized = true;
    this.initializing = false;
  }
}
