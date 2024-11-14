import React, { useContext, useEffect, useState } from "react";
import styles from "./mashineFooter.module.css";
import { SlotContext } from "../../SlotContext";
import { PlayerContext } from "../../../../../PlayerContext";
export function MashineFooter() {
  const slotMashine = useContext(SlotContext);
  const player = useContext(PlayerContext);

  return (
    <div className={styles.mashineFooter}>
      {/* <p className={styles.betInGame}>{slotMashine?.betInGame}</p> */}

      <ul className={styles.statsLine}>
        <p className={`${styles.betInGame} ${styles.statsItem}`}>
          {" "}
          bet:
          <label className={styles.mashineScoreRT}>
            {slotMashine?.betInGame}{" "}
          </label>
        </p>
        <p className={`${styles.lastWin} ${styles.statsItem}`}>
          {" "}
          lastWin:
          <label className={styles.mashineScoreRT}>
            {slotMashine?.lastWin}{" "}
          </label>{" "}
        </p>

        <p className={`${styles.maxWin} ${styles.statsItem}`}>
          {" "}
          maxWin:
          <label className={styles.mashineScoreRT}>
            {slotMashine?.maxWin}{" "}
          </label>
        </p>
      </ul>
    </div>
  );
}
