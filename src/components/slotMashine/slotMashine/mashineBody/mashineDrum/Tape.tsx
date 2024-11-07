import React, { useEffect } from "react";
import { REWARDS } from "../../../../../constants/drumConstants";

interface TapeProps {
  tapeRef: React.RefObject<HTMLDivElement>;
  reel: Array<keyof typeof REWARDS>;
  setItemHeight: (height: number) => void;
}

export function Tape({ tapeRef, reel, setItemHeight }: TapeProps) {
  useEffect(() => {
    if (tapeRef.current) {
      tapeRef.current.innerHTML = ""; 
      reel.forEach((el) => {
        const img = document.createElement("img");
        img.src = REWARDS[el].image;
        img.onload = () => setItemHeight(img.height);
        tapeRef.current?.appendChild(img);
      });
    }
  }, []);

  return <div ref={tapeRef}></div>;
}
