import { Application, Assets, Container, type ContainerChild } from "pixi.js";
import Selection from "../../assets/selection.png";
import { refreshHotbarItems } from "../../components/hotbar/store";
import { AssemblerSprite } from "../../spriteSheets/assembler";
import { CharacterSprite } from "../../spriteSheets/character";
import { MeadowSprite } from "../../spriteSheets/meadow/meadow";
import { RunningSprite } from "../../spriteSheets/running";
import { SpruceTreeSprite } from "../../spriteSheets/spruceTree";
// Import assembler factory to ensure infographic registration happens
import "../../objects/assembler";
// Import spruce tree factory to ensure infographic registration happens
import "../../objects/spruceTree/factory";
import { GameConstants } from "../../shared/constants";
import { DesertSprite } from "../../spriteSheets/desert/desert";
import { ChunkManager } from "../../systems/chunkManager";
import { globalRenderTexturePool } from "../../systems/chunkManager/renderTexturePool";
import { KeyboardController } from "../keyboardController";
import { Logger } from "../Logger";
import { MultiplayerManager } from "../multiplayer/manager";
import { Player } from "../player";
import { Position } from "../position";
import { SubscribablePosition } from "../position/subscribable";
import { EntityManager } from "./entityManager";
import { World } from "./world";

/***** TYPE DEFINITIONS *****/
type GlobalControllers = {
  keyboard: KeyboardController;
  chunkManager: ChunkManager;
  multiplayer?: MultiplayerManager;
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
  public entityStage!: Container; // New main stage for entities

  // Game constants
  public readonly consts: GameConstants = {
    tileSize: GameConstants.TILE_SIZE,
    chunkSize: GameConstants.CHUNK_SIZE,
    get chunkAbsolute() { return this.tileSize * this.chunkSize; }
  };

  // Game state - simplified
  public readonly state: GameState;

  // Managers
  public readonly entityManager: EntityManager;
  public readonly worldManager: World;

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
    
    this.entityManager = new EntityManager(this);
    this.worldManager = new World(this);
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

    // Create main world container for chunks and entities
    this.world = new Container();
    this.world.sortableChildren = true; // Enable sorting for proper layering
    this.state.app.stage.addChild(this.world);
    
    // Initialize the layer system now that world container exists
    this.worldManager.initializeLayerSystem();
    
    // Create entity stage for reference (legacy compatibility)
    // Note: Entities now go on world container to inherit zoom transforms
    this.entityStage = new Container();
    this.entityStage.sortableChildren = true;
    
    el.appendChild(this.state.app.canvas);
  }

  private setupInteractivity() {
    document.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    })

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
      
      // Get center of screen
      const centerX = this.state.app.screen.width / 2;
      const centerY = this.state.app.screen.height / 2;
      
      // Calculate world position at screen center
      const worldX = (centerX - this.state.worldOffset.x) / this.state.zoom;
      const worldY = (centerY - this.state.worldOffset.y) / this.state.zoom;
      
      // Calculate zoom delta
      const zoomDelta = event.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(this.state.minZoom, Math.min(this.state.maxZoom, this.state.zoom * zoomDelta));
      
      // Update zoom
      this.state.zoom = newZoom;
      this.world.scale.set(this.state.zoom);
      
      // Adjust world offset to keep center position stable
      this.state.worldOffset.position = {
        x: centerX - worldX * this.state.zoom,
        y: centerY - worldY * this.state.zoom
      };
    });
  }

  /***** RENDER TEXTURE POOL SETUP *****/
  private initializeRenderTexturePool() {
    // Warm up the render texture pool with some initial textures
    // This helps reduce allocation spikes during gameplay
    globalRenderTexturePool.warmPool(5);
    Logger.log('Render texture pool initialized and warmed');
  }

  private initializeSystems = async () => {
    // Initialize controllers
    this.controllers.keyboard = new KeyboardController();
    
    // Initialize render texture pool
    this.initializeRenderTexturePool();
    
    // Create and setup player
    const player = this.setupPlayer();

    this.controllers.chunkManager = new ChunkManager(this, this.world);

    // Setup camera system
    this.setupCamera(player);

    // Initialize multiplayer system
    await this.setupMultiplayer(player);

    // Refresh hotbar items after all entity types are registered
    refreshHotbarItems();

    // Start the game loop with this player
    this.startGameLoop(player);

    return player;
  }

  /***** PLAYER SETUP SECTION *****/
  private setupPlayer(): Player {
    // Create player
    const player = new Player({
      position: new Position(100, 100),
      controller: this.controllers.keyboard
    });

    // Initialize the player's animated sprite
    const playerSprite = player.initializeSprite();
    
    // Center the sprite's anchor point
    playerSprite.anchor.set(0.5);
    
    // Set height to 2 tiles, maintain original aspect ratio
    const targetHeight = this.consts.tileSize * 2;
    const originalAspectRatio = playerSprite.texture.width / playerSprite.texture.height;
      playerSprite.height = targetHeight;
    playerSprite.width = targetHeight * originalAspectRatio;
    
    // Subscribe to player position to update sprite position
    player.position.subscribeImmediately(({ x, y }) => {
      playerSprite.x = x;
      playerSprite.y = y;
    });
      // Add to entity layer for proper depth sorting
    const layerManager = this.worldManager.getLayerManager();
    layerManager.addToLayer(playerSprite, 'entity');
    
    // Add interactive behavior
    playerSprite.eventMode = 'static';
    playerSprite.on('pointerdown', () => {
      Logger.log('Character clicked!');
    });

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

  /***** MULTIPLAYER SETUP *****/
  private async setupMultiplayer(player: Player): Promise<void> {
    try {
      this.controllers.multiplayer = new MultiplayerManager(this, player);
      await this.controllers.multiplayer.initialize();
      Logger.log('Multiplayer enabled');
      
      // Initialize chunk unloading after multiplayer is set up
      this.controllers.chunkManager.initializeUnloading();
      Logger.log('Chunk unloading system initialized');
    } catch (error) {
      console.warn('Failed to initialize multiplayer, continuing in single-player mode:', error);
      // Don't throw error - game should work without multiplayer
      
      // Still try to initialize chunk unloading in single-player mode
      // (though it won't work without a local player reference)
      this.controllers.chunkManager.initializeUnloading();
    }
  }

  private async loadAssets() {
    await AssemblerSprite.load();
    await CharacterSprite.load();
    await MeadowSprite.load();
    await DesertSprite.load();
    await RunningSprite.load();
    await SpruceTreeSprite.load();
    await Assets.load(Selection);
  }
  private startGameLoop(player: Player) {
    this.state.app.ticker.add((ticker) => {
      player.handleMovement(this, ticker);
      
      // Update entity layer sorting based on y-position
      this.worldManager.getLayerManager().updateEntitySorting();
    });
  }

  public destroy = () => {
    // Clean up keyboard controller event listeners
    this.controllers.keyboard?.destroy();
    
    // Clean up multiplayer system
    this.controllers.multiplayer?.destroy();

    // Clean up chunk manager and its dependencies
    this.controllers.chunkManager?.destroy();

    // Clean up render texture pool
    globalRenderTexturePool.destroy();
    Logger.log('Render texture pool cleared');

    // Clean up entity manager
    this.entityManager.clear();

    // Clean up PIXI application
    this.state.app.destroy(true, { children: true, texture: true });
    
    this.initialized = false;
  }
}
