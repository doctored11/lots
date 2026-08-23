import React from "react";
import styles from "./handBtn.module.css";

interface HandBtnProps {
  spin: () => void;
  isSpinning: boolean;
}
export function HandBtn({ spin, isSpinning }: HandBtnProps) {
  const btn = (
    <div className={`${styles.handZone} ${isSpinning ? styles.active : ""}`}>
      {/* рычаг — единое целое: шар жёстко сидит на конце стержня */}
      <div className={styles.lever}>
        <button
          onClick={spin}
          disabled={isSpinning}
          className={styles.handBtn}
        ></button>
        <div className={styles.stick}></div>
      </div>
      <div className={styles.hand}></div>
    </div>
  );
  return btn;
}
