import React, { useContext, useState } from "react";
import { SlotContext, useSlotContext } from "../slotMashine/slotMashine/SlotContext";
import { getRandomColor } from "../../tools/tools";
import styles from "./changeMashine.module.css";
import { PlayerContext } from "../../PlayerContext";
import { REWARDS } from "../../constants/drumConstants";


export function ChangeMashine() {
  const slot = useSlotContext();
  const player = useContext(PlayerContext);
  const mashineView = document.getElementById("mashine");
  const shadowView = document.getElementById("shadow");
  const cssHideAniDuration = 2_000; //мс
  const cssShowAniDuration = 1_200; //мс
  const saveDelta = 100;

  const [pendingResponse, setPendingResponse] = useState<{
    newReel:  Array<keyof typeof REWARDS>
    newBalance: number;
  } | null>(null);

  if (!slot || !player) return null;
  const handleChangeMashine = async () => {
    if (slot.betInGame > 0) return;

    shadowView?.classList.add(styles.shadow);
    if (mashineView) {
      setTimeout(() => {
        mashineView.classList.add(styles.mashineHide);
        shadowView?.classList.add(styles.shadowGrow);
      }, saveDelta);
      // mashineView.classList.add(styles.mashineHide);
      // shadowView?.classList.add(styles.shadow);
    }

    try {
      const response = await slot.getNewMachine(player.chatId + "", player.balance);
      if (response.success  && response.data) {
        setPendingResponse({
          newReel: response.data.newReel,
          newBalance: response.data.newBalance,
        });
      } else {
        alert("Ошибка смены автомата: " + response.error);
        return;
      }
    } catch (error) {
      console.error("Ошибка смены автомата:", error);
      return;
    }
    
    setTimeout(() => {
      mashineView?.classList.remove(styles.mashineHide);
      shadowView?.classList.remove(styles.shadowGrow);

      mashineView?.classList.add(styles.mashineShow);
      shadowView?.classList.add(styles.shadowAppearance);
    }, cssHideAniDuration + 2 * saveDelta);

    setTimeout(async() => {
      if (pendingResponse) {
        slot.setReel(pendingResponse.newReel);
        slot.setBetStep(10);
        slot.setLastWin(0);
        slot.setMaxWin(0);
        slot.setColor(getRandomColor());
        player.setBalance(pendingResponse.newBalance); 
        console.log("Новая лента автомата:", pendingResponse.newReel);
      }
      
    }, cssHideAniDuration + saveDelta);

    setTimeout(() => {
      mashineView?.classList.remove(styles.mashineShow);
      shadowView?.classList.remove(styles.shadowAppearance);
    }, cssHideAniDuration + cssShowAniDuration + saveDelta);
  };

  return <button onClick={handleChangeMashine}>Change Slot Machine</button>;
}
