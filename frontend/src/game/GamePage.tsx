import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useGame, SpinResult } from "./GameContext";
import { ITEMS, ECONOMY, RARITY_LABELS } from "./catalog";
import { rollSpin } from "../lots/components/slotMashine/slotMashine/mashineBody/mashineDrum/rollSpin";
import { getRandomInt } from "../tools/tools";
import styles from "./gamePage.module.css";

const ITEM_HEIGHT = 96;

function TapeContent({ reel, tapeRef }: { reel: string[]; tapeRef: React.RefObject<HTMLDivElement> }) {
  useEffect(() => {
    if (!tapeRef.current) return;
    tapeRef.current.innerHTML = "";
    reel.forEach((key) => {
      const item = ITEMS[key];
      if (!item) return;
      if (item.image) {
        const img = document.createElement("img");
        img.src = item.image;
        img.style.height = `${ITEM_HEIGHT}px`;
        img.style.width = `${ITEM_HEIGHT}px`;
        tapeRef.current?.appendChild(img);
      } else {
        const span = document.createElement("div");
        span.textContent = item.emoji;
        span.style.cssText = `height:${ITEM_HEIGHT}px;width:${ITEM_HEIGHT}px;font-size:${ITEM_HEIGHT * 0.7}px;display:flex;align-items:center;justify-content:center;`;
        tapeRef.current?.appendChild(span);
      }
    });
  }, [reel]);
  return <div ref={tapeRef} className={styles.tape}></div>;
}

export function GamePage() {
  const game = useGame();
  const [spinValues, setSpinValues] = useState<number[]>([0, 0, 0]);
  const [pending, setPending] = useState<SpinResult | null>(null);
  const [autoSpin, setAutoSpin] = useState(false);
  const [toast, setToast] = useState("");

  const tapeRefs = useRef<React.RefObject<HTMLDivElement>[]>(
    [0, 1, 2].map(() => React.createRef<HTMLDivElement>())
  );

  const showToast = (text: string, ms = 3000) => {
    setToast(text);
    setTimeout(() => setToast(""), ms);
  };

  function handleSpin() {
    if (game.isSpinning || game.isAnimating) return;
    const result = game.doSpin();
    if ("error" in result) {
      if (result.error === "broken") {
        showToast("💥 Автомат сломан! Нужен ремонт");
      } else {
        showToast("Не хватает монет на прокрут");
        setAutoSpin(false);
      }
      return;
    }
    game.setIsSpinning(true);
    setSpinValues(result.combination);
    setPending(result);
  }

  // запуск анимации барабанов
  useEffect(() => {
    if (!game.isSpinning || !pending) return;
    const promises = spinValues.map((value, index) =>
      rollSpin(
        tapeRefs.current[index].current!,
        ITEM_HEIGHT,
        getRandomInt(12, 35),
        getRandomInt(3, 8),
        value
      )
    );
    Promise.all(promises).then(() => {
      game.applySpinResult(pending);
      game.setIsSpinning(false);
      if (pending.unlockedRecipe) {
        showToast(`📖 Открыт рецепт: ${ITEMS[pending.unlockedRecipe].label}!`, 4000);
      }
      if (pending.broken) {
        setAutoSpin(false);
        setTimeout(() => showToast("💥 Автомат сломался (0 HP)!", 4000), 500);
      }
      setPending(null);
    });
  }, [spinValues]);

  // idle-элемент: автопрокрут
  useEffect(() => {
    if (!autoSpin) return;
    if (game.isSpinning || game.isAnimating) return;
    if (game.hp <= 0 || game.balance < game.spinCost) {
      setAutoSpin(false);
      return;
    }
    const t = setTimeout(handleSpin, 700);
    return () => clearTimeout(t);
  }, [autoSpin, game.isSpinning, game.isAnimating, game.hp, game.balance]);

  const hpPercent = Math.max(0, Math.min(100, (game.hp / ECONOMY.maxHp) * 100));
  const hpClass =
    hpPercent > 50 ? styles.hpHigh : hpPercent > 20 ? styles.hpMid : styles.hpLow;

  const handleRepair = () => {
    const err = game.repair();
    if (err) showToast(err);
  };

  return (
    <div className={styles.gamePage}>
      <div className={styles.topStats}>
        <span className={styles.balance}>💰 {game.balance}</span>
        <span className={styles.cost}>прокрут: {game.spinCost}</span>
      </div>

      <div className={styles.machine}>
        <div className={styles.drumRow}>
          {spinValues.map((_, index) => (
            <div key={index} className={styles.roll}>
              <TapeContent reel={game.reel} tapeRef={tapeRefs.current[index]} />
            </div>
          ))}
        </div>

        <div
          className={`${styles.winPlaque} ${
            game.lastWin > 0 ? styles.winPlaqueActive : ""
          }`}
        >
          {game.lastWin > 0
            ? `ВЫИГРЫШ +${game.lastWin} (макс: ${game.maxWin})`
            : "— нет выигрыша —"}
        </div>

        <div className={styles.hpRow}>
          <div className={styles.hpBar}>
            <div
              className={`${styles.hpFill} ${hpClass}`}
              style={{ width: `${hpPercent}%` }}
            ></div>
            <span className={styles.hpText}>
              HP {game.hp}/{ECONOMY.maxHp}
            </span>
          </div>
          <button
            className={styles.repairBtn}
            onClick={handleRepair}
            disabled={game.hp >= ECONOMY.maxHp || game.isSpinning}
          >
            🔧 +{ECONOMY.repairAmount} HP ({ECONOMY.repairCost})
          </button>
        </div>

        <div className={styles.controls}>
          <button
            className={styles.spinBtn}
            onClick={handleSpin}
            disabled={game.isSpinning || game.isAnimating || game.hp <= 0}
          >
            🎰 Крутить ({game.spinCost})
          </button>
          <label className={styles.autoLabel}>
            <input
              type="checkbox"
              checked={autoSpin}
              onChange={(e) => setAutoSpin(e.target.checked)}
            />
            авто
          </label>
        </div>

        <Link to="/workshop" className={styles.workshopLink}>
          🔧 Мастерская
        </Link>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
