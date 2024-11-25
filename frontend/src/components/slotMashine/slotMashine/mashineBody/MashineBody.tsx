import React, { useContext, useEffect, useRef, useState } from "react";
import { MashineDrum } from "./mashineDrum/MashineDrum";
import { REWARDS } from "../../../../constants/drumConstants";
import { getRandomInt } from "../../../../tools/tools";
import styles from "./mashineBody.module.css";
import { SlotContext } from "../SlotContext";
import { PlayerContext } from "../../../../PlayerContext";
import { HandBtn } from "./hendBtn/HandBtn";
import { MashineFooter } from "./mashineFooter/MashineFooter";
import { useGameAPI } from "../../../../api/useLotsAPI";

export function MashineBody() {
  const slotMashine = useContext(SlotContext);
  const player = useContext(PlayerContext);
  const { spinSlots, loading, error } = useGameAPI();

  const itemHeight = 128;

  if (!slotMashine) return;
  const reel: Array<keyof typeof REWARDS> = slotMashine.reel;
  const [spinValues, setSpinValues] = useState<number[]>([0, 0, 0]);
  const [isSpinning, setIsSpinning] = useState(false);
  const tapeRefs = useRef<HTMLDivElement[]>([]);

  // function handleSpinResult(results: string[]) {
  //   const finalWin = calculateWinnings(slotMashine?.betInGame || 0, results);

  //   if (player) {
  //     player.addBalance(finalWin);
  //   }

  //   console.log(`Комбинация: ${results.join(", ")}`);
  //   console.log(`Было в игре ${slotMashine?.betInGame}`);
  //   console.log(`Выигрыш: ${finalWin}`);

  //   slotMashine?.updateSlotScore(finalWin);
  //   slotMashine?.setBetInGame(0);
  //   setIsSpinning(false);
  // }

  // function handleSpinResult() {
  //   if (player) {
  //     player.addBalance(newBalance - player.balance);
  //   }

  //   console.log(
  //     `Выигрыш: ${(newBalance - (player?.balance || 1), newBalance)}`
  //   );

  //   if (player) slotMashine?.updateSlotScore(newBalance - player.balance);
  //   slotMashine?.setBetInGame(0);
  //   setIsSpinning(false);
  // }

  const mashineElement = document.getElementById("mashine");
  useEffect(() => {
    if (mashineElement) {
      if (isSpinning) {
        setTimeout(() => {
          mashineElement.classList.add(styles.working);
        }, 300);
      } else {
        mashineElement.classList.remove(styles.working);
      }
    }
  }, [isSpinning]);

  async function startSpin() {
    setIsSpinning(true);

    // const newValues = [
    //   getRandomInt(0, reel.length - 1),
    //   getRandomInt(0, reel.length - 1),
    //   getRandomInt(0, reel.length - 1),
    // ];

    //тут получать данные с бекенда
    let newValues;
    try {
      if (!player || !slotMashine) return;
      const response = await spinSlots(
        player.chatId,
        slotMashine.betInGame,
        player.balance
      );
      if (response.success) {
        const { combination, newBalance } = response.data;

        console.log("🤔Новая комбинация:", combination);
        console.log("Новый баланс:", newBalance);

        setSpinValues(combination.map((index: number) => index % reel.length));
        player.addBalance(newBalance - player.balance); //возможно это надо делать после всего (уже в окончании спина)
        slotMashine.updateSlotScore(newBalance - player.balance);
      } else {
        alert("Ошибка: " + response.error);
      }
    } catch (err) {
      console.error("Ошибка спина:", err);
    } finally {
      setIsSpinning(false);
      slotMashine?.setBetInGame(0);
    }
  }

  async function spin() {
    if (!slotMashine || !player) return;
    const betStep = slotMashine.betStep;

    if (slotMashine.betInGame > 0) await startSpin();
  }

  return (
    <div className={styles.mashineContainer}>
      <div className={styles.mashine} id="mashine">
        <div className={styles.out}>
          <div className={styles.mashineHead}>
            <div className={styles.headUp}></div>
            <div className={styles.headMid}></div>
            <div className={styles.headLow}></div>
          </div>
          <div
            className={styles.mashineBody}
            style={{ backgroundColor: slotMashine.color }}
          >
            <div className={styles.dramFrame}>
              <MashineDrum
                 spinValues={spinValues}
                 reel={reel}
                 onSpinEnd={() => setIsSpinning(false)}
                 isSpinning={isSpinning}
              />
            </div>{" "}
          </div>
          <MashineFooter></MashineFooter>
        </div>
        <HandBtn spin={spin} isSpinning={isSpinning}></HandBtn>
      </div>
    </div>
  );
}

// function calculateWinnings(bet: number, results: string[]): number {
//   let totalPlus = 0;
//   let totalMultiply = 1;

//   const counts: Record<string, number> = results.reduce((acc, symbol) => {
//     acc[symbol] = (acc[symbol] || 0) + 1;
//     return acc;
//   }, {} as Record<string, number>);

//   Object.entries(counts).forEach(([symbol, count]) => {
//     const rewardKey = symbol as keyof typeof REWARDS;
//     const rewardValues = REWARDS[rewardKey].values;
//     const reward = rewardValues[count as 1 | 2 | 3];

//     if (reward.type === "plus") {
//       totalPlus += reward.amount;
//     } else if (reward.type === "multiply") {
//       totalMultiply *= reward.factor;
//     }
//   });

//   return bet * totalPlus * totalMultiply;
