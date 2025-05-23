import { Hotbar } from "./components/hotbar"
import { Infographic } from "./components/infographic"
import { PixiProvider } from "./components/pixi"

export const App = () => {
  return (
    <PixiProvider>
      <Infographic right={50} bottom={50} />
      <Hotbar/>
    </PixiProvider>
  )
}
