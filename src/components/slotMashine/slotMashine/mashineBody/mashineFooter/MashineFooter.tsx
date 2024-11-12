import React, { useContext } from "react";
import styles from "./mashineFooter.module.css"
import { SlotContext } from "../../SlotContext";
export function MashineFooter() {
    const slotMashine = useContext(SlotContext);
  return <div className={styles.mashineFooter}>

    <p className={styles.betInGame}>{slotMashine?.betInGame}</p>

  </div>;
}
