/***** TYPE DEFINITIONS *****/
import { Transform } from '../webgl/Transform';
import { SpriteAtlas } from './SpriteAtlas';

export interface SpriteData {
  x: number;
  y: number;
  width: number;
  height: number;
  u1: number;
  v1: number;
  u2: number;
  v2: number;
  r: number;
  g: number;
  b: number;
  a: number;
  textureIndex: number;
}

export interface SceneNode {
  transform: Transform;
  visible: boolean;
  alpha: number;
  children: Array<SceneNode>;
  parent?: SceneNode;
  sprite?: {
    atlas: SpriteAtlas;
    frameName: string;
    width: number;
    height: number;
    tint: [number, number, number, number];
  };
}

/***** SCENE NODE CLASS *****/
export class SceneNode {
  public transform: Transform;
  public visible: boolean = true;
  public alpha: number = 1;
  public children: Array<SceneNode> = [];
  public parent?: SceneNode;
  public sprite?: {
    atlas: SpriteAtlas;
    frameName: string;
    width: number;
    height: number;
    tint: [number, number, number, number];
  };

  constructor() {
    this.transform = new Transform();
  }

  /***** TRANSFORM METHODS *****/
  public setPosition(x: number, y: number): void {
    this.transform.setPosition(x, y);
  }

  public getPosition(): { x: number; y: number } {
    return this.transform.getPosition();
  }

  public setScale(x: number, y: number = x): void {
    this.transform.setScale(x, y);
  }

  public getScale(): { x: number; y: number } {
    return this.transform.getScale();
  }

  public setRotation(rotation: number): void {
    this.transform.setRotation(rotation);
  }

  public getRotation(): number {
    return this.transform.getRotation();
  }

  /***** HIERARCHY METHODS *****/
  public addChild(child: SceneNode): void {
    if (child.parent) {
      child.parent.removeChild(child);
    }
    
    this.children.push(child);
    child.parent = this;
    child.transform.setParent(this.transform);
  }

  public removeChild(child: SceneNode): void {
    const index = this.children.indexOf(child);
    if (index >= 0) {
      this.children.splice(index, 1);
      child.parent = undefined;
      child.transform.setParent(undefined);
    }
  }

  /***** SPRITE METHODS *****/
  public setTexture(atlas: SpriteAtlas, frameName: string, width?: number, height?: number): void {
    const frame = atlas.getFrame(frameName);
    if (!frame) {
      console.warn(`Frame ${frameName} not found in atlas`);
      return;
    }

    this.sprite = {
      atlas,
      frameName,
      width: width ?? frame.frame.width,
      height: height ?? frame.frame.height,
      tint: [1, 1, 1, 1],
    };
  }

  public getTexture(): { atlas: SpriteAtlas; frameName: string } | null {
    if (!this.sprite) return null;
    return { atlas: this.sprite.atlas, frameName: this.sprite.frameName };
  }

  public setSize(width: number, height: number): void {
    if (this.sprite) {
      this.sprite.width = width;
      this.sprite.height = height;
    }
  }

  public getSize(): { width: number; height: number } {
    if (this.sprite) {
      return { width: this.sprite.width, height: this.sprite.height };
    }
    return { width: 0, height: 0 };
  }

  public setTint(r: number, g: number, b: number, a = 1): void {
    if (this.sprite) {
      this.sprite.tint = [r, g, b, a];
    }
  }

  public getTint(): [number, number, number, number] {
    if (this.sprite) {
      return this.sprite.tint;
    }
    return [1, 1, 1, 1];
  }

  /***** RENDER ORDER *****/
  public setZIndex(zIndex: number): void {
    // Store zIndex in transform for sorting
    (this.transform as any).zIndex = zIndex;
  }

  public getZIndex(): number {
    return (this.transform as any).zIndex ?? 0;
  }

  /***** UTILITY METHODS *****/
  public destroy(): void {
    // Remove from parent
    if (this.parent) {
      this.parent.removeChild(this);
    }

    // Destroy all children
    for (const child of this.children) {
      child.destroy();
    }
    this.children.length = 0;

    // Clear sprite reference
    this.sprite = undefined;
  }
}

/***** SCENE GRAPH CLASS *****/
export class SceneGraph {
  private root: SceneNode;

  constructor() {
    this.root = new SceneNode();
  }

  /***** NODE MANAGEMENT *****/
  public createNode(): SceneNode {
    return new SceneNode();
  }

  public addChild(parent: SceneNode, child: SceneNode): void {
    parent.addChild(child);
  }

  public removeChild(parent: SceneNode, child: SceneNode): void {
    parent.removeChild(child);
  }

  public addToRoot(child: SceneNode): void {
    this.root.addChild(child);
  }

  public removeFromRoot(child: SceneNode): void {
    this.root.removeChild(child);
  }

  public getRoot(): SceneNode {
    return this.root;
  }

  /***** SPRITE OPERATIONS *****/
  public setSprite(node: SceneNode, atlas: SpriteAtlas, frameName: string, width?: number, height?: number): void {
    node.setTexture(atlas, frameName, width, height);
  }

  public setSpriteSize(node: SceneNode, width: number, height: number): void {
    node.setSize(width, height);
  }

  public setSpriteTint(node: SceneNode, r: number, g: number, b: number, a = 1): void {
    node.setTint(r, g, b, a);
  }

  /***** TRAVERSAL *****/
  public traverse(callback: (node: SceneNode, worldTransform: Transform, worldAlpha: number) => void): void {
    this.traverseNode(this.root, this.root.transform, 1, callback);
  }

  private traverseNode(
    node: SceneNode, 
    worldTransform: Transform, 
    worldAlpha: number, 
    callback: (node: SceneNode, worldTransform: Transform, worldAlpha: number) => void
  ): void {
    if (!node.visible) return;

    const nodeWorldAlpha = worldAlpha * node.alpha;
    
    callback(node, worldTransform, nodeWorldAlpha);
    
    // Traverse children
    for (const child of node.children) {
      this.traverseNode(child, child.transform, nodeWorldAlpha, callback);
    }
  }

  public collectSprites(atlasMap: Map<SpriteAtlas, Array<SpriteData>> = new Map()): Map<SpriteAtlas, Array<SpriteData>> {
    this.traverse((node, worldTransform, worldAlpha) => {
      if (!node.sprite) return;

      const { atlas, frameName, width, height, tint } = node.sprite;
      const textureCoords = atlas.getTextureCoords(frameName);
      
      if (!textureCoords) return;

      // Get world transform matrix
      const matrix = worldTransform.getWorldMatrix();
      
      // Calculate sprite corners in world space
      const x1 = 0;
      const y1 = 0;
      const x2 = width;
      const y2 = height;
      
      // Transform corners
      const corners = [
        [x1, y1], [x2, y1], [x2, y2], [x1, y2]
      ].map(([x, y]) => {
        const worldX = matrix[0] * x + matrix[3] * y + matrix[6];
        const worldY = matrix[1] * x + matrix[4] * y + matrix[7];
        return [worldX, worldY];
      });

      // Create sprite data for batching
      const spriteData: SpriteData = {
        x: corners[0][0],
        y: corners[0][1],
        width: corners[1][0] - corners[0][0],
        height: corners[2][1] - corners[1][1],
        u1: textureCoords[0],
        v1: textureCoords[1],
        u2: textureCoords[4],
        v2: textureCoords[5],
        r: tint[0],
        g: tint[1],
        b: tint[2],
        a: tint[3] * worldAlpha,
        textureIndex: 0, // Will be set by the batch renderer
      };

      // Add to atlas batch
      if (!atlasMap.has(atlas)) {
        atlasMap.set(atlas, []);
      }
      atlasMap.get(atlas)!.push(spriteData);
    });

    return atlasMap;
  }

  /***** UTILITIES *****/
  public findNodeBySprite(atlas: SpriteAtlas, frameName: string): SceneNode | undefined {
    let found: SceneNode | undefined;
    
    this.traverse((node) => {
      if (node.sprite?.atlas === atlas && node.sprite?.frameName === frameName) {
        found = node;
      }
    });
    
    return found;
  }

  public getNodeCount(): number {
    let count = 0;
    this.traverse(() => count++);
    return count;
  }

  public getSpriteCount(): number {
    let count = 0;
    this.traverse((node) => {
      if (node.sprite) count++;
    });
    return count;
  }

  /***** CLEANUP *****/
  public clear(): void {
    this.root.children.length = 0;
  }

  public destroy(): void {
    this.clear();
  }
}
