import React from "react";
import type { Assembler } from "./factory";


export const createTestEntityInfographicNode = (assembler: Assembler): React.FC => {
  return () => (
    <div>
      <h3>Assembler Entity</h3>
      <p>ID: {assembler.uid}</p>
      <p>Position: ({Math.round(assembler.transformTrait.position.x)}, {Math.round(assembler.transformTrait.position.y)})</p>
      <p>Size: {assembler.transformTrait.size.width} x {assembler.transformTrait.size.height}</p>
      <p>Ghost Mode: {assembler.ghostableTrait.ghostMode ? 'Yes' : 'No'}</p>
    </div>
  );
};