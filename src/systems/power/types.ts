/***** TYPE DEFINITIONS *****/
export namespace PowerSystemNamespace {
  export type PowerType = "mechanical" | "electrical";
  
  export type PowerRole = "producer" | "consumer" | "relay" | "battery";
  
  export type PowerConnection = {
    entityId: string;
    connectionType: "input" | "output" | "bidirectional";
  };
  
  export type PowerMetrics = {
    provided: number;
    required: number;
    stored?: number; // For batteries
    efficiency?: number; // For relays/converters
  };
  
  export type GraphEvaluationResult = {
    graphId: string;
    isPowered: boolean;
    totalProvided: number;
    totalRequired: number;
    entityStates: Map<string, boolean>;
  };
  
  export type PowerGraphConfig = {
    graphId: string;
    powerType: PowerType;
    entities: Set<string>;
    connections: Map<string, Array<PowerConnection>>;
  };
  
  export type PowerUpdateEvent = {
    entityId: string;
    oldPowerState: boolean;
    newPowerState: boolean;
    graphId: string;
  };
}
