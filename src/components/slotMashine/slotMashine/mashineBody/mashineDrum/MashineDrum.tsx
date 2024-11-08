import React, { useEffect, useRef, useState } from "react";
import { REWARDS } from "../../../../../constants/drumConstants";
import style from "./mashineDrum.module.css";
import { getRandomInt } from "../../../../../tools/tools";
import { rollSpin } from "./rollSpin";
import { Roll } from "./Roll";


interface MashineDrumProps {
  spinValues: number[];
  reel: Array<keyof typeof REWARDS>;
  onSpinEnd: (results: string[]) => void;
  isSpinning: boolean;
}
export function MashineDrum({
  spinValues,
  reel,
  onSpinEnd,
  isSpinning = false,
}: MashineDrumProps) {
  const tapeRefs = useRef<React.RefObject<HTMLDivElement>[]>([]);
  const [itemHeight, setItemHeight] = useState(128);

  if (tapeRefs.current.length !== spinValues.length) {
    tapeRefs.current = Array(spinValues.length)
      .fill(null)
      .map(() => React.createRef<HTMLDivElement>());
  }

  const rollRefs = useRef<HTMLDivElement[]>([]);

  const addToRollRefs = (el: HTMLDivElement | null) => {
    if (el && !rollRefs.current.includes(el)) {
      rollRefs.current.push(el);
    }
  };

  useEffect(() => {
    if (rollRefs.current.length > 0 && rollRefs.current[0]) {
      const width = Math.min( rollRefs.current[0].offsetWidth,itemHeight)
      console.log("0< ", width)
      setItemHeight(width);
    }
  }, []);
  

  useEffect(() => {
    rollRefs.current.forEach((roll) => {
      if (roll) {
        roll.style.height = `${itemHeight * 2.2}px`;
        roll.style.width = `${itemHeight * 1.1}px`;
      }
    });
   
  }, [itemHeight]);

  useEffect(() => {
    if (!isSpinning) return;
    
    const rollPromises = spinValues.map((value, index) =>
      rollSpin(
        tapeRefs.current[index].current!,
        itemHeight,
        getRandomInt(5, 50),
        getRandomInt(3, 12),
        value
      ).then(() => reel[value])
    );

    Promise.all(rollPromises).then((results) => {
      onSpinEnd(results);
    });
  }, [spinValues, reel, onSpinEnd, itemHeight, isSpinning]);

  return (
    <div className={style.slotDrum}>
      {spinValues.map((_, index) => (
        <Roll
          key={index}
          tapeRef={tapeRefs.current[index]}
          addToRollRefs={addToRollRefs}
          reel={reel}
          itemHeight={itemHeight}
        />
      ))}
    </div>
  );
}