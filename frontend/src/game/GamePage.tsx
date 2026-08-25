import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "./GameContext";
import { ITEMS, ECONOMY } from "./catalog";
import { MachineView } from "./MachineView";
import { BalanceChange } from "../globalComponents/header/balanceChange.tsx/BalanceChange";
import styles from "./gamePage.module.css";

interface FloatNum {
  id: number;
  change: number;
}
let floatId = 0;

export function GamePage() {
  const game = useGame();
  const [floats, setFloats] = useState<FloatNum[]>([]);
  const prevBalance = useRef(game.balance);

  const addFloat = (change: number) => {
    const id = ++floatId;
    setFloats((prev) => [...prev, { id, change }]);
  };
  const removeFloat = (id: number) => {
    setFloats((prev) => prev.filter((f) => f.id !== id));
  };

  // летящие цифры при любом изменении баланса (спины всех автоматов, покупки)
  useEffect(() => {
    const delta = game.balance - prevBalance.current;
    prevBalance.current = game.balance;
    if (delta !== 0) addFloat(delta);
  }, [game.balance]);

  const scrollToMachine = (id: number) => {
    document
      .getElementById(`machine-${id}`)
      ?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  };

  return (
    <div className={styles.gamePage}>
      <div className={styles.topBar}>
        <span className={styles.balance}>
          💰 {game.balance}
          <span className={styles.floatZone}>
            {floats.map((f) => (
              <BalanceChange
                key={f.id}
                change={f.change}
                onRemove={() => removeFloat(f.id)}
              />
            ))}
          </span>
        </span>
        <button
          className={styles.devCoinsBtn}
          onClick={() => game.addCoins(1000)}
          title="Дев-кнопка: +1000 монет (временно, для тестов)"
        >
          +1000 💰
        </button>
        <button
          className={styles.repairBtn}
          onClick={() => {
            const err = game.buyExtraMachine();
            if (err) alert(err);
          }}
          disabled={game.balance < game.nextExtraMachineCost}
          title="Новый автомат: 1-2 барабана, пустую ленту собираешь в мастерской"
        >
          🛒 Новый автомат ({game.nextExtraMachineCost})
        </button>
        <Link to="/workshop" className={styles.workshopLink}>
          🔧 Мастерская
        </Link>
      </div>

      {game.lastLostItems.length > 0 && (
        <div className={styles.lostLine}>
          💥 При взрыве потеряно:{" "}
          {game.lastLostItems.map((k) => ITEMS[k].label).join(", ")}
        </div>
      )}

      {/* якоря-навигация по автоматам */}
      {game.machines.length > 1 && (
        <div className={styles.anchorBar}>
          {game.machines.map((m) => (
            <button
              key={m.id}
              className={styles.anchorChip}
              style={{ borderColor: m.color }}
              onClick={() => scrollToMachine(m.id)}
            >
              {m.name}
              {m.hp <= 0 ? " 💥" : ""}
              {m.reel.length === 0 && m.hp > 0 ? " ❓" : ""}
            </button>
          ))}
        </div>
      )}

      {/* ряд автоматов: на ПК влезает ~5, на телефоне 2-3 со скроллом */}
      {/* зал казино: стены, пол; ряд автоматов прибит к полу внизу */}
      <div className={styles.casinoHall}>
        <div className={styles.machinesRow}>
          {game.machines.map((m, i) => (
            <MachineView key={m.id} mi={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
