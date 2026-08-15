import React, { useContext, useEffect, useState } from "react";
import styles from "./mashineFooter.module.css";
import { SlotContext } from "../../SlotContext";
import { PlayerContext } from "../../../../../../PlayerContext";
import { REWARDS } from "../../../../../constants/drumConstants";
import {
  ITEM_RARITY,
  ITEM_LABELS,
} from "../../../../../constants/itemMeta";
export function MashineFooter() {
  const slotMashine = useContext(SlotContext);
  const player = useContext(PlayerContext);

  const lastWin = slotMashine?.lastWin ?? 0;
  const lastDrop = slotMashine?.lastDrop ?? null;
  const lastUnlock = slotMashine?.lastUnlock ?? null;
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (lastWin > 0) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1200);
      return () => clearTimeout(t);
    }
  }, [lastWin]);

  useEffect(() => {
    if (lastUnlock) {
      const t = setTimeout(() => slotMashine?.setLastUnlock(null), 4000);
      return () => clearTimeout(t);
    }
  }, [lastUnlock]);

  return (
    <div className={styles.mashineFooter}>
      <div
        className={`${styles.winPlaque} ${
          lastWin > 0 ? styles.winPlaqueActive : ""
        } ${flash ? styles.winPlaqueFlash : ""}`}
      >
        {lastWin > 0 ? `ВЫИГРЫШ +${lastWin}` : "— нет выигрыша —"}
      </div>

      {lastUnlock && (
        <div className={styles.unlockPlaque}>
          📖 Открыт рецепт: {ITEM_LABELS[lastUnlock]}!
        </div>
      )}

      {lastDrop && (
        <div className={styles.dropLine}>
          дроп:
          <img
            src={REWARDS[lastDrop].image}
            alt={ITEM_LABELS[lastDrop]}
            className={styles.dropImg}
          />
          <span className={styles["rarity_" + ITEM_RARITY[lastDrop]]}>
            {ITEM_LABELS[lastDrop]}
          </span>
        </div>
      )}
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
