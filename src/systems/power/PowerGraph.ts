/***** IMPORTS *****/
import type { GameObject } from "../../objects/base";
import type { PowerSystemNamespace } from "./types";

/***** TYPE DEFINITIONS *****/
type PowerType = PowerSystemNamespace.PowerType;
type PowerConnection = PowerSystemNamespace.PowerConnection;
type GraphEvaluationResult = PowerSystemNamespace.GraphEvaluationResult;

/***** POWER GRAPH CLASS *****/
/**
 * PowerGraph represents a connected network of power providers and consumers.
 * It maintains aggregated power metrics and evaluates binary power states
 * for the entire network without per-node traversal during simulation ticks.
 */
export class PowerGraph {
  public readonly graphId: string;
  public readonly powerType: PowerType;
  
  private entities: Map<string, GameObject> = new Map();
  private connections: Map<string, Array<PowerConnection>> = new Map();
  private entityPowerStates: Map<string, boolean> = new Map();
  
  // Aggregated metrics
  private totalProvided: number = 0;
  private totalRequired: number = 0;
  private lastEvaluationResult: boolean = false;

  constructor(graphId: string, powerType: PowerType) {
    this.graphId = graphId;
    this.powerType = powerType;
  }

  /***** ENTITY MANAGEMENT *****/
  public addEntity(entity: GameObject): void {
    if (!entity.hasTrait('powered')) {
      throw new Error(`Entity ${entity.uid} does not have PoweredTrait`);
    }

    const poweredTrait = entity.getTrait('powered');
    if (poweredTrait.powerType !== this.powerType) {
      throw new Error(`Power type mismatch: graph=${this.powerType}, entity=${poweredTrait.powerType}`);
    }

    this.entities.set(entity.uid, entity);
    this.entityPowerStates.set(entity.uid, false);
    this.updateAggregatedMetrics();
  }

  public removeEntity(entityId: string): Array<PowerGraph> {
    const entity = this.entities.get(entityId);
    if (!entity) {
      return [this];
    }

    this.entities.delete(entityId);
    this.connections.delete(entityId);
    this.entityPowerStates.delete(entityId);

    // Remove connections from other entities to this entity
    for (const [otherId, connections] of this.connections) {
      this.connections.set(
        otherId,
        connections.filter((conn) => conn.entityId !== entityId)
      );
    }

    this.updateAggregatedMetrics();

    // Check for graph fragmentation
    return this.checkForFragmentation();
  }

  /***** CONNECTION MANAGEMENT *****/
  public addConnection(fromEntityId: string, toEntityId: string, connectionType: PowerConnection['connectionType']): void {
    if (!this.entities.has(fromEntityId) || !this.entities.has(toEntityId)) {
      throw new Error('Both entities must be in the graph before connecting');
    }

    if (!this.connections.has(fromEntityId)) {
      this.connections.set(fromEntityId, []);
    }

    const connections = this.connections.get(fromEntityId)!;
    const existingConnection = connections.find((conn) => conn.entityId === toEntityId);

    if (existingConnection) {
      existingConnection.connectionType = connectionType;
    } else {
      connections.push({ entityId: toEntityId, connectionType });
    }
  }

  public removeConnection(fromEntityId: string, toEntityId: string): void {
    const connections = this.connections.get(fromEntityId);
    if (connections) {
      this.connections.set(
        fromEntityId,
        connections.filter((conn) => conn.entityId !== toEntityId)
      );
    }
  }

  /***** POWER EVALUATION *****/
  public evaluate(): GraphEvaluationResult {
    this.updateAggregatedMetrics();
    
    const isPowered = this.totalProvided >= this.totalRequired;
    this.lastEvaluationResult = isPowered;

    // Update all consumer states based on graph power state
    for (const [entityId, entity] of this.entities) {
      const poweredTrait = entity.getTrait('powered');
      const wasConsumer = poweredTrait.isConsumer;
      
      if (wasConsumer) {
        this.entityPowerStates.set(entityId, isPowered);
      } else {
        // Producers and relays are always considered "powered" if they're functional
        this.entityPowerStates.set(entityId, true);
      }
    }

    return {
      graphId: this.graphId,
      isPowered,
      totalProvided: this.totalProvided,
      totalRequired: this.totalRequired,
      entityStates: new Map(this.entityPowerStates)
    };
  }

  /***** GRAPH FRAGMENTATION *****/
  private checkForFragmentation(): Array<PowerGraph> {
    if (this.entities.size === 0) {
      return [];
    }

    if (this.entities.size === 1) {
      return [this];
    }

    // Use BFS to find all connected components
    const visited = new Set<string>();
    const components: Array<Set<string>> = [];

    for (const entityId of this.entities.keys()) {
      if (!visited.has(entityId)) {
        const component = this.bfsTraversal(entityId, visited);
        components.push(component);
      }
    }

    // If only one component, no fragmentation occurred
    if (components.length === 1) {
      return [this];
    }

    // Create new graphs for each component
    const newGraphs: Array<PowerGraph> = [];
    
    for (let i = 0; i < components.length; i++) {
      const component = components[i];
      const newGraphId = `${this.graphId}-fragment-${i}`;
      const fragmentGraph = new PowerGraph(newGraphId, this.powerType);

      // Add entities to fragment
      for (const entityId of component) {
        const entity = this.entities.get(entityId)!;
        fragmentGraph.addEntity(entity);
      }

      // Copy relevant connections
      for (const entityId of component) {
        const connections = this.connections.get(entityId) || [];
        for (const connection of connections) {
          if (component.has(connection.entityId)) {
            fragmentGraph.addConnection(entityId, connection.entityId, connection.connectionType);
          }
        }
      }

      newGraphs.push(fragmentGraph);
    }

    return newGraphs;
  }

  private bfsTraversal(startEntityId: string, visited: Set<string>): Set<string> {
    const component = new Set<string>();
    const queue = [startEntityId];
    
    while (queue.length > 0) {
      const entityId = queue.shift()!;
      
      if (visited.has(entityId)) {
        continue;
      }

      visited.add(entityId);
      component.add(entityId);

      // Add all connected entities to queue
      const connections = this.connections.get(entityId) || [];
      for (const connection of connections) {
        if (!visited.has(connection.entityId)) {
          queue.push(connection.entityId);
        }
      }

      // Also check reverse connections (entities connected TO this one)
      for (const [otherId, otherConnections] of this.connections) {
        if (otherConnections.some((conn) => conn.entityId === entityId) && !visited.has(otherId)) {
          queue.push(otherId);
        }
      }
    }

    return component;
  }

  /***** METRICS CALCULATION *****/
  private updateAggregatedMetrics(): void {
    this.totalProvided = 0;
    this.totalRequired = 0;

    for (const entity of this.entities.values()) {
      const poweredTrait = entity.getTrait('powered');
      
      if (poweredTrait.isProducer) {
        this.totalProvided += poweredTrait.maximumPower;
      }
      
      if (poweredTrait.isConsumer) {
        this.totalRequired += poweredTrait.consumptionRate;
      }
      
      // Batteries can both provide and consume
      if (poweredTrait.isBattery) {
        // For now, batteries add to both provided and required
        // In a more complex system, this would depend on charge state
        this.totalProvided += poweredTrait.maximumPower * 0.5; // Assume 50% charge
        this.totalRequired += poweredTrait.consumptionRate;
      }
    }
  }

  /***** GETTERS *****/
  public getEntities(): Array<GameObject> {
    return Array.from(this.entities.values());
  }

  public getEntityCount(): number {
    return this.entities.size;
  }

  public hasEntity(entityId: string): boolean {
    return this.entities.has(entityId);
  }

  public getEntityPowerState(entityId: string): boolean {
    return this.entityPowerStates.get(entityId) ?? false;
  }

  public getMetrics(): { totalProvided: number; totalRequired: number; isPowered: boolean } {
    return {
      totalProvided: this.totalProvided,
      totalRequired: this.totalRequired,
      isPowered: this.lastEvaluationResult
    };
  }

  public getConnections(entityId: string): Array<PowerConnection> {
    return this.connections.get(entityId) || [];
  }
}
