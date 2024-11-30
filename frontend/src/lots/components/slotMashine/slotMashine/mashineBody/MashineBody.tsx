import React, { useContext, useEffect, useRef, useState } from "react";
import { MashineDrum } from "./mashineDrum/MashineDrum";
import { REWARDS } from "../../../../constants/drumConstants";
import { getRandomInt } from "../../../../../tools/tools";
import styles from "./mashineBody.module.css";
import { SlotContext } from "../SlotContext";
import { PlayerContext } from "../../../../../PlayerContext";
import { HandBtn } from "./hendBtn/HandBtn";
import { MashineFooter } from "./mashineFooter/MashineFooter";
import { useGameAPI } from "../../../../../api/useLotsAPI";
import { useMashineLogic } from "./useMashineLogic";

export function MashineBody() {
  const slotMashine = useContext(SlotContext);
  const player = useContext(PlayerContext);
  const { spinSlots, loading, error } = useGameAPI();
  const { spinValues, isSpinning, startSpin, onSpinEnd } = useMashineLogic();
  const [triggerSpin, setTriggerSpin] = useState(false);
  const itemHeight = 128;

  if (!slotMashine) return;
  const reel: Array<keyof typeof REWARDS> = slotMashine.reel;

  const mashineElement = document.getElementById("mashine");
  useEffect(() => {
    console.log("💫 isSpining изменен", isSpinning);
    if (mashineElement) {
      if (isSpinning) {
        setTimeout(() => {
          mashineElement.classList.add(styles.working);
        }, 300);
      } else {
        setTimeout(() => {
          mashineElement.classList.remove(styles.working);
        }, 350);  //придумать что то (пока нет анимации взрыва бывает что машина продолдает трястись без ээтой задержки todo)
      }
    }
  }, [isSpinning]);

  async function spin() {
    if (!slotMashine || !player) return;
    const betStep = slotMashine.betStep;
    if (slotMashine.betInGame > 0) {
      setTriggerSpin(true);
      return;
    }
    if (slotMashine.betInGame == 0) {
      if (player.balance - betStep >= 0) {
        player.minusBalance(betStep);
        slotMashine.setBetInGame(slotMashine.betInGame + betStep);
        setTriggerSpin(true);
      } else {
        console.log("нет деняг");
      }
    } else {
      setTriggerSpin(false);
    }
  }
  useEffect(() => {
    if (triggerSpin && slotMashine.betInGame > 0) {
      startSpin().finally(() => setTriggerSpin(false));
    }
  }, [triggerSpin, slotMashine.betInGame, startSpin]);
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
                isSpinning={isSpinning || false}
              />
            </div>{" "}
          </div>
          <MashineFooter></MashineFooter>
        </div>
        <HandBtn spin={spin} isSpinning={isSpinning || false}></HandBtn>
      </div>
    </div>
  );
}
