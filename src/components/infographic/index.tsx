import { useStore } from "@tanstack/react-store";
import React, { createElement, type CSSProperties } from "react";
import { infographicStore } from "./store";

const createStyle = (opts: CSSProperties): CSSProperties => ({
  position: "fixed",
  width: 300,
  height: 500,
  border: "1px solid black",
  backgroundColor: "white",
  zIndex: 10,
  color: "black",
  borderRadius: 10,
  padding: 20,
  boxSizing: "border-box",
  ...opts,
})

/***** TYPE DEFINITIONS *****/
type InfographicProps = React.FC<{
  bottom?: number;
  right?: number;
}>

export const Infographic: InfographicProps = ({ bottom, right }) => {
  const infographicState = useStore(infographicStore);

  if (!infographicState.active) return null;

  return (
    <div style={createStyle({ bottom, right })}>
      {createElement(infographicState.component)}
    </div>
  )
}