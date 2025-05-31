import React from "react";
import type { SpruceTree } from "./factory";

/***** TYPE DEFINITIONS *****/

/***** SPRUCE TREE INFOGRAPHIC COMPONENT *****/
export const createSpruceTreeInfographicNode = (entity: SpruceTree): React.FC => {
  return () => (
    <div style={{ 
      padding: '10px', 
      backgroundColor: 'rgba(0, 0, 0, 0.8)', 
      color: 'white', 
      borderRadius: '5px',
      fontSize: '14px'
    }}>
      <h3 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>🌲 Spruce Tree</h3>
      <p style={{ margin: '5px 0' }}>
        A tall evergreen coniferous tree commonly found in northern climates.
      </p>
      <p style={{ margin: '5px 0', fontSize: '12px', color: '#ccc' }}>
        • Provides natural decoration to the landscape<br/>
        • Can be manually placed or naturally generated<br/>
        • Position: ({Math.round(entity.transform.position.position.x ?? 0)}, {Math.round(entity.transform.position.position.y ?? 0)})
      </p>
    </div>
  );
};
