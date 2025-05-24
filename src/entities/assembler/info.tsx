import React from "react";
import type { Assembler } from "./index";


export const createTestEntityInfographicNode = (assembler: Assembler): React.FC => {
  return () => (
    <div>
      <h3>Assembler Entity</h3>
      <p>ID: {assembler.uid}</p>
      <p>Position: ({Math.round(assembler.position.x)}, {Math.round(assembler.position.y)})</p>
      <p>Size: {assembler.size.width} x {assembler.size.height}</p>
      <p>Ghost Mode: {assembler.ghostMode ? 'Yes' : 'No'}</p>
    </div>
  );
};