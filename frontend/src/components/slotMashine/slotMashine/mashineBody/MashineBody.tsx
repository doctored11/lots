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

  const [pendingBalance, setPendingBalance] = useState<number | null>(null); 
  

  const tapeRefs = useRef<HTMLDivElement[]>([]);


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

  async function onSpinEnd() {
    if (pendingBalance !== null && player) {
      console.log("✔️ Анимация завершена. Обновляем баланс и слот.");
      player.addBalance(pendingBalance - player.balance);
      slotMashine?.updateSlotScore(pendingBalance - player.balance);
      slotMashine?.setBetInGame(0);
      setPendingBalance(null);
    }
    setIsSpinning(false);
  }

  async function startSpin() {
    try {
      if (!player || !slotMashine) return;
      setIsSpinning(true);
      const response = await spinSlots(
        player.chatId,
        slotMashine.betInGame,
        player.balance
      );
      if (response.success) {
        const { combination, newBalance } = response.data;

        console.log("🤔Новая комбинация:", combination);
        console.log("Новый баланс:", newBalance);

        setSpinValues(combination);
        setPendingBalance(newBalance);

        
      } else {
        alert("Ошибка: " + response.error);
      }
    } catch (err) {
      console.error("Ошибка спина:", err);
    } finally {
      // setIsSpinning(false);
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
                 onSpinEnd={onSpinEnd}
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
