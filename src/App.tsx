import { Hotbar } from "./components/hotbar";
import { Infographic } from "./components/infographic";
import { InventoryPanel } from "./components/inventory";
import { PixiProvider } from "./components/pixi";

export const App = () => {
  return (
    <PixiProvider>
      <Infographic right={50} bottom={50} />
      <Hotbar />
      <InventoryPanel />
    </PixiProvider>
  )
}
