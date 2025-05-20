import { Application, Graphics } from "pixi.js";
import { ChunkManager } from "../chunkManager";
import { ChunkGenerator } from "../chunkManager/generator";
import { ChunkLoader } from "../chunkManager/loader";
import { ChunkManagerMeta } from "../chunkManager/meta";
import { KeyboardController } from "../keyboardController";
import { Player } from "../player";

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
    this.app.ticker.maxFPS = 0;

    // Append the application canvas to the document body
    el.appendChild(this.app.canvas);

    const { width, height } = this.app.screen;
    const chunkSize = 256;

    const controller = new KeyboardController();
    const player = new Player({
      position: { x: 100, y: 100 }
    })
    const chunkMeta = new ChunkManagerMeta({
      debug: true,
      chunkSize,
      loadRadius: {
        x: Math.floor(width / chunkSize / 2) + 4,
        y: Math.floor(height / chunkSize / 2) + 4
      }
    });

    const chunkLoader = new ChunkManager(
      this.app.stage,
      chunkMeta,
      new ChunkGenerator(this.app, chunkMeta),
      new ChunkLoader()
    )

    chunkLoader.subscribe(player.position);

    player.position.subscribeImmediately(({ x, y }) => {
      this.app.stage.x = -x + this.app.screen.width / 2;
      this.app.stage.y = -y + this.app.screen.height / 2;
    });

    // Enable interactivity!
    this.app.stage.eventMode = 'static';
    this.app.stage.hitArea = {
      contains: () => true
    }

    const graphics = new Graphics({
      zIndex: 2,
    })
      .rect(0, 0, 16, 16)
      .stroke({ color: 0xFF0000, alpha: 0.5, width: 1 })

    this.app.stage.addChild(graphics);

    let pointerX = 0;
    let pointerY = 0;
    this.app.stage.addEventListener("pointermove", ({ x, y }) => {
      pointerX = x;
      pointerY = y;
    })

    // Listen for animate update
    this.app.ticker.add((time) => {
      const speed = 50 * time.deltaTime;
      if (controller.keys.right.pressed) {
        player.position.x += speed;
      }
      if (controller.keys.left.pressed) {
        player.position.x -= speed;
      }
      if (controller.keys.up.pressed) {
        player.position.y -= speed;
      }
      if (controller.keys.down.pressed) {
        player.position.y += speed;
      }

      const newX = pointerX + player.position.x - (this.app.screen.width / 2);
      const newY = pointerY + player.position.y - (this.app.screen.height / 2);

      graphics.position.set(
        Math.floor(newX / 16) * 16,
        Math.floor(newY / 16) * 16
      )
    });

    this.initialized = true;
    this.initializing = false;
  }
}
