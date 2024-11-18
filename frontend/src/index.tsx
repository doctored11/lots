import React, { createContext, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { OneHandSlotMashine } from "./pages/oneHabdSlotMashine/oneHandSlotMashine";
import { PlayerProvider } from "./PlayerContext";
import "./index.css";
import "./normalize.css";
import { useTelegram } from "./hooks/useTelegram";

function App() {
  //todo - вынести игрока и работу с балансом

  const {user,onClose,onToggleButton} = useTelegram()
  return (
    <>
      <button onClick={onClose}>ЗАкрыть</button>
      <span>{user?.username}</span>
      <PlayerProvider>
        <OneHandSlotMashine />
      </PlayerProvider>
      <button onClick={onToggleButton}>toggle</button>
    </>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<App />);
}
