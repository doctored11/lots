import React, { useContext, useRef, useState } from "react";
import { MashineDrum } from "./mashineDrum/MashineDrum";
import { REWARDS } from "../../../../constants/drumConstants";
import { getRandomInt } from "../../../../tools/tools";
import styles from "./mashineBody.module.css";
import { SlotContext } from "../SlotContext";
import { PlayerContext } from "../../../../PlayerContext";

export function MashineBody() {
  const slotMashine = useContext(SlotContext);
  const player = useContext(PlayerContext); 

  const itemHeight = 128;
  if (!slotMashine) return;
  const reel: Array<keyof typeof REWARDS> = slotMashine.reel;
  const [spinValues, setSpinValues] = useState<number[]>([0, 0, 0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const tapeRefs = useRef<HTMLDivElement[]>([]);

  function handleSpinResult(results: string[]) {
    const finalWin = calculateWinnings(results);
  
    if (player) {
      player.addBalance(finalWin);
    }
  
    console.log(`Комбинация: ${results.join(", ")}`);
    console.log(`Выигрыш: ${finalWin}`);
  
    slotMashine?.setBetInGame(0);
    setIsSpinning(false);
  }
  

  async function startSpin() {
    setIsSpinning(true);
    const newValues = [
      getRandomInt(0, reel.length - 1),
      getRandomInt(0, reel.length - 1),
      getRandomInt(0, reel.length - 1),
    ];
    setSpinValues(newValues);
  }
  function spin() {
    if (!slotMashine || !player) return;
    const betStep = slotMashine.betStep;

    if (player.canSpend(betStep)) {
      if (player.minusBalance(betStep)) {
        slotMashine.setBetInGame(betStep); 
        startSpin(); 
      }
    } else {
      alert("Без гроша и жизнь плоха, или как там в оригинале...");
    }
  }

  return (
    <div className={styles.mashineBody}>
      <div>MashineBody</div>
      <div className={styles.dramFrame}>
        <MashineDrum
          spinValues={spinValues}
          reel={reel}
          onSpinEnd={handleSpinResult}
          isSpinning={isSpinning}
        />
      </div>{" "}
      <button onClick={spin} disabled={isSpinning}>
        {" "}
        Крутить
      </button>
    </div>
  );
}

function calculateWinnings(results: string[]): number {
  let totalPlus = 0;
  let totalMultiply = 1;

  const counts: Record<string, number> = results.reduce((acc, symbol) => {
    acc[symbol] = (acc[symbol] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(counts).forEach(([symbol, count]) => {
    const rewardKey = symbol as keyof typeof REWARDS;
    const rewardValues = REWARDS[rewardKey].values;
    const reward = rewardValues[count as 1 | 2 | 3];

    if (reward.type === "plus") {
      totalPlus += reward.amount;
    } else if (reward.type === "multiply") {
      totalMultiply *= reward.factor;
    }
  });

  return totalPlus * totalMultiply;
}