import React, { useContext } from "react";
import { SlotContext } from "../slotMashine/slotMashine/SlotContext";
import { getRandomColor } from "../../tools/tools";
import styles from "./changeMashine.module.css";

export function ChangeMashine() {
  const slot = useContext(SlotContext);
  const mashineView = document.getElementById("mashine");
  const shadowView = document.getElementById("shadow");
  const cssHideAniDuration = 2_000; //мс
  const cssShowAniDuration = 1_200; //мс
  const saveDelta = 100;

  if (!slot) return;
  const handleChangeMashine = () => {
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

    setTimeout(() => {
      mashineView?.classList.remove(styles.mashineHide);
      shadowView?.classList.remove(styles.shadowGrow);

      mashineView?.classList.add(styles.mashineShow);
      shadowView?.classList.add(styles.shadowAppearance);
    }, cssHideAniDuration + 2 * saveDelta);

    setTimeout(() => {
      slot.setBetStep(10);
      slot.setLastWin(0);
      slot.setMaxWin(0);
      slot.setColor(getRandomColor());
      slot.reelUpdate();
    }, cssHideAniDuration + saveDelta);

    setTimeout(() => {
      mashineView?.classList.remove(styles.mashineShow);
      shadowView?.classList.remove(styles.shadowAppearance);
    }, cssHideAniDuration + cssShowAniDuration + saveDelta);
  };

  return <button onClick={handleChangeMashine}>Change Slot Machine</button>;
}
