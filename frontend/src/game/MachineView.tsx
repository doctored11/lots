import React, { useEffect, useRef, useState } from "react";
import { useGame, MachineState, SpinResult } from "./GameContext";
import { ITEMS, ECONOMY, machineBetRange } from "./catalog";
import { rollSpin } from "../lots/components/slotMashine/slotMashine/mashineBody/mashineDrum/rollSpin";
import { getRandomInt } from "../tools/tools";
import { HandBtn } from "../lots/components/slotMashine/slotMashine/mashineBody/hendBtn/HandBtn";
import machineStyles from "../lots/components/slotMashine/slotMashine/mashineBody/mashineBody.module.css";
import drumStyles from "../lots/components/slotMashine/slotMashine/mashineBody/mashineDrum/mashineDrum.module.css";
import boomStyles from "../lots/components/changeMashine/changeMashine.module.css";
import styles from "./gamePage.module.css";

const ITEM_HEIGHT = 96;
// высота барабана ужимается, если барабанов больше 3
function itemHeightFor(reelCount: number): number {
  return reelCount <= 3 ? ITEM_HEIGHT : Math.floor(ITEM_HEIGHT * (3 / reelCount));
}

function TapeContent({
  reel,
  tapeRef,
  itemHeight,
}: {
  reel: string[];
  tapeRef: React.RefObject<HTMLDivElement>;
  itemHeight: number;
}) {
  useEffect(() => {
    if (!tapeRef || !tapeRef.current) return;
    tapeRef.current.innerHTML = "";
    // несобранный автомат — лента из вопросов
    const keys = reel.length > 0 ? reel : ["?", "?", "?", "?"];
    keys.forEach((key) => {
      const item = ITEMS[key];
      let el: HTMLElement;
      if (item?.image) {
        el = document.createElement("img");
        (el as HTMLImageElement).src = item.image;
      } else {
        el = document.createElement("div");
        el.textContent = item ? item.emoji : "?";
        el.style.fontSize = `${itemHeight * 0.6}px`;
        el.style.display = "flex";
        el.style.alignItems = "center";
        el.style.justifyContent = "center";
        if (!item) el.style.color = "#98979ef8";
      }
      el.style.height = `${itemHeight}px`;
      el.style.width = `${itemHeight}px`;
      tapeRef.current?.appendChild(el);
    });
  }, [reel, itemHeight]);
  return <div ref={tapeRef} className={drumStyles.tape}></div>;
}

// один автономный автомат: свои барабаны, ставка, автокрут, анимации
export function MachineView({ mi }: { mi: number }) {
  const game = useGame();
  const machine: MachineState | undefined = game.machines[mi];
  const reelCount = machine?.reelCount ?? 3;
  const itemHeight = itemHeightFor(reelCount);

  const [spinValues, setSpinValues] = useState<number[]>(
    Array(reelCount).fill(0)
  );
  const [pending, setPending] = useState<SpinResult | null>(null);
  const [autoSpin, setAutoSpin] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [toast, setToast] = useState("");
  const [exploding, setExploding] = useState(false);

  const tapeRefs = useRef<React.RefObject<HTMLDivElement>[]>([]);
  if (tapeRefs.current.length !== reelCount) {
    tapeRefs.current = Array.from({ length: reelCount }, () =>
      React.createRef<HTMLDivElement>()
    );
  }
  const mashineRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSpinValues((prev) =>
      prev.length === reelCount ? prev : Array(reelCount).fill(0)
    );
  }, [reelCount]);

  const showToast = (text: string, ms = 3000) => {
    setToast(text);
    setTimeout(() => setToast(""), ms);
  };

  function playExplosion() {
    setExploding(true);
    setTimeout(() => setExploding(false), 900);
  }

  // прилёт после сборки/покупки/восстановления: улет старого, прилёт нового
  useEffect(() => {
    if (game.justBuilt !== machine?.id) return;
    const el = mashineRef.current;
    const shadow = shadowRef.current;
    if (!el) return;

    shadow?.classList.add(boomStyles.shadowGrow);
    el.classList.add(boomStyles.mashineHide);
    const t1 = setTimeout(() => {
      el.classList.remove(boomStyles.mashineHide);
      shadow?.classList.remove(boomStyles.shadowGrow);
      el.classList.add(boomStyles.mashineShow);
      shadow?.classList.add(boomStyles.shadowAppearance);
    }, 1800);
    const t2 = setTimeout(() => {
      el.classList.remove(boomStyles.mashineShow);
      shadow?.classList.remove(boomStyles.shadowAppearance);
      game.clearJustBuilt();
    }, 1800 + 1400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [game.justBuilt]);

  // тряска автомата во время прокрута
  useEffect(() => {
    const el = mashineRef.current;
    if (!el) return;
    if (isSpinning) {
      const t = setTimeout(() => el.classList.add(machineStyles.working), 300);
      return () => {
        clearTimeout(t);
        el.classList.remove(machineStyles.working);
      };
    }
    el.classList.remove(machineStyles.working);
  }, [isSpinning]);

  function handleSpin() {
    if (!machine || isSpinning) return;
    const result = game.doSpin(mi);
    if ("error" in result) {
      if (result.error === "broken") {
        showToast("💥 Взорвался! Восстановление: " + ECONOMY.newMachineCost);
        playExplosion();
      } else if (result.error === "noReel") {
        showToast("Собери ленту в мастерской");
        setAutoSpin(false);
      } else {
        showToast("Не хватает монет");
        setAutoSpin(false);
      }
      return;
    }
    game.chargeSpinCost(result.cost);
    setIsSpinning(true);
    setSpinValues(result.combination);
    setPending(result);
  }

  // запуск анимации барабанов
  useEffect(() => {
    if (!isSpinning || !pending) return;
    if (tapeRefs.current.length < spinValues.length) return;
    const promises = spinValues.map((value, index) =>
      rollSpin(
        tapeRefs.current[index].current!,
        itemHeight,
        getRandomInt(12, 35),
        getRandomInt(3, 8),
        value
      )
    );
    Promise.all(promises).then(() => {
      spinValues.forEach((targetIndex, reelIndex) => {
        const tape = tapeRefs.current[reelIndex]?.current;
        const el = tape?.children[targetIndex];
        if (el instanceof HTMLElement) {
          el.classList.add(drumStyles.winEl);
          setTimeout(() => el.classList.remove(drumStyles.winEl), 700);
        }
      });

      game.applySpinResult(mi, pending);
      setIsSpinning(false);
      if (pending.unlockedRecipe) {
        showToast(`📖 Открыт рецепт: ${ITEMS[pending.unlockedRecipe].label}!`, 4000);
      }
      if (pending.broken) {
        setAutoSpin(false);
        playExplosion();
        setTimeout(() => showToast("💥 Автомат взорвался!", 4000), 600);
      }
      setPending(null);
    });
  }, [spinValues]);

  // автокрут этого автомата (выключается при HP ≤ 10%)
  useEffect(() => {
    if (!autoSpin || !machine) return;
    if (isSpinning || game.justBuilt !== null) return;
    if (machine.hp <= machine.maxHp * 0.1 || game.balance < machine.bet) {
      setAutoSpin(false);
      if (machine.hp > 0 && machine.hp <= machine.maxHp * 0.1) {
        showToast("⚠️ Автокрут выкл: прочность ≤ 10%");
      }
      return;
    }
    const t = setTimeout(handleSpin, 700);
    return () => clearTimeout(t);
  }, [autoSpin, isSpinning, machine?.hp, game.balance, game.justBuilt]);

  if (!machine) return null;

  const { min: betMin, max: betMax } = machineBetRange(machine.reel);
  const hpPercent = Math.max(
    0,
    Math.min(100, (machine.hp / machine.maxHp) * 100)
  );
  const hpClass =
    hpPercent > 50 ? styles.hpHigh : hpPercent > 20 ? styles.hpMid : styles.hpLow;

  return (
    <div className={styles.machineCard} id={`machine-${machine.id}`}>
      <div className={styles.machineStage}>
        <div className={machineStyles.mashineContainer}>
          <div
            className={machineStyles.mashine}
            ref={mashineRef}
            style={{ ["--color" as string]: machine.color }}
          >
            <div className={machineStyles.out}>
              <div className={machineStyles.mashineHead}>
                <div className={machineStyles.headUp}></div>
                <div className={machineStyles.headMid}></div>
                <div className={machineStyles.headLow}></div>
              </div>
              <div
                className={machineStyles.mashineBody}
                style={{ backgroundColor: machine.color }}
              >
                {/* имя на корпусе */}
                <div className={styles.machineBodyName}>{machine.name}</div>
                <div className={machineStyles.dramFrame}>
                  <div className={drumStyles.slotDrum}>
                    {spinValues.map((_, index) => (
                      <div
                        key={index}
                        className={drumStyles.roll}
                        style={{
                          height: `${itemHeight * 2.2}px`,
                          width: `${itemHeight * 1.2}px`,
                        }}
                      >
                        <TapeContent
                          reel={machine.reel}
                          tapeRef={tapeRefs.current[index]}
                          itemHeight={itemHeight}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <HandBtn spin={handleSpin} isSpinning={isSpinning}></HandBtn>

            {exploding && <div className={boomStyles.explosion}></div>}
          </div>
        </div>
        <div className={boomStyles.shadow} ref={shadowRef}></div>
      </div>

      {/* под автоматом: выигрыш, HP+хил, ставка, автокрут */}
      <div className={styles.machinePanel}>
        <div
          className={`${styles.winPlaque} ${
            machine.lastWin > 0 ? styles.winPlaqueActive : ""
          }`}
        >
          {machine.lastWin > 0
            ? `+${machine.lastWin} (макс: ${machine.maxWin})`
            : "—"}
        </div>

        <div className={styles.hpRow}>
          <div className={styles.hpBar}>
            <div
              className={`${styles.hpFill} ${hpClass}`}
              style={{ width: `${hpPercent}%` }}
            ></div>
            <span className={styles.hpText}>
              HP {machine.hp}/{machine.maxHp}
            </span>
          </div>
          {machine.hp > 0 ? (
            <button
              className={styles.repairBtn}
              onClick={() => {
                const err = game.repair(mi);
                if (err) showToast(err);
              }}
              disabled={machine.hp >= machine.maxHp || isSpinning}
              title={`+${ECONOMY.repairAmount} HP за ${ECONOMY.repairCost} монет`}
            >
              🔧+{ECONOMY.repairAmount}HP ({ECONOMY.repairCost})
            </button>
          ) : (
            <button
              className={styles.repairBtn}
              onClick={() => {
                const err = game.restoreMachine(mi);
                if (err) showToast(err);
              }}
              title="Восстановить автомат (улучшения сохранятся, лоты утеряны)"
            >
              🛒восстановить ({ECONOMY.newMachineCost})
            </button>
          )}
        </div>

        <div className={styles.betRow}>
          <button
            className={styles.betBtn}
            onClick={() => game.setBet(mi, machine.bet - 1)}
            disabled={machine.bet <= betMin || isSpinning}
          >
            −
          </button>
          <input
            type="range"
            className={styles.betSlider}
            min={betMin}
            max={betMax}
            value={machine.bet}
            disabled={isSpinning}
            onChange={(e) => game.setBet(mi, Number(e.target.value))}
          />
          <button
            className={styles.betBtn}
            onClick={() => game.setBet(mi, machine.bet + 1)}
            disabled={machine.bet >= betMax || isSpinning}
          >
            +
          </button>
          <span className={styles.betValue}>{machine.bet}💰</span>
          <label className={styles.autoLabel}>
            <input
              type="checkbox"
              checked={autoSpin}
              onChange={(e) => setAutoSpin(e.target.checked)}
            />
            автокрут
          </label>
        </div>

        {machine.reel.length === 0 && (
          <div className={styles.noReelLine}>🛠 собери ленту в мастерской</div>
        )}
      </div>

      {toast && <div className={styles.machineToast}>{toast}</div>}
    </div>
  );
}
