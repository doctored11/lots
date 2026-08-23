import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { GameProvider } from "./game/GameContext";
import { GamePage } from "./game/GamePage";
import { WorkshopPage } from "./game/WorkshopPage";

import "./index.css";
import "./normalize.css";

function App() {
  return (
    <GameProvider>
      <Router>
        <Routes>
          <Route path="/" element={<GamePage />} />
          <Route path="/workshop" element={<WorkshopPage />} />
        </Routes>
      </Router>
    </GameProvider>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<App />);
}
