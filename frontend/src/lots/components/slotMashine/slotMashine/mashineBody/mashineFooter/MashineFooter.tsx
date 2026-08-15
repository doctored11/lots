import React, { useContext, useEffect, useState } from "react";
import styles from "./mashineFooter.module.css";
import { SlotContext } from "../../SlotContext";
import { PlayerContext } from "../../../../../../PlayerContext";
import { useGameAPI } from "../../../../../../api/useLotsAPI";
import { REWARDS } from "../../../../../constants/drumConstants";
import {
  ITEM_RARITY,
  ITEM_LABELS,
  RARITY_LABELS,
} from "../../../../../constants/itemMeta";

const MACHINE_MAX_HP = 100;
const REPAIR_COST = 50;

export function MashineFooter() {
  const slotMashine = useContext(SlotContext);
  const player = useContext(PlayerContext);
  const { repairMachine } = useGameAPI();

  const lastWin = slotMashine?.lastWin ?? 0;
  const lastDrop = slotMashine?.lastDrop ?? null;
  const lastUnlock = slotMashine?.lastUnlock ?? null;
  const machineHp = slotMashine?.machineLives ?? 0;
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

  const hpPercent = Math.max(0, Math.min(100, (machineHp / MACHINE_MAX_HP) * 100));
  const hpClass =
    hpPercent > 50 ? styles.hpHigh : hpPercent > 20 ? styles.hpMid : styles.hpLow;

  const handleRepair = async () => {
    if (!player || !slotMashine) return;
    const resp = await repairMachine(player.chatId, player.balance);
    if (resp.success) {
      slotMashine.setMachineLives(resp.data.newLives);
      player.setBalance(resp.data.newBalance);
    } else {
      alert(resp.error || "Не удалось починить автомат");
    }
  };

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
          🎁 выпал предмет:
          <img
            src={REWARDS[lastDrop].image}
            alt={ITEM_LABELS[lastDrop]}
            className={styles.dropImg}
          />
          <span className={styles["rarity_" + ITEM_RARITY[lastDrop]]}>
            {ITEM_LABELS[lastDrop]} ({RARITY_LABELS[ITEM_RARITY[lastDrop]]})
          </span>
        </div>
      )}

      <div className={styles.hpRow}>
        <div className={styles.hpBar}>
          <div
            className={`${styles.hpFill} ${hpClass}`}
            style={{ width: `${hpPercent}%` }}
          ></div>
          <span className={styles.hpText}>
            HP {machineHp}/{MACHINE_MAX_HP}
          </span>
        </div>
        <button
          className={styles.repairBtn}
          onClick={handleRepair}
          disabled={
            machineHp >= MACHINE_MAX_HP ||
            slotMashine?.isSpinning ||
            slotMashine?.isAnimating
          }
          title={`+10 HP за ${REPAIR_COST} монет`}
        >
          🔧 +10 HP ({REPAIR_COST})
        </button>
      </div>

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
