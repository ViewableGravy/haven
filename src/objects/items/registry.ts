import invariant from "tiny-invariant";
import type { InitialItemConfig, ItemConfig } from "./config";
import { duckConfig } from "./configs/duck";
import { fishingRodConfig } from "./configs/fishingrod";
import { largeBoxConfig } from "./configs/largebox";
import { stickConfig } from "./configs/stick";
import { twigConfig } from "./configs/twig";
import { Logger } from "../../utilities/Logger";

/***** ITEM CONFIGURATION REGISTRY *****/
class ItemConfigRegistry {
  private configs: Map<string, ItemConfig> = new Map();

  constructor() {
    try {
      // Register all imported configs
      this.registerConfig(stickConfig);
      this.registerConfig(twigConfig);
      this.registerConfig(duckConfig);
      this.registerConfig(fishingRodConfig);
      this.registerConfig(largeBoxConfig);

      Logger.log(`Loaded ${this.configs.size} item configurations`);
    } catch (error) {
      console.error('Failed to load item configurations:', error);
      throw error;
    }
  }

  /**
   * Register a single item configuration
   */
  private registerConfig(config: ItemConfig): void {
    if (!this.validateConfig(config)) {
      throw new Error(`Invalid configuration for item: ${config.id}`);
    }
    
    this.configs.set(config.id, config);
  }

  /**
   * Validate item configuration
   */
  private validateConfig(config: InitialItemConfig): boolean {
    const required = ['id', 'name', 'description', 'iconPath'];
    
    for (const field of required) {
      if (!config[field as keyof InitialItemConfig]) {
        console.error(`Missing required field '${field}' in item config:`, config);
        return false;
      }
    }

    // Validate optional fields
    if (config.maxStackSize !== undefined && config.maxStackSize < 1) {
      console.error(`Invalid maxStackSize for item '${config.id}': must be >= 1`);
      return false;
    }

    if (config.weight !== undefined && config.weight < 0) {
      console.error(`Invalid weight for item '${config.id}': must be >= 0`);
      return false;
    }

    if (config.rarity && !['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(config.rarity)) {
      console.error(`Invalid rarity for item '${config.id}': ${config.rarity}`);
      return false;
    }

    if (config.size) {
      if (config.size.width < 1 || config.size.height < 1) {
        console.error(`Invalid size for item '${config.id}': width and height must be >= 1`);
        return false;
      }
    }

    return true;
  }

  /**
   * Get item configuration by ID
   */
  getConfig(itemId: string): ItemConfig {
    const config = this.configs.get(itemId);
    invariant(config, "Item configuration not found for ID: " + itemId);
    return config;
  }

  /**
   * Get all available item IDs
   */
  getAllItemIds(): Array<string> {
    return Array.from(this.configs.keys());
  }

  /**
   * Check if an item configuration exists
   */
  hasConfig(itemId: string): boolean {
    return this.configs.has(itemId);
  }

  /**
   * Get the number of loaded configurations
   */
  getConfigCount(): number {
    return this.configs.size;
  }
}

/***** SINGLETON REGISTRY INSTANCE *****/
export const itemRegistry = new ItemConfigRegistry();

/***** EXPORTED REGISTRY FUNCTIONS *****/

export function getAllItemIds(): Array<string> {
  return itemRegistry.getAllItemIds();
}

export function hasItemConfig(itemId: string): boolean {
  return itemRegistry.hasConfig(itemId);
}

export function getItemConfigCount(): number {
  return itemRegistry.getConfigCount();
}
