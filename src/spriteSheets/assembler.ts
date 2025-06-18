import { Assets, Sprite, Spritesheet, Texture } from "pixi.js";
import invariant from "tiny-invariant";
import Assembler from '../assets/assembling-machine-1.png';

export class AssemblerSprite {
  private static __spriteSheet: Spritesheet | null = null;

  public static load = async () => {
    // Load the asset sheet
    await Assets.load(AssemblerSprite.atlas.meta.image);

    // Create a spritesheet
    const assemblerSpriteSheet = new Spritesheet(
      Texture.from(AssemblerSprite.atlas.meta.image),
      AssemblerSprite.atlas
    );

    // Parse the spritesheet
    await assemblerSpriteSheet.parse();

    // Set the sprite sheet
    AssemblerSprite.__spriteSheet = assemblerSpriteSheet;
  }

  public static getSpriteSheet = () => {
    invariant(AssemblerSprite.__spriteSheet, "Sprite sheet not loaded");
    return AssemblerSprite.__spriteSheet;
  }

  public static createSprite = (name: keyof typeof AssemblerSprite.atlas['frames']) => {
    invariant(AssemblerSprite.__spriteSheet, "Sprite sheet not loaded");
    return new Sprite(
      AssemblerSprite.__spriteSheet.textures[name]
    );
  }

  public static atlas = {
    frames: {
      "assembling-machine-1": {
        frame: { x: 0, y: 0, w: 200, h: 200 },
        sourceSize: { w: 180, h: 180 },
        spriteSourceSize: { x: -20, y: -25, w: 200, h: 200 },
      }
    },
    meta: {
      image: Assembler,
      size: { w: 1712, h: 904 },
      scale: 1
    },
    animations: {
      assemble: []
    }
  }
}