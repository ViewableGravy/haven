import React from "react";
import type { ConveyorBelt } from "./base";

/***** CONVEYOR BELT INFOGRAPHIC COMPONENT *****/
export const createConveyorBeltInfographicNode = (entity: ConveyorBelt): React.FC => {
  return () => {
    const poweredTrait = entity.getTrait('powered');
    const isPowered = poweredTrait.getPowerState();
    
    return (
      <div style={{ 
        padding: '10px', 
        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
        color: 'white', 
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#FFA500' }}>🔗 Conveyor Belt</h3>
        <p style={{ margin: '5px 0' }}>
          Mechanical transportation system that moves items along a belt.
        </p>
        <div style={{ margin: '10px 0', padding: '5px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px' }}>
          <p style={{ margin: '2px 0', fontSize: '12px' }}>
            <strong>Power Status:</strong> <span style={{ color: isPowered ? '#4CAF50' : '#F44336' }}>
              {isPowered ? 'Powered' : 'Unpowered'}
            </span>
          </p>
          <p style={{ margin: '2px 0', fontSize: '12px' }}>
            <strong>Power Required:</strong> {poweredTrait.consumptionRate} units
          </p>
          <p style={{ margin: '2px 0', fontSize: '12px' }}>
            <strong>Power Type:</strong> {poweredTrait.powerType}
          </p>
        </div>
        <p style={{ margin: '5px 0', fontSize: '12px', color: '#ccc' }}>
          Position: ({Math.round(entity.getTrait('position').position.position.x ?? 0)}, {Math.round(entity.getTrait('position').position.position.y ?? 0)})
        </p>
      </div>
    );
  };
};
