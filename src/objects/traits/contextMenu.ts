/***** TYPE DEFINITIONS *****/
import { Container, FederatedPointerEvent, Graphics, Text } from "pixi.js";
import type { GameObject } from "../base";
import { ContainerTrait } from "./container";

export interface ContextMenuOption {
  label: string;
  action: () => void;
}

interface ContextMenuData {
  options: Array<ContextMenuOption>;
  isOpen: boolean;
  menuContainer: Container | null;
  cleanupFunctions: Array<() => void>;
}

/***** CONTEXT MENU TRAIT *****/
export class ContextMenuTrait {
  private entity: GameObject;
  private data: ContextMenuData;

  constructor(entity: GameObject, options: Array<ContextMenuOption>) {
    this.entity = entity;
    this.data = {
      options,
      isOpen: false,
      menuContainer: null,
      cleanupFunctions: []
    };

    this.setupEventListeners();
  }

  /***** SETUP AND TEARDOWN *****/
  private setupEventListeners(): void {
    if (!ContainerTrait.is(this.entity)) {
      throw new Error('ContextMenuTrait requires entity to have ContainerTrait');
    }

    const container = this.entity.getTrait('container').container;
    
    // Enable interactive mode for right-click detection
    container.eventMode = 'dynamic';

    // Add right-click listener
    const rightClickHandler = (event: FederatedPointerEvent) => {
      if (event.button === 2) { // Right mouse button
        event.stopPropagation();
        this.showMenu(event.globalX, event.globalY);
      }
    };

    container.addEventListener('rightclick', rightClickHandler);
    
    // Store cleanup function
    this.data.cleanupFunctions.push(() => {
      container.removeEventListener('rightclick', rightClickHandler);
    });
  }

  /***** MENU DISPLAY *****/
  private showMenu(globalX: number, globalY: number): void {
    // Close existing menu if open
    if (this.data.isOpen) {
      this.hideMenu();
    }

    // Create menu container
    const menuContainer = new Container();
    this.data.menuContainer = menuContainer;
    this.data.isOpen = true;

    // Create background
    const background = new Graphics();
    const menuWidth = 120;
    const menuHeight = this.data.options.length * 30 + 10; // 30px per item + padding
    
    background.roundRect(0, 0, menuWidth, menuHeight, 6);
    background.fill({ color: 0x2a2a2a, alpha: 0.95 });
    background.stroke({ color: 0x555555, width: 1 });
    menuContainer.addChild(background);

    // Create menu items
    this.data.options.forEach((option, index) => {
      this.createMenuItem(menuContainer, option, index, menuWidth);
    });

    // Position menu at cursor
    menuContainer.x = globalX;
    menuContainer.y = globalY;
    menuContainer.zIndex = 10000; // Ensure menu appears on top

    // Add to world (assuming entity has access to world through container parent hierarchy)
    const entityContainer = this.entity.getTrait('container').container;
    let worldContainer = entityContainer.parent;
    
    // Traverse up to find the world container
    while (worldContainer && worldContainer.parent) {
      worldContainer = worldContainer.parent;
    }

    if (worldContainer) {
      worldContainer.addChild(menuContainer);
      worldContainer.sortableChildren = true;
    }

    // Setup click-away listener
    this.setupClickAwayListener();
  }

  private createMenuItem(menuContainer: Container, option: ContextMenuOption, index: number, menuWidth: number): void {
    const itemHeight = 30;
    const itemY = 5 + index * itemHeight;

    // Create item background for hover effect
    const itemBg = new Graphics();
    itemBg.roundRect(2, itemY, menuWidth - 4, itemHeight - 2, 3);
    itemBg.fill({ color: 0x3a3a3a, alpha: 0 }); // Transparent initially
    menuContainer.addChild(itemBg);

    // Create item text
    const itemText = new Text({
      text: option.label,
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xffffff
      }
    });
    
    itemText.x = 8;
    itemText.y = itemY + (itemHeight - itemText.height) / 2;
    menuContainer.addChild(itemText);

    // Create interactive area
    const interactiveArea = new Graphics();
    interactiveArea.rect(0, itemY, menuWidth, itemHeight);
    interactiveArea.fill({ color: 0x000000, alpha: 0 }); // Invisible but interactive
    interactiveArea.eventMode = 'static';
    interactiveArea.cursor = 'pointer';
    
    // Add hover effects
    interactiveArea.addEventListener('pointerenter', () => {
      itemBg.alpha = 1;
    });
    
    interactiveArea.addEventListener('pointerleave', () => {
      itemBg.alpha = 0;
    });
    
    // Add click handler
    interactiveArea.addEventListener('pointerdown', (event: FederatedPointerEvent) => {
      event.stopPropagation();
      option.action();
      this.hideMenu();
    });

    menuContainer.addChild(interactiveArea);
  }

  /***** MENU HIDING *****/
  private hideMenu(): void {
    if (!this.data.isOpen || !this.data.menuContainer) {
      return;
    }

    // Remove menu from world
    if (this.data.menuContainer.parent) {
      this.data.menuContainer.parent.removeChild(this.data.menuContainer);
    }

    // Destroy menu container and its children
    this.data.menuContainer.destroy({ children: true });
    this.data.menuContainer = null;
    this.data.isOpen = false;

    // Remove click-away listener
    this.removeClickAwayListener();
  }

  /***** CLICK AWAY HANDLING *****/
  private setupClickAwayListener(): void {
    const clickAwayHandler = (event: FederatedPointerEvent) => {
      // Check if click is outside menu
      if (this.data.menuContainer && !this.isPointInMenu(event.globalX, event.globalY)) {
        this.hideMenu();
      }
    };

    // Add listener to the world container
    const entityContainer = this.entity.getTrait('container').container;
    let worldContainer = entityContainer.parent;
    
    while (worldContainer && worldContainer.parent) {
      worldContainer = worldContainer.parent;
    }

    if (worldContainer) {
      worldContainer.eventMode = 'static';
      worldContainer.addEventListener('pointerdown', clickAwayHandler);
      
      // Store cleanup function
      this.data.cleanupFunctions.push(() => {
        worldContainer!.removeEventListener('pointerdown', clickAwayHandler);
      });
    }
  }

  private removeClickAwayListener(): void {
    // The cleanup will be handled by the stored cleanup functions
    // when the trait is destroyed
  }

  private isPointInMenu(globalX: number, globalY: number): boolean {
    if (!this.data.menuContainer) return false;
    
    const bounds = this.data.menuContainer.getBounds();
    return globalX >= bounds.x && 
           globalX <= bounds.x + bounds.width && 
           globalY >= bounds.y && 
           globalY <= bounds.y + bounds.height;
  }

  /***** PUBLIC METHODS *****/
  public updateOptions(options: Array<ContextMenuOption>): void {
    this.data.options = options;
    
    // If menu is currently open, close it (user can right-click again to see new options)
    if (this.data.isOpen) {
      this.hideMenu();
    }
  }

  public destroy(): void {
    // Hide menu if open
    this.hideMenu();
    
    // Run all cleanup functions
    this.data.cleanupFunctions.forEach((cleanup) => cleanup());
    this.data.cleanupFunctions = [];
  }

  /***** STATIC METHODS *****/
  static is(entity: GameObject): boolean {
    try {
      entity.getTrait('contextMenu');
      return true;
    } catch {
      return false;
    }
  }

  static updateOptions(entity: GameObject, options: Array<ContextMenuOption>): void {
    if (ContextMenuTrait.is(entity)) {
      entity.getTrait('contextMenu').updateOptions(options);
    }
  }

  static destroy(entity: GameObject): void {
    if (ContextMenuTrait.is(entity)) {
      entity.getTrait('contextMenu').destroy();
    }
  }
}
