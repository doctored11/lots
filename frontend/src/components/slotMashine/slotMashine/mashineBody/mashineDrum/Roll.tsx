import React, { useRef } from "react";
import { Tape } from "./Tape";
import style from "./mashineDrum.module.css";
import { REWARDS } from "../../../../../constants/drumConstants";

interface RollProps {
  tapeRef: React.RefObject<HTMLDivElement>;
  addToRollRefs: (el: HTMLDivElement | null) => void;
  reel: Array<keyof typeof REWARDS>;
  itemHeight: number
}

export function Roll({ tapeRef, addToRollRefs, reel, itemHeight }: RollProps) {
  return (
    <div className={style.roll} ref={addToRollRefs} >
      <Tape tapeRef={tapeRef} reel={reel} itemHeight={itemHeight} />
    </div>
  );
}
