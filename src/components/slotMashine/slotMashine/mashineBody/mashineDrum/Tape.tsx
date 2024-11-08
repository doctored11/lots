import React, { useEffect } from "react";
import { REWARDS } from "../../../../../constants/drumConstants";
import styles from "./mashineDrum.module.css"
interface TapeProps {
  tapeRef: React.RefObject<HTMLDivElement>;
  reel: Array<keyof typeof REWARDS>;
  itemHeight: number;
}
export function Tape({ tapeRef, reel, itemHeight }: TapeProps) {
  useEffect(() => {
    if (tapeRef.current) {
      tapeRef.current.innerHTML = "";
      reel.forEach((el) => {
        const img = document.createElement("img");
        img.src = REWARDS[el].image;
        img.onload = () => {
          //  console.log(img.width)
         img.style.height = `${itemHeight }px`;
         img.style.width = `${itemHeight }px`;
        };
        tapeRef.current?.appendChild(img);
      });
    }
  }, [reel]);

  return <div ref={tapeRef} className={styles.tape}></div>;
}
