import React from "react";
import type { PowerGenerator } from "./base";

/***** POWER GENERATOR INFOGRAPHIC COMPONENT *****/
export const createPowerGeneratorInfographicNode = (entity: PowerGenerator): React.FC => {
  return () => {
    const poweredTrait = entity.getTrait('powered');
    
    return (
      <div style={{ 
        padding: '10px', 
        backgroundColor: 'rgba(0, 0, 0, 0.8)', 
        color: 'white', 
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>⚡ Power Generator</h3>
        <p style={{ margin: '5px 0' }}>
          Mechanical power source that provides energy to connected systems.
        </p>
        <div style={{ margin: '10px 0', padding: '5px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px' }}>
          <p style={{ margin: '2px 0', fontSize: '12px' }}>
            <strong>Status:</strong> <span style={{ color: '#4CAF50' }}>Generating Power</span>
          </p>
          <p style={{ margin: '2px 0', fontSize: '12px' }}>
            <strong>Power Output:</strong> {poweredTrait.maximumPower} units
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
