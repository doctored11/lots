import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useGame, SpinResult } from "./GameContext";
import { ITEMS, ECONOMY } from "./catalog";
import { rollSpin } from "../lots/components/slotMashine/slotMashine/mashineBody/mashineDrum/rollSpin";
import { getRandomInt } from "../tools/tools";
import { HandBtn } from "../lots/components/slotMashine/slotMashine/mashineBody/hendBtn/HandBtn";
import { BalanceChange } from "../globalComponents/header/balanceChange.tsx/BalanceChange";
import styles from "./gamePage.module.css";
import machineStyles from "../lots/components/slotMashine/slotMashine/mashineBody/mashineBody.module.css";
import drumStyles from "../lots/components/slotMashine/slotMashine/mashineBody/mashineDrum/mashineDrum.module.css";
import boomStyles from "../lots/components/changeMashine/changeMashine.module.css";

const ITEM_HEIGHT = 96;

interface FloatNum {
  id: number;
  change: number;
}
let floatId = 0;

function TapeContent({
  reel,
  tapeRef,
}: {
  reel: string[];
  tapeRef: React.RefObject<HTMLDivElement>;
}) {
  useEffect(() => {
    if (!tapeRef.current) return;
    tapeRef.current.innerHTML = "";
    reel.forEach((key) => {
      const item = ITEMS[key];
      if (!item) return;
      let el: HTMLElement;
      if (item.image) {
        el = document.createElement("img");
        (el as HTMLImageElement).src = item.image;
      } else {
        el = document.createElement("div");
        el.textContent = item.emoji;
        el.style.fontSize = `${ITEM_HEIGHT * 0.6}px`;
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
      }
      el.style.height = `${ITEM_HEIGHT}px`;
      el.style.width = `${ITEM_HEIGHT}px`;
      tapeRef.current?.appendChild(el);
    });
  }, [reel]);
  return <div ref={tapeRef} className={drumStyles.tape}></div>;
}

export function GamePage() {
  const game = useGame();
  const [spinValues, setSpinValues] = useState<number[]>([0, 0, 0]);
  const [pending, setPending] = useState<SpinResult | null>(null);
  const [autoSpin, setAutoSpin] = useState(false);
  const [toast, setToast] = useState("");
  const [floats, setFloats] = useState<FloatNum[]>([]);
  const [exploding, setExploding] = useState(false);

  const tapeRefs = useRef<React.RefObject<HTMLDivElement>[]>(
    [0, 1, 2].map(() => React.createRef<HTMLDivElement>())
  );
  const mashineRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);

  const showToast = (text: string, ms = 3000) => {
    setToast(text);
    setTimeout(() => setToast(""), ms);
  };

  const addFloat = (change: number) => {
    const id = ++floatId;
    setFloats((prev) => [...prev, { id, change }]);
  };
  const removeFloat = (id: number) => {
    setFloats((prev) => prev.filter((f) => f.id !== id));
  };

  function playExplosion() {
    setExploding(true);
    setTimeout(() => setExploding(false), 900);
  }

  // пересборка: старый проваливается в дыру (squashJump + тень растёт),
  // новый прилетает (sqwishFall + тень появляется)
  useEffect(() => {
    if (!game.justBuilt) return;
    const el = mashineRef.current;
    const shadow = shadowRef.current;
    if (!el) return;

    // старый улетает в дыру
    shadow?.classList.add(boomStyles.shadowGrow);
    el.classList.add(boomStyles.mashineHide);

    const t1 = setTimeout(() => {
      // новый прилетает
      el.classList.remove(boomStyles.mashineHide);
      shadow?.classList.remove(boomStyles.shadowGrow);
      el.classList.add(boomStyles.mashineShow);
      shadow?.classList.add(boomStyles.shadowAppearance);
    }, 1800);

    const t2 = setTimeout(() => {
      el.classList.remove(boomStyles.mashineShow);
      shadow?.classList.remove(boomStyles.shadowAppearance);
      // флаг сбрасываем только в конце — иначе cleanup эффекта убьёт таймеры
      game.setJustBuilt(false);
    }, 1800 + 1400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [game.justBuilt]);

  function handleSpin() {
    if (game.isSpinning || game.isAnimating) return;
    const result = game.doSpin();
    if ("error" in result) {
      if (result.error === "broken") {
        showToast("💥 Автомат сломан! Нужен ремонт");
        playExplosion();
      } else {
        showToast("Не хватает монет на прокрут");
        setAutoSpin(false);
      }
      return;
    }
    addFloat(-result.cost); // списание ставки — цифра вниз сразу
    game.chargeSpinCost(result.cost);
    game.setIsSpinning(true);
    setSpinValues(result.combination);
    setPending(result);
  }

  // тряска автомата во время прокрута
  useEffect(() => {
    const el = mashineRef.current;
    if (!el) return;
    if (game.isSpinning) {
      const t = setTimeout(() => el.classList.add(machineStyles.working), 300);
      return () => {
        clearTimeout(t);
        el.classList.remove(machineStyles.working);
      };
    }
    el.classList.remove(machineStyles.working);
  }, [game.isSpinning]);

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
      // подсветка выпавших символов
      spinValues.forEach((targetIndex, reelIndex) => {
        const tape = tapeRefs.current[reelIndex].current;
        const el = tape?.children[targetIndex];
        if (el instanceof HTMLElement) {
          el.classList.add(drumStyles.winEl);
          setTimeout(() => el.classList.remove(drumStyles.winEl), 700);
        }
      });

      game.applySpinResult(pending);
      game.setIsSpinning(false);
      if (pending.win > 0) addFloat(pending.win); // выигрыш — цифра вверх
      if (pending.unlockedRecipe) {
        showToast(
          `📖 Открыт рецепт: ${ITEMS[pending.unlockedRecipe].label}!`,
          4000
        );
      }
      if (pending.broken) {
        setAutoSpin(false);
        playExplosion();
        setTimeout(() => showToast("💥 Автомат сломался (0 HP)!", 4000), 600);
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
    else addFloat(-ECONOMY.repairCost);
  };

  return (
    <div className={styles.gamePage}>
      <div className={styles.topStats}>
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
          onClick={() => {
            game.addCoins(1000);
            addFloat(1000);
          }}
          title="Дев-кнопка: +1000 монет (временно, для тестов)"
        >
          +1000 💰
        </button>
        <span className={styles.cost} title="Ставка = база 5 + сумма вкладов лотов в ленте. Выигрыш считается от ставки.">
          ставка: {game.spinCost}
        </span>
      </div>

      <div className={styles.machineStage}>
        <div className={machineStyles.mashineContainer}>
          <div className={machineStyles.mashine} id="mashine" ref={mashineRef}>
            <div className={machineStyles.out}>
              <div className={machineStyles.mashineHead}>
                <div className={machineStyles.headUp}></div>
                <div className={machineStyles.headMid}></div>
                <div className={machineStyles.headLow}></div>
              </div>
              <div className={machineStyles.mashineBody}>
                <div className={machineStyles.dramFrame}>
                  <div className={drumStyles.slotDrum}>
                    {spinValues.map((_, index) => (
                      <div
                        key={index}
                        className={drumStyles.roll}
                        style={{
                          height: `${ITEM_HEIGHT * 2.2}px`,
                          width: `${ITEM_HEIGHT * 1.2}px`,
                        }}
                      >
                        <TapeContent
                          reel={game.reel}
                          tapeRef={tapeRefs.current[index]}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <HandBtn spin={handleSpin} isSpinning={game.isSpinning}></HandBtn>

            {exploding && <div className={boomStyles.explosion}></div>}
          </div>
        </div>
        {/* тень-дыра снаружи контейнера: её низ перекрывает автомат (z-index), как в оригинале */}
        <div id="shadow" className={boomStyles.shadow} ref={shadowRef}></div>
      </div>

      <div className={styles.panel}>
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
      </div>

      <div className={styles.controls}>
        <label className={styles.autoLabel}>
          <input
            type="checkbox"
            checked={autoSpin}
            onChange={(e) => setAutoSpin(e.target.checked)}
          />
          автокрут
        </label>
        <Link to="/workshop" className={styles.workshopLink}>
          🔧 Мастерская
        </Link>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}
    </div>
  );
}
