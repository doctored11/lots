import React, { createContext, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { OneHandSlotMashine } from "./pages/oneHabdSlotMashine/oneHandSlotMashine";
import {  PlayerProvider } from "./PlayerContext";

function App() {
  //todo - вынести игрока и работу с балансом

  return (
    <>
      <PlayerProvider>
        S:OTЫ
        <OneHandSlotMashine />
      </PlayerProvider>
    </>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<App />);
}
