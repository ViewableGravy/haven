/***** WORLD OBJECTS USAGE EXAMPLES *****/
import { WorldObjects } from "../worldObjects";
import type { Game } from "../utilities/game/game";

/***** USAGE EXAMPLES *****/

// Example 1: Creating a local spruce tree (not synced with server)
export function createLocalSpruceTreeExample(game: Game, x: number, y: number) {
  const spruceTree = WorldObjects.spruceTree.createLocal({
    x,
    y,
    game
  });
  
  console.log("Created local spruce tree:", spruceTree.uid);
  return spruceTree;
}

// Example 2: Creating a networked spruce tree (synced with server)
export async function createNetworkedSpruceTreeExample(game: Game, x: number, y: number) {
  try {
    const spruceTree = await WorldObjects.spruceTree.createNetworked({
      x,
      y,
      game
    });
    
    console.log("Created networked spruce tree:", spruceTree.uid);
    return spruceTree;
  } catch (error) {
    console.error("Failed to create networked spruce tree:", error);
    throw error;
  }
}

// Example 3: Converting a local entity to networked
export async function castSpruceTreeToNetworkedExample(game: Game, x: number, y: number) {
  // First create a local spruce tree
  const localTree = WorldObjects.spruceTree.createLocal({
    x,
    y,
    game
  });
  
  console.log("Created local tree:", localTree.uid);
  
  // Convert it to networked
  try {
    const networkedTree = await WorldObjects.spruceTree.castToNetworked(localTree, { game });
    console.log("Converted to networked tree:", networkedTree.uid);
    return networkedTree;
  } catch (error) {
    console.error("Failed to cast to networked:", error);
    throw error;
  }
}

// Example 4: Creating an assembler
export async function createAssemblerExample(game: Game, x: number, y: number) {
  const assembler = await WorldObjects.assembler.createNetworked({
    x,
    y,
    game
  });
  
  console.log("Created networked assembler:", assembler.uid);
  return assembler;
}

/***** CLICK HANDLER EXAMPLE *****/
export function setupEntityPlacementExample(game: Game) {
  // Example click handler for placing entities
  const handleClick = async (event: { x: number, y: number }) => {
    try {
      // Place a spruce tree at click location
      const tree = await WorldObjects.spruceTree.createNetworked({
        x: event.x,
        y: event.y,
        game
      });
      
      console.log(`Placed spruce tree at (${event.x}, ${event.y}), ID: ${tree.uid}`);
      return tree;
    } catch (error) {
      console.error("Failed to place spruce tree:", error);
      throw error;
    }
  };
  
  return handleClick;
}

/***** ADVANCED EXAMPLES *****/

// Example 5: Batch creation of entities
export async function createMultipleEntitiesExample(game: Game) {
  const entities = [];
  
  // Create a local preview first
  const previewTree = WorldObjects.spruceTree.createLocal({
    x: 100,
    y: 100,
    game
  });
  console.log("Created preview tree:", previewTree.uid);
  entities.push(previewTree);
  
  // Create networked entities
  try {
    const tree1 = await WorldObjects.spruceTree.createNetworked({
      x: 200,
      y: 200,
      game
    });
    
    const assembler1 = await WorldObjects.assembler.createNetworked({
      x: 300,
      y: 300,
      game
    });
    
    entities.push(tree1, assembler1);
    console.log("Created batch of entities:", entities.map(e => e.uid));
    
    return entities;
  } catch (error) {
    console.error("Failed to create batch entities:", error);
    throw error;
  }
}

// Example 6: Error handling and recovery
export async function robustEntityCreationExample(game: Game, x: number, y: number) {
  try {
    // Try to create networked first
    return await WorldObjects.spruceTree.createNetworked({ x, y, game });
  } catch (error) {
    console.warn("Networked creation failed, falling back to local:", error);
    
    // Fallback to local creation
    return WorldObjects.spruceTree.createLocal({ x, y, game });
  }
}
