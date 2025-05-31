import { refreshHotbarItems } from "../../components/hotbar/store";
import { CharacterSprite } from "../../spriteSheets/character";
import { MeadowSprite } from "../../spriteSheets/meadow";
import { RunningSprite } from "../../spriteSheets/running";
// Import assembler factory to ensure infographic registration happens
import "../../entities/assembler/factory";
import { GameConstants } from "../../shared/constants";
// import { ChunkManager } from "../../systems/chunkManager"; // TODO: Convert to WebGL
import { KeyboardController } from "../keyboardController";
import { logger } from "../logger";
import { MultiplayerManager } from "../multiplayer/manager";
import { Player } from "../player/player_webgl";
import { Position } from "../position";
import { SubscribablePosition } from "../position/subscribable";
import { EntityManager } from "./entityManager";
import { WebGLRenderer } from "../../webgl/WebGLRenderer";
import { SceneNode } from "../../sprites/SceneGraph";

/***** TYPE DEFINITIONS *****/
type GlobalControllers = {
  keyboard: KeyboardController;
  // chunkManager: ChunkManager; // TODO: Convert to WebGL
  multiplayer?: MultiplayerManager;
}

type GameConstants = {
  tileSize: number;
  chunkSize: number;
  get chunkAbsolute(): number;
}

type GameState = {
  renderer: WebGLRenderer;
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
  public world!: SceneNode;

  // Game constants
  public readonly consts: GameConstants = {
    tileSize: GameConstants.TILE_SIZE,
    chunkSize: GameConstants.CHUNK_SIZE,
    get chunkAbsolute() { return this.tileSize * this.chunkSize; }
  };

  // Game state - using WebGL renderer instead of PIXI app
  public readonly state: GameState;

  // Managers
  public readonly entityManager: EntityManager;

  // Controllers
  public controllers: GlobalControllers = {
    keyboard: undefined!
    // chunkManager: undefined! // TODO: Convert to WebGL
  }

  // Animation frame request ID for game loop
  private gameLoopId: number | null = null;
  private lastFrameTime: number = 0;

  constructor() {
    this.state = {
      renderer: new WebGLRenderer(),
      worldPointer: new Position(0, 0, "global"),
      screenPointer: new Position(0, 0, "screenspace"),
      worldOffset: new SubscribablePosition(0, 0),
      zoom: 1.0,
      minZoom: 0.1,
      maxZoom: 3.0,
    };
    
    // TODO: Create WebGL-compatible EntityManager or skip for now
    // For now, we'll create a minimal compatible object
    this.entityManager = {
      clear: () => {},
      addEntity: () => {},
      removeEntity: () => {},
      getEntitiesInChunk: () => new Set(),
      addPlacementListener: () => {},
      removePlacementListener: () => {},
      placeEntity: () => {},
      unloadChunk: () => {},
      loadChunk: () => {}
    } as any;
  }

  public initialize = async (el: HTMLElement) => {
    if (this.initialized || this.initializing) {
      return;
    }

    this.initializing = true;

    // Initialize the WebGL renderer
    await this.initializeRenderer(el);
    
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

  // Legacy PIXI.js compatibility method - does nothing in WebGL implementation
  public initializePixi = async (): Promise<void> => {
    // This method exists for compatibility with EntityManager and MultiplayerManager
    // In the WebGL implementation, initialization happens in initializeRenderer
  }

  /***** RENDERER INITIALIZATION *****/
  private async initializeRenderer(el: HTMLElement) {
    await this.state.renderer.initialize(el);

    // Create root world scene node
    this.world = new SceneNode();
    this.state.renderer.setScene(this.world);
    
    // Setup resize handling
    this.setupResizeHandling();
  }

  private setupResizeHandling() {
    const handleResize = () => {
      this.state.renderer.handleResize();
    };

    window.addEventListener('resize', handleResize);
    
    // Initial resize
    handleResize();
  }

  /***** INTERACTIVITY SETUP *****/
  private setupInteractivity() {
    const canvas = this.state.renderer.getCanvas();
    
    // Track pointer position
    canvas.addEventListener("pointermove", (event) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      this.state.worldPointer.x = (x - this.state.worldOffset.x) / this.state.zoom;
      this.state.worldPointer.y = (y - this.state.worldOffset.y) / this.state.zoom;
      this.state.screenPointer.x = x;
      this.state.screenPointer.y = y;
    });

    // Add zoom functionality on wheel scroll
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      
      // Get center of screen
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Calculate world position at screen center
      const worldX = (centerX - this.state.worldOffset.x) / this.state.zoom;
      const worldY = (centerY - this.state.worldOffset.y) / this.state.zoom;
      
      // Calculate zoom delta
      const zoomDelta = event.deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(this.state.minZoom, Math.min(this.state.maxZoom, this.state.zoom * zoomDelta));
      
      // Update zoom
      this.state.zoom = newZoom;
      
      // Update world transform
      this.updateWorldTransform();
      
      // Adjust world offset to keep center position stable
      this.state.worldOffset.position = {
        x: centerX - worldX * this.state.zoom,
        y: centerY - worldY * this.state.zoom
      };
    });

    // Enable context menu prevention for right-click
    canvas.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
  }

  /***** SYSTEMS INITIALIZATION *****/
  /***** SYSTEMS INITIALIZATION *****/
  private async initializeSystems() {
    // Initialize controllers
    this.controllers.keyboard = new KeyboardController();
    
    // Create and setup player
    const player = this.setupPlayer();

    // TODO: ChunkManager will need to be converted to use WebGL
    // For now, we'll skip chunk manager initialization
    // this.controllers.chunkManager = new ChunkManager(this, this.world);

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
    
    // Set height to 2 tiles, maintain original aspect ratio
    const targetHeight = this.consts.tileSize * 2;
    const textureInfo = playerSprite.getTexture();
    if (textureInfo) {
      const frame = textureInfo.atlas.getFrame(textureInfo.frameName);
      if (frame) {
        const originalAspectRatio = frame.frame.width / frame.frame.height;
        playerSprite.setSize(targetHeight * originalAspectRatio, targetHeight);
      }
    }
    
    // Set high z-index to render on top of everything
    playerSprite.setZIndex(1000);
    
    // Subscribe to player position to update sprite position
    player.position.subscribeImmediately(({ x, y }) => {
      playerSprite.setPosition(x, y);
    });
    
    // Add to world container
    this.world.addChild(playerSprite);
    
    // Add click interaction (WebGL doesn't have built-in event system, would need custom implementation)
    // For now, we'll skip the interactive behavior - can be added later with custom hit testing

    return player;
  }

  /***** CAMERA SYSTEM *****/
  private setupCamera(player: Player) {
    // Update world container offset and scale based on worldOffset and zoom
    this.state.worldOffset.subscribeImmediately(({ x, y }) => {
      this.world.setPosition(x, y);
      this.updateWorldTransform();
    });

    // Center camera on player (accounting for zoom)
    player.position.subscribeImmediately(({ x, y }) => {
      const canvas = this.state.renderer.getCanvas();
      this.state.worldOffset.position = {
        x: -x * this.state.zoom + canvas.width / 2,
        y: -y * this.state.zoom + canvas.height / 2,
      };
    });
  }

  private updateWorldTransform() {
    this.world.setScale(this.state.zoom, this.state.zoom);
    this.state.renderer.updateProjection();
  }

  /***** MULTIPLAYER SETUP *****/
  private async setupMultiplayer(_player: Player): Promise<void> {
    // TODO: Convert MultiplayerManager to work with WebGL Game interface
    // For now, we'll skip multiplayer initialization in the WebGL version
    try {
      logger.log('Multiplayer disabled in WebGL version - will be re-enabled after conversion');
      
      // TODO: Re-enable when MultiplayerManager is updated for WebGL
      // this.controllers.multiplayer = new MultiplayerManager(this, player);
      // await this.controllers.multiplayer.initialize();
      // logger.log('Multiplayer enabled');
      
    } catch (error) {
      console.warn('Failed to initialize multiplayer, continuing in single-player mode:', error);
    }
  }

  /***** ASSET LOADING *****/
  private async loadAssets() {
    // Get WebGL context from renderer for sprite loading
    const gl = this.state.renderer.getGL();
    
    // Load sprite atlases for WebGL rendering with proper context
    await CharacterSprite.loadWithGL(gl);
    await RunningSprite.loadWithGL(gl);
    await MeadowSprite.loadWithGL(gl);
    
    // TODO: Handle additional assets like selection when UI systems are converted
    logger.log('WebGL sprite assets loaded successfully');
  }

  /***** GAME LOOP *****/
  private startGameLoop(player: Player) {
    const gameLoop = (currentTime: number) => {
      const deltaTime = currentTime - this.lastFrameTime;
      this.lastFrameTime = currentTime;
      
      // Convert to PIXI-style ticker delta (60fps = 1.0)
      const tickerDelta = deltaTime / (1000 / 60);
      
      // Create a ticker-like object for compatibility
      const ticker = {
        deltaTime: tickerDelta,
        elapsedMS: deltaTime,
        lastTime: this.lastFrameTime - deltaTime,
        speed: 1.0,
        started: true
      };
      
      // Update player movement
      player.handleMovement(this, ticker);
      
      // Render the frame
      this.state.renderer.render();
      
      // Schedule next frame
      this.gameLoopId = requestAnimationFrame(gameLoop);
    };
    
    // Start the game loop
    this.lastFrameTime = performance.now();
    this.gameLoopId = requestAnimationFrame(gameLoop);
  }

  /***** DESTRUCTION *****/
  public destroy = () => {
    // Stop game loop
    if (this.gameLoopId !== null) {
      cancelAnimationFrame(this.gameLoopId);
      this.gameLoopId = null;
    }

    // Clean up multiplayer system
    this.controllers.multiplayer?.destroy();

    // Clean up chunk manager and its dependencies
    // TODO: Re-enable when ChunkManager is converted to WebGL
    // this.controllers.chunkManager?.destroy();

    // Clean up entity manager
    this.entityManager.clear();

    // Clean up WebGL renderer
    this.state.renderer.destroy();
    
    this.initialized = false;
  }

  /***** COMPATIBILITY GETTERS *****/
  // These provide compatibility with existing code that expects PIXI properties
  public get screen() {
    const canvas = this.state.renderer.getCanvas();
    return {
      width: canvas.width,
      height: canvas.height
    };
  }

  public get canvas() {
    return this.state.renderer.getCanvas();
  }
}
