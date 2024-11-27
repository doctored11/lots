import React, { useContext, useState } from "react";
import {
  SlotContext,
  useSlotContext,
} from "../slotMashine/slotMashine/SlotContext";
import { getRandomColor } from "../../tools/tools";
import styles from "./changeMashine.module.css";
import { PlayerContext } from "../../PlayerContext";
import { REWARDS } from "../../constants/drumConstants";
import { useMashineLogic } from "../../components/slotMashine/slotMashine/mashineBody/useMashineLogic";

export function ChangeMashine() {
  const slot = useSlotContext();
  const player = useContext(PlayerContext);
  const mashineView = document.getElementById("mashine");
  const shadowView = document.getElementById("shadow");
  const cssHideAniDuration = 2_000; //мс
  const cssShowAniDuration = 1_200; //мс
  const saveDelta = 100;

  const [isDisabled, setIsDisabled] = useState(false);
  const { isSpinning,isAnimating,setIsAnimating } = useSlotContext();

  if (!slot || !player) return null;
  const handleChangeMashine = async () => {
    console.log("чендж машины Isspin",isSpinning)
    if (isDisabled || slot.betInGame > 0 || isSpinning) return;
    setIsAnimating(true)

    // setIsDisabled(true);
   
    shadowView?.classList.add(styles.shadow);
    if (mashineView) {
      setTimeout(() => {
        mashineView.classList.add(styles.mashineHide);
        shadowView?.classList.add(styles.shadowGrow);
      }, saveDelta);
      // mashineView.classList.add(styles.mashineHide);
      // shadowView?.classList.add(styles.shadow);
    }
    let newReel: Array<keyof typeof REWARDS>, newBalance: number; //мы же не можем использовать var (кто вообще придумал так самоограничиваться)
    try {
      const response = await slot.getNewMachine(
        player.chatId + "",
        player.balance
      );
      console.log("ОТвет на смену машины: ", response);
      if (response.success && response.data) {
        newReel = response.data.newReel;
        newBalance = response.data.newBalance;
      } else {
        console.error("Ошибка смены автомата: " + response.error);
        restorePreviousState();
      }
    } catch (error) {
      console.error("Ошибка смены автомата:", error);
      restorePreviousState();
    } finally {
      // setIsDisabled(false);
      setIsAnimating(false)

    }

    setTimeout(() => {
      mashineView?.classList.remove(styles.mashineHide);
      shadowView?.classList.remove(styles.shadowGrow);

      mashineView?.classList.add(styles.mashineShow);
      shadowView?.classList.add(styles.shadowAppearance);
     
    }, cssHideAniDuration + 2 * saveDelta);

    setTimeout(async () => {
      if (newReel.length > 0 && newBalance) {
        slot.setReel(newReel);
        slot.setBetStep(10);
        slot.setLastWin(0);
        slot.setMaxWin(0);
        slot.setColor(getRandomColor());
        player.setBalance(newBalance);
        console.log("Новая лента автомата:", newReel);
      } else {
        restorePreviousState();
      }
    }, cssHideAniDuration + saveDelta);

    setTimeout(() => {
      mashineView?.classList.remove(styles.mashineShow);
      shadowView?.classList.remove(styles.shadowAppearance);
    }, cssHideAniDuration + cssShowAniDuration + saveDelta);
  };

  function restorePreviousState() {
    console.warn("🤡 Восстанавленно предыдущее состояние автомата ", slot.reel);
    slot.setReel(slot.reel);
    slot.setBetStep(slot.betStep);
    slot.setLastWin(slot.lastWin);
    slot.setMaxWin(slot.maxWin);
    slot.setColor(slot.color);
  }
  return (
    <button
      onClick={handleChangeMashine}
      disabled={isAnimating }
      className={styles.button}
    >
      {"-Change Slot Machine-"}
    </button>
  );
}
