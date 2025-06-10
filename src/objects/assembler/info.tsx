import React from "react";
import type { Assembler } from "./factory";


export const createTestEntityInfographicNode = (assembler: Assembler): React.FC => {
  return () => (
    <div>
      <h3>Assembler Entity</h3>
      <p>ID: {assembler.uid}</p>
      <p>Position: ({Math.round(assembler.getTrait('position').position.x)}, {Math.round(assembler.getTrait('position').position.y)})</p>
      <p>Size: {assembler.getTrait('position').size.width} x {assembler.getTrait('position').size.height}</p>
      <p>Ghost Mode: {assembler.getTrait('ghostable').ghostMode ? 'Yes' : 'No'}</p>
    </div>
  );
};