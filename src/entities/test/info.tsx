import type { TestEntity } from "."


export const createTestEntityInfographicNode = (entity: TestEntity) => {
  return () => {
    return (
      <>
        <div>Assembler</div>
        <div>UID: {entity._assembler.uid}</div>
        <div>Position: {entity._assembler.x}, {entity._assembler.y}</div>
      </>
    )
  }
}