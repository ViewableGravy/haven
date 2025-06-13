import { Hotbar } from "./components/hotbar";
import { Infographic } from "./components/infographic";
import { InventoryPanel } from "./components/inventory";
import { MemoryStats } from './components/memoryStats';
import { PixiProvider } from "./components/pixi";

export const App = () => {
  return (
    <PixiProvider>
      <MemoryStats corner="topLeft" />
      <Infographic right={50} bottom={50} />
      <Hotbar />
      <InventoryPanel />
    </PixiProvider>
  )
}
