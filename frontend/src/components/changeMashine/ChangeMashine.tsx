import React, { useContext, useState } from "react";
import { useSlotContext } from "../slotMashine/slotMashine/SlotContext";
import { getRandomColor } from "../../tools/tools";
import styles from "./changeMashine.module.css";
import { PlayerContext } from "../../PlayerContext";
import { REWARDS } from "../../constants/drumConstants";

export function ChangeMashine() {
  const slot = useSlotContext();
  const player = useContext(PlayerContext);

  const mashineView = document.getElementById("mashine");
  const shadowView = document.getElementById("shadow");
  const cssHideAniDuration = 2_000; // мс
  const cssShowAniDuration = 1_200; // мс
  const saveDelta = 100;

  const { isAnimating, setIsAnimating, isSpinning } = slot;

  if (!slot || !player) return null;


  const startAnimation = () => {
    setIsAnimating(true);
    shadowView?.classList.add(styles.shadow);
    if (mashineView) {
      setTimeout(() => {
        mashineView.classList.add(styles.mashineHide);
        shadowView?.classList.add(styles.shadowGrow);
      }, saveDelta);
    }
  };

  const endAnimation = () => {
    mashineView?.classList.remove(styles.mashineHide);
    shadowView?.classList.remove(styles.shadowGrow);

    mashineView?.classList.add(styles.mashineShow);
    shadowView?.classList.add(styles.shadowAppearance);

    setTimeout(() => {
      mashineView?.classList.remove(styles.mashineShow);
      shadowView?.classList.remove(styles.shadowAppearance);
      setIsAnimating(false);
    }, cssShowAniDuration + saveDelta);
  };

 
  const changeMachineLogic = async () => {
    let newReel: Array<keyof typeof REWARDS> = [];
    let newBalance: number = player.balance;

    try {
      const response = await slot.getNewMachine(
        player.chatId + "",
        player.balance
      );
      if (response.success && response.data) {
        newReel = response.data.newReel;
        newBalance = response.data.newBalance;
      } else {
        console.error("Ошибка смены автомата: " + response.error);
        restorePreviousState();
        return;
      }
    } catch (error) {
      console.error("Ошибка смены автомата:", error);
      restorePreviousState();
      return;
    }

    
    slot.setReel(newReel);
    slot.setBetStep(10);
    slot.setLastWin(0);
    slot.setMaxWin(0);
    slot.setColor(getRandomColor());
    player.setBalance(newBalance);
    console.log("Новая лента автомата:", newReel);
  };

 
  const handleChangeMashine = async () => {
    if (isAnimating || isSpinning || slot.betInGame > 0) return;

    startAnimation(); 
    await changeMachineLogic(); 
    setTimeout(endAnimation, cssHideAniDuration + 2 * saveDelta);
  };

  
  const restorePreviousState = () => {
    console.warn("🤡 Восстановлено предыдущее состояние автомата ", slot.reel);
    slot.setReel(slot.reel);
    slot.setBetStep(slot.betStep);
    slot.setLastWin(slot.lastWin);
    slot.setMaxWin(slot.maxWin);
    slot.setColor(slot.color);
    setIsAnimating(false); 
  };

  return (
    <button
      onClick={handleChangeMashine}
      disabled={isAnimating || isSpinning}
      className={styles.button}
    >
      {"-Change Slot Machine-"}
    </button>
  );
}
