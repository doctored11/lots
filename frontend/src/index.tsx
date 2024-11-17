import React, { createContext, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { OneHandSlotMashine } from "./pages/oneHabdSlotMashine/oneHandSlotMashine";
import { PlayerProvider } from "./PlayerContext";
import "./index.css";
import "./normalize.css";

const tg = window.Telegram.WebApp;
function App() {
  //todo - вынести игрока и работу с балансом

  useEffect(() => {
    tg.ready();
  }, []);

  const onClose = () => {
    tg.close();
  };
  return (
    <>
      <button onClick={onClose}>ЗАкрыть</button>
      <span>{tg.initDataUnsafe?.user?.username}</span>
      <PlayerProvider>
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
