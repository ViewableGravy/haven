import { Application, Assets, Container, type ContainerChild } from "pixi.js";
import Selection from "../../assets/selection.png";
import { AssemblerSprite } from "../../spriteSheets/assembler";
import { ChunkManager } from "../chunkManager";
import { ChunkGenerator } from "../chunkManager/generator";
import { ChunkLoader } from "../chunkManager/loader";
import { ChunkManagerMeta } from "../chunkManager/meta";
import { KeyboardController } from "../keyboardController";
import { Player } from "../player";
import { Position } from "../position";
import { SubscribablePosition } from "../position/subscribable";
import { EntityManager } from "./entityManager";

/***** TYPE DEFINITIONS *****/
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
  zoom: number;
  minZoom: number;
  maxZoom: number;
}

/***** COMPONENT START *****/
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

  // Game state - simplified
  public readonly state: GameState;

  // Managers
  public readonly entityManager: EntityManager;

  // Controllers
  public controllers: GlobalControllers = {
    keyboard: undefined!,
    chunkManager: undefined!
  }

  constructor() {
    this.state = {
      app: new Application(),
      worldPointer: new Position(0, 0, "global"),
      screenPointer: new Position(0, 0, "screenspace"),
      worldOffset: new SubscribablePosition(0, 0),
      zoom: 1.0,
      minZoom: 0.1,
      maxZoom: 3.0,
    };
    
    this.entityManager = new EntityManager();
  }

  public initialize = async (el: HTMLElement) => {
    if (this.initialized || this.initializing) {
      return;
    }

    this.initializing = true;

    // Initialize the PIXI application
    await this.initializePixi(el);
    
    // Setup user input handling
    this.setupInteractivity();
    
    // Load assets BEFORE initializing systems that use them
    await this.loadAssets();
    
    // Initialize game systems (this also starts the game loop)
    await this.initializeSystems();

    // Finish initialization
    this.initialized = true;
    this.initializing = false;
  }

  private async initializePixi(el: HTMLElement) {
    await this.state.app.init({
      resizeTo: window
    });

    this.world = new Container();
    this.state.app.stage.addChild(this.world);
    
    el.appendChild(this.state.app.canvas);
  }

  private setupInteractivity() {
    // Enable interactivity
    this.state.app.stage.eventMode = 'static';
    this.state.app.stage.hitArea = { contains: () => true };
    this.world.eventMode = 'static';
    this.world.hitArea = { contains: () => true };
    
    // Track pointer position
    this.state.app.stage.addEventListener("pointermove", ({ x, y }) => {
      this.state.worldPointer.x = (x - this.state.worldOffset.x) / this.state.zoom;
      this.state.worldPointer.y = (y - this.state.worldOffset.y) / this.state.zoom;
      this.state.screenPointer.x = x;
      this.state.screenPointer.y = y;
    });

    // Add zoom functionality on wheel scroll
    this.state.app.stage.addEventListener("wheel", (event) => {
      event.preventDefault();
      
      // Get mouse position before zoom
      const mouseX = event.x;
      const mouseY = event.y;
      
      // Calculate world position at mouse cursor
      const worldX = (mouseX - this.state.worldOffset.x) / this.state.zoom;
      const worldY = (mouseY - this.state.worldOffset.y) / this.state.zoom;
      
      // Calculate zoom delta
      const zoomDelta = event.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(this.state.minZoom, Math.min(this.state.maxZoom, this.state.zoom * zoomDelta));
      
      // Update zoom
      this.state.zoom = newZoom;
      this.world.scale.set(this.state.zoom);
      
      // Adjust world offset to keep mouse position stable
      this.state.worldOffset.position = {
        x: mouseX - worldX * this.state.zoom,
        y: mouseY - worldY * this.state.zoom
      };
    });
  }

  private async initializeSystems() {
    const { width, height } = this.state.app.screen;
    const chunkDimensions = this.consts.chunkSize * this.consts.tileSize;

    // Initialize controllers
    this.controllers.keyboard = new KeyboardController();
    
    // Create player
    const player = new Player({
      position: new Position(100, 100),
      controller: this.controllers.keyboard
    });

    // Initialize chunk system
    const chunkMeta = new ChunkManagerMeta({
      debug: true,
      loadRadius: {
        x: Math.floor(width / chunkDimensions / 2) + 4,
        y: Math.floor(height / chunkDimensions / 2) + 4
      }
    });

    this.controllers.chunkManager = new ChunkManager(
      this,
      this.world,
      new ChunkGenerator(this.state.app, chunkMeta, this),
      chunkMeta,
      new ChunkLoader(this)
    );

    // Setup camera system
    this.setupCamera(player);
    
    // Subscribe chunk manager to player position
    this.controllers.chunkManager.subscribe(player.position);

    // Start the game loop with this player
    this.startGameLoop(player);

    return player;
  }

  private setupCamera(player: Player) {
    // Update world container offset and scale based on worldOffset and zoom
    this.state.worldOffset.subscribeImmediately(({ x, y }) => {
      this.world.x = x;
      this.world.y = y;
      this.world.scale.set(this.state.zoom);
    });

    // Center camera on player (accounting for zoom)
    player.position.subscribeImmediately(({ x, y }) => {
      this.state.worldOffset.position = {
        x: -x * this.state.zoom + this.state.app.screen.width / 2,
        y: -y * this.state.zoom + this.state.app.screen.height / 2,
      };
    });
  }

  private async loadAssets() {
    await AssemblerSprite.load();
    await Assets.load(Selection);
  }

  private startGameLoop(player: Player) {
    this.state.app.ticker.add((ticker) => {
      player.handleMovement(this, ticker);
    });
  }

  public destroy = () => {
    // Clean up chunk manager and its dependencies
    this.controllers.chunkManager?.destroy();

    // Clean up entity manager
    this.entityManager.clear();

    // Clean up PIXI application
    this.state.app.destroy(true, { children: true, texture: true });
    
    this.initialized = false;
  }
}
