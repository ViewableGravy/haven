/***** TYPE DEFINITIONS *****/
import { WebGLRenderer } from '../webgl/WebGLRenderer';
import { Transform } from '../webgl/Transform';
import { SceneGraph } from './SceneGraph';
import type { SceneNode } from './SceneGraph';
import { SpriteBatch } from './SpriteBatch';
import { SpriteAtlas } from './SpriteAtlas';

// Re-export SceneNode for external use
export type { SceneNode } from './SceneGraph';

export interface RenderOptions {
  camera?: Transform;
  alpha?: number;
}

/***** SPRITE RENDERER CLASS *****/
export class SpriteRenderer {
  private renderer: WebGLRenderer;
  private sceneGraph: SceneGraph;
  private spriteBatch: SpriteBatch;
  private camera: Transform;

  constructor(renderer: WebGLRenderer) {
    this.renderer = renderer;
    this.sceneGraph = new SceneGraph();
    this.spriteBatch = new SpriteBatch(renderer);
    this.camera = new Transform();
  }

  /***** SCENE MANAGEMENT *****/
  public getSceneGraph(): SceneGraph {
    return this.sceneGraph;
  }

  public createNode(): SceneNode {
    return this.sceneGraph.createNode();
  }

  public addToScene(node: SceneNode): void {
    this.sceneGraph.addToRoot(node);
  }

  public removeFromScene(node: SceneNode): void {
    this.sceneGraph.removeFromRoot(node);
  }

  public addChild(parent: SceneNode, child: SceneNode): void {
    this.sceneGraph.addChild(parent, child);
  }

  public removeChild(parent: SceneNode, child: SceneNode): void {
    this.sceneGraph.removeChild(parent, child);
  }

  /***** SPRITE CREATION *****/
  public createSprite(atlas: SpriteAtlas, frameName: string, width?: number, height?: number): SceneNode {
    const node = this.createNode();
    this.sceneGraph.setSprite(node, atlas, frameName, width, height);
    return node;
  }

  public setSpriteFrame(node: SceneNode, atlas: SpriteAtlas, frameName: string): void {
    this.sceneGraph.setSprite(node, atlas, frameName, node.sprite?.width, node.sprite?.height);
  }

  public setSpriteSize(node: SceneNode, width: number, height: number): void {
    this.sceneGraph.setSpriteSize(node, width, height);
  }

  public setSpriteTint(node: SceneNode, r: number, g: number, b: number, a = 1): void {
    this.sceneGraph.setSpriteTint(node, r, g, b, a);
  }

  /***** CAMERA MANAGEMENT *****/
  public setCamera(camera: Transform): void {
    this.camera = camera;
  }

  public getCamera(): Transform {
    return this.camera;
  }

  /***** RENDERING *****/
  public render(options: RenderOptions = {}): void {
    // Set camera if provided
    if (options.camera) {
      this.renderer.setCamera(options.camera);
    } else {
      this.renderer.setCamera(this.camera);
    }

    // Collect sprites by atlas for batching
    const atlasMap = this.sceneGraph.collectSprites();

    // Render each atlas batch
    this.spriteBatch.begin();
    
    for (const [atlas, sprites] of atlasMap.entries()) {
      if (!atlas.isReady()) continue;
      
      this.spriteBatch.addSprites(atlas, sprites);
    }
    
    this.spriteBatch.end();
  }

  /***** UTILITY METHODS *****/
  public getNodeCount(): number {
    return this.sceneGraph.getNodeCount();
  }

  public getSpriteCount(): number {
    return this.sceneGraph.getSpriteCount();
  }

  public findNodeBySprite(atlas: SpriteAtlas, frameName: string): SceneNode | undefined {
    return this.sceneGraph.findNodeBySprite(atlas, frameName);
  }

  public clear(): void {
    this.sceneGraph.clear();
  }

  /***** ANIMATION SUPPORT *****/
  public createAnimatedSprite(atlas: SpriteAtlas, frameNames: Array<string>, frameRate = 12): AnimatedSpriteNode {
    const node = this.createNode() as AnimatedSpriteNode;
    
    // Add animation properties
    node.animation = {
      atlas,
      frameNames,
      currentFrame: 0,
      frameRate,
      isPlaying: false,
      loop: true,
      lastFrameTime: 0,
    };

    // Set initial frame
    if (frameNames.length > 0) {
      this.sceneGraph.setSprite(node, atlas, frameNames[0]);
    }

    return node;
  }

  public playAnimation(node: AnimatedSpriteNode): void {
    if (node.animation) {
      node.animation.isPlaying = true;
      node.animation.lastFrameTime = performance.now();
    }
  }

  public stopAnimation(node: AnimatedSpriteNode): void {
    if (node.animation) {
      node.animation.isPlaying = false;
    }
  }

  public updateAnimations(_deltaTime: number): void {
    const currentTime = performance.now();
    
    this.sceneGraph.traverse((node) => {
      const animNode = node as AnimatedSpriteNode;
      if (!animNode.animation || !animNode.animation.isPlaying) return;

      const animation = animNode.animation;
      const timeSinceLastFrame = currentTime - animation.lastFrameTime;
      const frameTime = 1000 / animation.frameRate;

      if (timeSinceLastFrame >= frameTime) {
        animation.currentFrame++;
        
        if (animation.currentFrame >= animation.frameNames.length) {
          if (animation.loop) {
            animation.currentFrame = 0;
          } else {
            animation.currentFrame = animation.frameNames.length - 1;
            animation.isPlaying = false;
          }
        }

        // Update sprite frame
        const frameName = animation.frameNames[animation.currentFrame];
        this.setSpriteFrame(animNode, animation.atlas, frameName);
        
        animation.lastFrameTime = currentTime;
      }
    });
  }

  /***** CLEANUP *****/
  public destroy(): void {
    this.spriteBatch.destroy();
    this.sceneGraph.destroy();
  }
}

/***** ANIMATED SPRITE INTERFACE *****/
export interface AnimatedSpriteNode extends SceneNode {
  animation?: {
    atlas: SpriteAtlas;
    frameNames: Array<string>;
    currentFrame: number;
    frameRate: number;
    isPlaying: boolean;
    loop: boolean;
    lastFrameTime: number;
  };
}
