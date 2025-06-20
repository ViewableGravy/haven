
/***** IMPORTS *****/
import invariant from "tiny-invariant";
import type { PowerSystemNamespace } from "../../systems/power/types";
import type { Game } from "../../utilities/game/game";
import type { GameObject } from "../base";

/***** TYPE DEFINITIONS *****/
export namespace PoweredTrait {
  export type Args = {
    isConsumer: boolean;
    isProducer: boolean;
    isRelay: boolean;
    isBattery: boolean;
    powerType: "mechanical" | "electrical";
    minimumPower: number;
    maximumPower: number;
    consumptionRate: number;
  };
}

type PowerConnection = PowerSystemNamespace.PowerConnection;

/***** POWERED TRAIT CLASS *****/
export class PoweredTrait {
  public readonly powerType: "mechanical" | "electrical";
  public readonly minimumPower: number; 
  public readonly maximumPower: number;
  public readonly consumptionRate: number;
  public readonly isConsumer: boolean = false;
  public readonly isProducer: boolean = false;
  public readonly isRelay: boolean = false;
  public readonly isBattery: boolean = false;
  // Power graph membership
  private powerGraphId: string | null = null;
  private connectedEntities: Map<string, PowerConnection> = new Map();

  constructor(private entity: GameObject, private game: Game, opts: PoweredTrait.Args) {
    this.powerType = opts.powerType;
    this.minimumPower = opts.minimumPower;
    this.maximumPower = opts.maximumPower;
    this.consumptionRate = opts.consumptionRate;
    this.isConsumer = opts.isConsumer;
    this.isProducer = opts.isProducer;
    this.isRelay = opts.isRelay;
    this.isBattery = opts.isBattery;
  }

  /***** POWER GRAPH MANAGEMENT *****/
  public setPowerGraphId(graphId: string | null): void {
    this.powerGraphId = graphId;
  }

  public getPowerGraphId(): string | null {
    return this.powerGraphId;
  }

  public hasPowerGraph(): boolean {
    return this.powerGraphId !== null;
  }
  /***** POWER STATE QUERY *****/
  public getPowerState(): boolean {
    invariant(this.powerGraphId, "Power graph ID must be set before querying power state");

    return this.game.powerManager.queryEntityPowerState(this.entity.uid);
  }

  /***** CONNECTION MANAGEMENT *****/
  public addConnection(targetEntityId: string, connectionType: PowerConnection['connectionType']): void {
    this.connectedEntities.set(targetEntityId, {
      entityId: targetEntityId,
      connectionType
    });
  }

  public removeConnection(targetEntityId: string): void {
    this.connectedEntities.delete(targetEntityId);
  }

  public getConnections(): Array<PowerConnection> {
    return Array.from(this.connectedEntities.values());
  }

  public hasConnection(entityId: string): boolean {
    return this.connectedEntities.has(entityId);
  }
  /***** POWER CALCULATIONS *****/
  public getCurrentPowerProvided(): number {
    if (!this.isProducer && !this.isBattery) {
      return 0;
    }

    // Producers provide their maximum power when their graph is functional
    // In a more complex system, this could vary based on conditions
    return this.maximumPower;
  }

  public getCurrentPowerRequired(): number {
    if (!this.isConsumer && !this.isBattery) {
      return 0;
    }

    // Return consumption rate for consumers
    return this.consumptionRate;
  }

  public getEfficiency(): number {
    if (!this.isRelay) {
      return 1.0;
    }

    // Relays might have efficiency losses
    // For now, assume 95% efficiency for relays
    return 0.95;
  }

  /***** VALIDATION *****/
  public isValidConfiguration(): boolean {
    // Validate that the power configuration makes sense
    if (this.isConsumer && this.consumptionRate <= 0) {
      return false;
    }

    if (this.isProducer && this.maximumPower <= 0) {
      return false;
    }

    if (this.minimumPower > this.maximumPower) {
      return false;
    }

    return true;
  }

  /***** STATIC METHODS *****/
  static canConnect(trait1: PoweredTrait, trait2: PoweredTrait): boolean {
    // Check if two powered traits can be connected
    if (trait1.powerType !== trait2.powerType) {
      return false;
    }

    // Basic connection rules: producers can connect to consumers/relays/batteries
    // Relays can connect to anything of the same power type
    const hasProvider = trait1.isProducer || trait1.isBattery || trait2.isProducer || trait2.isBattery;
    const hasConsumer = trait1.isConsumer || trait1.isBattery || trait2.isConsumer || trait2.isBattery;
    const hasRelay = trait1.isRelay || trait2.isRelay;

    return (hasProvider && hasConsumer) || hasRelay;
  }

  static getConnectionType(fromTrait: PoweredTrait, toTrait: PoweredTrait): PowerConnection['connectionType'] {
    if (fromTrait.isProducer && (toTrait.isConsumer || toTrait.isRelay)) {
      return 'output';
    }

    if (fromTrait.isConsumer && (toTrait.isProducer || toTrait.isRelay)) {
      return 'input';
    }

    if (fromTrait.isRelay || toTrait.isRelay) {
      return 'bidirectional';
    }

    return 'bidirectional';
  }

  /***** CLEANUP *****/
  public destroy(): void {
    this.connectedEntities.clear();
    this.entity = undefined!;
  }
}