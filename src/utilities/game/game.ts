import { Application, Assets } from "pixi.js";
import { ChunkManager } from "../chunkManager";
import { ChunkGenerator } from "../chunkManager/generator";
import { ChunkLoader } from "../chunkManager/loader";
import { ChunkManagerMeta } from "../chunkManager/meta";
import { KeyboardController } from "../keyboardController";
import { Player } from "../player";

import Selection from "../../assets/selection.png";
import { AssemblerSprite } from "../../spriteSheets/assembler";
import { store } from "../store";

export class Game {
  public initialized: boolean = false;
  public initializing: boolean = false;
  public app: Application;

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

    // Append the application canvas to the document body
    el.appendChild(this.app.canvas);

    const { width, height } = this.app.screen;
    const chunkSize = 16;
    const chunkDimensions = chunkSize * store.consts.tileSize;

    const controller = new KeyboardController();
    const player = new Player({
      position: { x: 100, y: 100 },
      controller
    })
    const chunkMeta = new ChunkManagerMeta({
      debug: true,
      chunkSize,
      loadRadius: {
        x: Math.floor(width / chunkDimensions / 2) + 4,
        y: Math.floor(height / chunkDimensions / 2) + 4
      }
    });

    const chunkManager = new ChunkManager(
      this.app.stage,
      chunkMeta,
      new ChunkGenerator(this.app, chunkMeta),
      new ChunkLoader()
    )

    // Set the stage based on the player position
    player.position.subscribeImmediately(({ x, y }) => {
      this.app.stage.x = -x + this.app.screen.width / 2;
      this.app.stage.y = -y + this.app.screen.height / 2;
    });

    // Enable interactivity!
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = {
      contains: () => true
    }
    
    // Get the current pointer position
    let pointerX = 0;
    let pointerY = 0;
    this.app.stage.addEventListener("pointermove", ({ x, y }) => {
      pointerX = x;
      pointerY = y;
    })


    /***** PLAYGROUND START *****/



    
    
    // Load assets for sprite sheets
    await AssemblerSprite.load();
    await Assets.load(Selection);




    /***** PLAYGROUND END *****/

    chunkManager.subscribe(player.position);

    // Listen for animate update
    this.app.ticker.add((ticker) => {
      player.handleMovement(ticker);
    });

    // finish initialization
    this.initialized = true;
    this.initializing = false;
  }
}
