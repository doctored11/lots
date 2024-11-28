import React, { useContext } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { OneHandSlotMashine } from "./lots/pages/oneHabdSlotMashine/oneHandSlotMashine";
import { PlayerContext, PlayerProvider } from "./PlayerContext";

import "./index.css";
import "./normalize.css";
import styles from "./homePage.module.css";
import { GiftsPage } from "./gifts/pages/GiftsPage";

function HomePage() {
  const player = useContext(PlayerContext);
  return (
    <div>
      <h1>Баланс</h1>
      <p>Ваш текущий баланс: {player?.balance || "🤔"}</p>
      <div className={styles.container}>
        <Link className={styles.card} to="/lots">
          {" "}
          🎰 бандит
        </Link>
        <Link className={styles.card} to="/gifts">
          🎁 Гифты
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <PlayerProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/lots" element={<OneHandSlotMashine />} />
          <Route path="/gifts" element={<GiftsPage />} />
        </Routes>
      </Router>
    </PlayerProvider>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<App />);
}
