import React from "react";
import styles from "./handBtn.module.css";

interface HandBtnProps {
  spin: () => void;
  isSpinning: boolean;
}
export function HandBtn({ spin, isSpinning }: HandBtnProps) {
  const btn = (
    <div className={`${styles.handZone} ${isSpinning ? styles.active : ""}`}>
      <div className={styles.hand}></div>
      <button
        onClick={spin}
        disabled={isSpinning}
        className={styles.handBtn}
      ></button>
    </div>
  );
  return btn;
}
