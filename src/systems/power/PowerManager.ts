/***** IMPORTS *****/
import type { GameObject } from "../../objects/base";
import { PoweredTrait } from "../../objects/traits/powered";
import type { Game } from "../../utilities/game/game";
import { PowerGraph } from "./PowerGraph";
import type { PowerSystemNamespace } from "./types";

/***** TYPE DEFINITIONS *****/
type PowerType = PowerSystemNamespace.PowerType;
type PowerUpdateEvent = PowerSystemNamespace.PowerUpdateEvent;

/***** POWER MANAGER CLASS *****/
/**
 * PowerManager is the global coordinator for all power networks in the game.
 * It manages PowerGraph instances, handles entity registration/removal,
 * and coordinates the simulation tick evaluation of all power networks.
 */
export class PowerManager {
  private powerGraphs: Map<string, PowerGraph> = new Map();
  private entityToGraphMap: Map<string, string> = new Map();
  private graphIdCounter: number = 0;
  private updateListeners: Set<(event: PowerUpdateEvent) => void> = new Set();
  private entityPowerCallbacks?: Map<string, Set<(isPowered: boolean) => void>>;

  constructor(_game: Game) {
    // Game reference reserved for future use (multiplayer sync, etc.)
  }

  /***** ENTITY REGISTRATION *****/
  public registerEntity(entity: GameObject): void {
    if (!entity.hasTrait('powered')) {
      throw new Error(`Entity ${entity.uid} does not have PoweredTrait`);
    }

    const poweredTrait = entity.getTrait('powered');
    const powerType = poweredTrait.powerType;

    // Check if entity is already registered
    if (this.entityToGraphMap.has(entity.uid)) {
      console.warn(`Entity ${entity.uid} is already registered with PowerManager`);
      return;
    }

    // For now, create a new graph for each entity
    // Later, we'll implement connection logic to merge graphs
    const graphId = this.generateGraphId(powerType);
    const powerGraph = new PowerGraph(graphId, powerType);
    
    powerGraph.addEntity(entity);
    this.powerGraphs.set(graphId, powerGraph);
    this.entityToGraphMap.set(entity.uid, graphId);
    
    // Set the graph ID on the powered trait
    poweredTrait.setPowerGraphId(graphId);
  }
  
  public unregisterEntity(entityId: string): void {
    const graphId = this.entityToGraphMap.get(entityId);
    if (!graphId) {
      return;
    }

    const powerGraph = this.powerGraphs.get(graphId);
    if (!powerGraph) {
      this.entityToGraphMap.delete(entityId);
      return;
    }

    // Clear the graph ID from the powered trait before removing
    const entity = powerGraph.getEntities().find((e) => e.uid === entityId);
    if (entity && entity.hasTrait('powered')) {
      entity.getTrait('powered').setPowerGraphId(null);
    }

    // Remove entity from graph and handle potential fragmentation
    const resultingGraphs = powerGraph.removeEntity(entityId);
    
    // Remove the original graph
    this.powerGraphs.delete(graphId);
    this.entityToGraphMap.delete(entityId);

    // Add any resulting fragment graphs
    for (const fragmentGraph of resultingGraphs) {
      if (fragmentGraph.getEntityCount() > 0) {
        this.powerGraphs.set(fragmentGraph.graphId, fragmentGraph);
        
        // Update entity mappings and graph IDs for fragment
        for (const fragmentEntity of fragmentGraph.getEntities()) {
          this.entityToGraphMap.set(fragmentEntity.uid, fragmentGraph.graphId);
          if (fragmentEntity.hasTrait('powered')) {
            fragmentEntity.getTrait('powered').setPowerGraphId(fragmentGraph.graphId);
          }
        }
      }
    }
  }

  /***** CONNECTION MANAGEMENT *****/
  public connectEntities(fromEntityId: string, toEntityId: string): void {
    const fromGraphId = this.entityToGraphMap.get(fromEntityId);
    const toGraphId = this.entityToGraphMap.get(toEntityId);

    if (!fromGraphId || !toGraphId) {
      throw new Error('Both entities must be registered before connecting');
    }

    const fromGraph = this.powerGraphs.get(fromGraphId)!;
    const toGraph = this.powerGraphs.get(toGraphId)!;

    // If entities are in different graphs, merge them
    if (fromGraphId !== toGraphId) {
      this.mergeGraphs(fromGraph, toGraph);
    }

    // Add the connection
    const mergedGraph = this.powerGraphs.get(fromGraphId) || this.powerGraphs.get(toGraphId);
    if (mergedGraph) {
      mergedGraph.addConnection(fromEntityId, toEntityId, 'output');
      mergedGraph.addConnection(toEntityId, fromEntityId, 'input');
    }
  }

  public disconnectEntities(fromEntityId: string, toEntityId: string): void {
    const graphId = this.entityToGraphMap.get(fromEntityId);
    if (!graphId) {
      return;
    }

    const powerGraph = this.powerGraphs.get(graphId);
    if (!powerGraph) {
      return;
    }

    powerGraph.removeConnection(fromEntityId, toEntityId);
    powerGraph.removeConnection(toEntityId, fromEntityId);

    // Check if disconnection caused fragmentation
    // This is a simplified approach - in practice, we'd need more sophisticated
    // connectivity analysis after disconnection
    this.recheckGraphConnectivity(graphId);
  }
  /***** GRAPH MANAGEMENT *****/
  private mergeGraphs(graph1: PowerGraph, graph2: PowerGraph): void {
    if (graph1.powerType !== graph2.powerType) {
      throw new Error('Cannot merge graphs with different power types');
    }

    // Keep the first graph, merge second into it
    const targetGraph = graph1;
    const sourceGraph = graph2;

    // Move all entities from source to target
    for (const entity of sourceGraph.getEntities()) {
      targetGraph.addEntity(entity);
      this.entityToGraphMap.set(entity.uid, targetGraph.graphId);
      
      // Update the graph ID on the powered trait
      if (entity.hasTrait('powered')) {
        entity.getTrait('powered').setPowerGraphId(targetGraph.graphId);
      }

      // Copy connections
      const connections = sourceGraph.getConnections(entity.uid);
      for (const connection of connections) {
        if (targetGraph.hasEntity(connection.entityId)) {
          targetGraph.addConnection(entity.uid, connection.entityId, connection.connectionType);
        }
      }
    }

    // Remove the source graph
    this.powerGraphs.delete(sourceGraph.graphId);
  }
  private recheckGraphConnectivity(graphId: string): void {
    const powerGraph = this.powerGraphs.get(graphId);
    if (!powerGraph) {
      return;
    }

    // Force a fragmentation check by removing and re-adding a dummy entity
    // In a real implementation, this would be more sophisticated
    const entities = powerGraph.getEntities();
    if (entities.length > 1) {
      const fragments = powerGraph.removeEntity(entities[0].uid);
      
      if (fragments.length > 1) {
        // Graph fragmented, handle the split
        this.powerGraphs.delete(graphId);
        
        for (const fragment of fragments) {
          if (fragment.getEntityCount() > 0) {
            this.powerGraphs.set(fragment.graphId, fragment);
            
            for (const entity of fragment.getEntities()) {
              this.entityToGraphMap.set(entity.uid, fragment.graphId);
              // Update the graph ID on the powered trait
              if (entity.hasTrait('powered')) {
                entity.getTrait('powered').setPowerGraphId(fragment.graphId);
              }
            }
          }
        }
      } else {
        // No fragmentation, add the entity back
        fragments[0].addEntity(entities[0]);
      }
    }
  }

  /***** SIMULATION TICK *****/
  public evaluateAllGraphs(): void {
    const updateEvents: Array<PowerUpdateEvent> = [];

    for (const powerGraph of this.powerGraphs.values()) {
      const result = powerGraph.evaluate();
      
      // Check for power state changes and create update events
      for (const [entityId, newPowerState] of result.entityStates) {
        const entity = powerGraph.getEntities().find((e) => e.uid === entityId);
        if (!entity) continue;

        const oldPowerState = this.getEntityPowerState(entityId);
        
        if (oldPowerState !== newPowerState) {
          updateEvents.push({
            entityId,
            oldPowerState,
            newPowerState,
            graphId: result.graphId
          });
        }
      }
    }

    // Notify listeners of power state changes
    for (const event of updateEvents) {
      this.notifyUpdateListeners(event);
      this.notifyEntityPowerStateChange(event.entityId, event.newPowerState);
    }
  }

  /***** EVENT HANDLING *****/
  public onPowerUpdate(listener: (event: PowerUpdateEvent) => void): void {
    this.updateListeners.add(listener);
  }

  public offPowerUpdate(listener: (event: PowerUpdateEvent) => void): void {
    this.updateListeners.delete(listener);
  }

  private notifyUpdateListeners(event: PowerUpdateEvent): void {
    for (const listener of this.updateListeners) {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in power update listener:', error);
      }
    }
  }

  /***** ENTITY-SPECIFIC EVENT HANDLING *****/
  public onEntityPowerStateChange(entityId: string, callback: (isPowered: boolean) => void): void {
    // Store entity-specific callbacks for power state changes
    if (!this.entityPowerCallbacks) {
      this.entityPowerCallbacks = new Map();
    }
    
    if (!this.entityPowerCallbacks.has(entityId)) {
      this.entityPowerCallbacks.set(entityId, new Set());
    }
    
    this.entityPowerCallbacks.get(entityId)!.add(callback);
  }

  public offEntityPowerStateChange(entityId: string, callback: (isPowered: boolean) => void): void {
    if (!this.entityPowerCallbacks) {
      return;
    }
    
    const callbacks = this.entityPowerCallbacks.get(entityId);
    if (callbacks) {
      callbacks.delete(callback);
      if (callbacks.size === 0) {
        this.entityPowerCallbacks.delete(entityId);
      }
    }
  }

  private notifyEntityPowerStateChange(entityId: string, isPowered: boolean): void {
    if (!this.entityPowerCallbacks) {
      return;
    }
    
    const callbacks = this.entityPowerCallbacks.get(entityId);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          callback(isPowered);
        } catch (error) {
          console.error(`Error in entity power state callback for ${entityId}:`, error);
        }
      }
    }
  }

  /***** UTILITY METHODS *****/
  private generateGraphId(powerType: PowerType): string {
    return `${powerType}-graph-${++this.graphIdCounter}`;
  }

  public getEntityPowerState(entityId: string): boolean {
    const graphId = this.entityToGraphMap.get(entityId);
    if (!graphId) {
      return false;
    }

    const powerGraph = this.powerGraphs.get(graphId);
    if (!powerGraph) {
      return false;
    }

    return powerGraph.getEntityPowerState(entityId);
  }

  public getGraphForEntity(entityId: string): PowerGraph | null {
    const graphId = this.entityToGraphMap.get(entityId);
    return graphId ? this.powerGraphs.get(graphId) || null : null;
  }

  public getAllGraphs(): Array<PowerGraph> {
    return Array.from(this.powerGraphs.values());
  }

  public getGraphCount(): number {
    return this.powerGraphs.size;
  }

  public getTotalEntitiesManaged(): number {
    return this.entityToGraphMap.size;
  }

  /***** UTILITY METHODS FOR CONNECTIONS *****/  public findNearbyPoweredEntities(entity: GameObject, maxDistance: number): Array<GameObject> {
    if (!entity.hasTrait('powered') || !entity.hasTrait('position')) {
      return [];
    }

    const entityPosition = entity.getTrait('position').position.position;
    if (!entityPosition || entityPosition.x === undefined || entityPosition.y === undefined) {
      return [];
    }
    
    const nearbyEntities: Array<GameObject> = [];

    for (const otherEntity of this.getAllManagedEntities()) {
      if (otherEntity.uid === entity.uid || !otherEntity.hasTrait('position')) {
        continue;
      }

      const otherPosition = otherEntity.getTrait('position').position.position;
      if (!otherPosition || otherPosition.x === undefined || otherPosition.y === undefined) {
        continue;
      }

      const distance = Math.sqrt(
        Math.pow(entityPosition.x - otherPosition.x, 2) + 
        Math.pow(entityPosition.y - otherPosition.y, 2)
      );

      if (distance <= maxDistance) {
        nearbyEntities.push(otherEntity);
      }
    }

    return nearbyEntities;
  }

  public autoConnectNearbyEntities(entity: GameObject, maxDistance: number = 64): Array<string> {
    const connectedEntityIds: Array<string> = [];
    const nearbyEntities = this.findNearbyPoweredEntities(entity, maxDistance);
    const entityPoweredTrait = entity.getTrait('powered');

    for (const nearbyEntity of nearbyEntities) {
      const nearbyPoweredTrait = nearbyEntity.getTrait('powered');
      
      // Check if entities can be connected
      if (PoweredTrait.canConnect(entityPoweredTrait, nearbyPoweredTrait)) {
        try {
          this.connectEntities(entity.uid, nearbyEntity.uid);
          connectedEntityIds.push(nearbyEntity.uid);
        } catch (error) {
          console.warn(`Failed to connect entities ${entity.uid} and ${nearbyEntity.uid}:`, error);
        }
      }
    }

    return connectedEntityIds;
  }

  private getAllManagedEntities(): Array<GameObject> {
    const allEntities: Array<GameObject> = [];
    
    for (const graph of this.powerGraphs.values()) {
      allEntities.push(...graph.getEntities());
    }

    return allEntities;
  }

  /***** DEBUGGING *****/
  public getDebugInfo(): object {
    return {
      graphCount: this.getGraphCount(),
      totalEntities: this.getTotalEntitiesManaged(),
      graphs: Array.from(this.powerGraphs.values()).map((graph) => ({
        id: graph.graphId,
        powerType: graph.powerType,
        entityCount: graph.getEntityCount(),
        metrics: graph.getMetrics()
      }))
    };
  }

  /***** TESTING AND DEVELOPMENT UTILITIES *****/
  public createTestPowerNetwork(game: Game, centerX: number, centerY: number): Array<string> {
    const createdEntityIds: Array<string> = [];
    
    try {
      // Import the factories (they should be registered by now)
      const { powerGeneratorFactory } = require('../../objects/powerGenerator/factory');
      const { conveyorBeltFactory } = require('../../objects/conveyorBelt/factory');
      
      // Create a power generator at the center
      const generator = powerGeneratorFactory.createNetworked(game, {
        position: { x: centerX, y: centerY, type: 'global' },
        placedBy: 'system'
      });
      createdEntityIds.push(generator.uid);
      
      // Create conveyor belts in a line
      for (let i = 1; i <= 3; i++) {
        const conveyor = conveyorBeltFactory.createNetworked(game, {
          position: { x: centerX + (i * 64), y: centerY, type: 'global' },
          placedBy: 'system'
        });
        createdEntityIds.push(conveyor.uid);
        
        // Auto-connect to nearby entities
        this.autoConnectNearbyEntities(conveyor, 80);
      }
      
      console.log(`Created test power network with ${createdEntityIds.length} entities`);
      return createdEntityIds;
      
    } catch (error) {
      console.error('Failed to create test power network:', error);
      return createdEntityIds;
    }
  }

  public logPowerSystemStatus(): void {
    console.group('🔋 Power System Status');
    console.log(`Total Graphs: ${this.getGraphCount()}`);
    console.log(`Total Entities: ${this.getTotalEntitiesManaged()}`);
    
    for (const graph of this.getAllGraphs()) {
      console.group(`📊 Graph: ${graph.graphId}`);
      console.log(`Power Type: ${graph.powerType}`);
      console.log(`Entities: ${graph.getEntityCount()}`);
      
      const metrics = graph.getMetrics();
      console.log(`Power Provided: ${metrics.totalProvided}`);
      console.log(`Power Required: ${metrics.totalRequired}`);
      console.log(`Network Powered: ${metrics.isPowered ? '✅' : '❌'}`);
      
      console.log('Entity States:');
      for (const entity of graph.getEntities()) {
        const powerState = graph.getEntityPowerState(entity.uid);
        const poweredTrait = entity.getTrait('powered');
        const role = poweredTrait.isProducer ? 'Producer' : 
                     poweredTrait.isConsumer ? 'Consumer' : 
                     poweredTrait.isRelay ? 'Relay' : 'Battery';
        console.log(`  - ${entity.getEntityType()} (${role}): ${powerState ? '✅' : '❌'}`);
      }
      console.groupEnd();
    }
    console.groupEnd();
  }

  /***** POWER STATE QUERIES *****/
  public queryEntityPowerState(entityId: string): boolean {
    const graphId = this.entityToGraphMap.get(entityId);
    if (!graphId) {
      return false;
    }

    const powerGraph = this.powerGraphs.get(graphId);
    if (!powerGraph) {
      return false;
    }

    return powerGraph.getEntityPowerState(entityId);
  }

  public queryGraphPowerState(graphId: string): boolean {
    const powerGraph = this.powerGraphs.get(graphId);
    if (!powerGraph) {
      return false;
    }

    const metrics = powerGraph.getMetrics();
    return metrics.isPowered;
  }
}
