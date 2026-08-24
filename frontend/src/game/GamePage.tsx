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
// высота барабана ужимается, если барабанов больше 3
function itemHeightFor(reelCount: number): number {
  return reelCount <= 3 ? ITEM_HEIGHT : Math.floor(ITEM_HEIGHT * (3 / reelCount));
}

interface FloatNum {
  id: number;
  change: number;
}
let floatId = 0;

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

export function GamePage() {
  const game = useGame();
  const machine = game.machines[game.activeMachine] ?? {
    id: 0,
    name: "?",
    reel: [],
    reelCount: 3,
    hp: 0,
    maxHp: 100,
    hpLevel: 0,
    spinsDone: 0,
  };
  const reelCount = machine.reelCount;
  const [spinValues, setSpinValues] = useState<number[]>(
    Array(reelCount).fill(0)
  );
  const [pending, setPending] = useState<SpinResult | null>(null);
  const [autoSpin, setAutoSpin] = useState(false);
  const [toast, setToast] = useState("");
  const [floats, setFloats] = useState<FloatNum[]>([]);
  const [exploding, setExploding] = useState(false);

  const tapeRefs = useRef<React.RefObject<HTMLDivElement>[]>(
    [0, 1, 2].map(() => React.createRef<HTMLDivElement>())
  );
  // refs под количество барабанов активного автомата (1..5)
  if (tapeRefs.current.length !== reelCount) {
    tapeRefs.current = Array.from({ length: reelCount }, () =>
      React.createRef<HTMLDivElement>()
    );
  }
  // spinValues под количество барабанов
  useEffect(() => {
    setSpinValues((prev) =>
      prev.length === reelCount ? prev : Array(reelCount).fill(0)
    );
  }, [reelCount]);
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

  // пересборка/покупка: старый проваливается в дыру (squashJump + тень растёт),
  // в момент исчезновения подменяем ленту, новый прилетает (sqwishFall + тень)
  useEffect(() => {
    if (!game.justBuilt) return;
    const el = mashineRef.current;
    const shadow = shadowRef.current;
    if (!el) return;

    // старый улетает в дыру
    shadow?.classList.add(boomStyles.shadowGrow);
    el.classList.add(boomStyles.mashineHide);

    const t1 = setTimeout(() => {
      // подмена ленты пока автомат скрыт — вылетает именно старый
      game.applyPendingReel();
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
        showToast("💥 Автомат взорвался! Только новый за " + ECONOMY.newMachineCost);
        playExplosion();
      } else if (result.error === "noReel") {
        showToast("Лента утеряна — собери новый автомат в мастерской");
        setAutoSpin(false);
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
    // на смене автомата spinValues может временно не совпадать с числом барабанов
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
      // подсветка выпавших символов
      spinValues.forEach((targetIndex, reelIndex) => {
        const tape = tapeRefs.current[reelIndex]?.current;
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

  // idle-элемент: автопрокрут (выключается при HP ≤ 10% — бережём автомат)
  useEffect(() => {
    if (!autoSpin) return;
    if (game.isSpinning || game.isAnimating) return;
    if (
      machine.hp <= machine.maxHp * 0.1 ||
      game.balance < game.spinCost
    ) {
      setAutoSpin(false);
      if (machine.hp > 0 && machine.hp <= machine.maxHp * 0.1) {
        showToast("⚠️ Автокрут выключен: прочность ≤ 10%");
      }
      return;
    }
    const t = setTimeout(handleSpin, 700);
    return () => clearTimeout(t);
  }, [autoSpin, game.isSpinning, game.isAnimating, machine.hp, game.balance]);

  const itemHeight = itemHeightFor(reelCount);
  const hpPercent = Math.max(0, Math.min(100, (machine.hp / machine.maxHp) * 100));
  const hpClass =
    hpPercent > 50 ? styles.hpHigh : hpPercent > 20 ? styles.hpMid : styles.hpLow;

  const handleBuyNew = () => {
    const err = game.buyNewMachine();
    if (err) showToast(err);
    else addFloat(-ECONOMY.newMachineCost);
  };

  const handleBuyExtra = () => {
    const err = game.buyExtraMachine();
    if (err) showToast(err);
    else addFloat(-game.nextExtraMachineCost);
  };

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
        <span className={styles.cost} title="Ставка за прокрут. Выигрыш считается от неё. Диапазон зависит от лотов в ленте.">
          ставка: {game.spinCost}
        </span>
      </div>

      {game.machines.length > 1 && (
        <div className={styles.machineTabs}>
          {game.machines.map((m, i) => (
            <button
              key={m.id}
              className={`${styles.machineTab} ${
                i === game.activeMachine ? styles.machineTabActive : ""
              }`}
              onClick={() => game.setActiveMachine(i)}
              title={`${m.name} · барабанов: ${m.reelCount} · HP ${m.hp}/${m.maxHp}`}
            >
              {m.name}
              {m.hp <= 0 ? " 💥" : ""}
              {m.reel.length === 0 && m.hp > 0 ? " ❓" : ""}
            </button>
          ))}
        </div>
      )}

      {/* имя активного автомата — чтобы понимать, куда что ставишь */}
      <div className={styles.machineName}>
        {machine.name} · барабанов: {machine.reelCount}
      </div>

      <div className={styles.betRow}>
        <button
          className={styles.betBtn}
          onClick={() => game.setBet(game.bet - 1)}
          disabled={game.bet <= game.betMin || game.isSpinning}
        >
          −
        </button>
        <input
          type="range"
          className={styles.betSlider}
          min={game.betMin}
          max={game.betMax}
          value={game.bet}
          disabled={game.isSpinning}
          onChange={(e) => game.setBet(Number(e.target.value))}
        />
        <button
          className={styles.betBtn}
          onClick={() => game.setBet(game.bet + 1)}
          disabled={game.bet >= game.betMax || game.isSpinning}
        >
          +
        </button>
        <span className={styles.betRange}>
          {game.betMin}–{game.betMax}
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

            <HandBtn spin={handleSpin} isSpinning={game.isSpinning}></HandBtn>

            {exploding && <div className={boomStyles.explosion}></div>}
          </div>
        </div>
        {/* тень-дыра снаружи контейнера: её низ перекрывает автомат (z-index), как в оригинале */}
        <div id="shadow" className={boomStyles.shadow} ref={shadowRef}></div>
      </div>

      <div className={styles.panel}>
        {game.lastLostItems.length > 0 && (
          <div className={styles.lostLine}>
            💥 При взрыве потеряно:{" "}
            {game.lastLostItems.map((k) => ITEMS[k].label).join(", ")}
          </div>
        )}
        {machine.reel.length === 0 && (
          <div className={styles.noReelLine}>
            🛠 Лента утеряна — <Link to="/workshop">собери автомат в мастерской</Link>
          </div>
        )}
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
              HP {machine.hp}/{machine.maxHp}
            </span>
          </div>
          {machine.hp > 0 ? (
            <button
              className={styles.repairBtn}
              onClick={handleRepair}
              disabled={machine.hp >= machine.maxHp || game.isSpinning}
              title={`+${ECONOMY.repairAmount} HP за ${ECONOMY.repairCost} монет`}
            >
              🔧 +{ECONOMY.repairAmount} HP ({ECONOMY.repairCost})
            </button>
          ) : (
            <button
              className={styles.repairBtn}
              onClick={handleBuyNew}
              disabled={game.isSpinning || game.isAnimating}
              title="Автомат взорвался — только новый"
            >
              🛒 Заменить ({ECONOMY.newMachineCost})
            </button>
          )}
          {machine.hp > 0 && (
            <button
              className={styles.repairBtn}
              onClick={handleBuyExtra}
              disabled={game.isSpinning || game.isAnimating}
              title="Купить ещё один автомат (новый слот с пустой лентой, 1-2 барабана)"
            >
              🛒 Новый ({game.nextExtraMachineCost})
            </button>
          )}
        </div>

        {/* улучшения активного автомата */}
        <div className={styles.upgradeRow}>
          <button
            className={styles.repairBtn}
            onClick={() => {
              const err = game.upgradeReels();
              if (err) showToast(err);
              else addFloat(-game.nextReelUpgradeCost);
            }}
            disabled={
              machine.reelCount >= ECONOMY.maxReels ||
              game.isSpinning ||
              game.balance < game.nextReelUpgradeCost
            }
            title={`+1 барабан (сейчас ${machine.reelCount}, макс ${ECONOMY.maxReels})`}
          >
            🎰 +лента (~{game.nextReelUpgradeCost}+)
          </button>
          <button
            className={styles.repairBtn}
            onClick={() => {
              const err = game.upgradeHp();
              if (err) showToast(err);
              else addFloat(-game.nextHpUpgradeCost);
            }}
            disabled={game.isSpinning || game.balance < game.nextHpUpgradeCost}
            title={`+${ECONOMY.hpUpgradeStep} к макс. HP (сейчас ${machine.maxHp})`}
          >
            ❤️ +{ECONOMY.hpUpgradeStep} макс HP ({game.nextHpUpgradeCost})
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
