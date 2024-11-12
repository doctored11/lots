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
  const slotDrumRef = useRef<HTMLDivElement>(null);

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

  // useEffect(() => {
  //   if (rollRefs.current.length > 0 && rollRefs.current[0]) {
  //     const width = Math.min( rollRefs.current[0].offsetWidth,itemHeight)
  //     console.log("0< ", width)
  //     setItemHeight(width);
  //   }
  // }, []);

  useEffect(() => {
    const updateItemSize = () => {
      if (slotDrumRef.current) {
        const slotDrumWidth = slotDrumRef.current.offsetWidth;
        const slotDrumHeight = slotDrumRef.current.offsetHeight;
       
        const calculatedSizeByWith = slotDrumWidth * 0.3;
        let calculatedSizeByHeight = slotDrumHeight * 0.5;
        console.log("!_ ",calculatedSizeByHeight,slotDrumHeight, slotDrumWidth);
        // if (calculatedSizeByHeight * 3 > slotDrumWidth) {
        //   console.log("0_0", calculatedSizeByHeight * 3, slotDrumWidth);
        //   calculatedSizeByHeight = calculatedSizeByWith;
        // }

       
        setItemHeight(calculatedSizeByWith);
      }
    };

    updateItemSize();
    window.addEventListener("resize", updateItemSize);

    return () => window.removeEventListener("resize", updateItemSize);
  }, []);

  useEffect(() => {
    rollRefs.current.forEach((roll) => {
      if (roll) {
        roll.style.height = `${itemHeight * 2.2}px`;
        roll.style.width = `${itemHeight * 1.2}px`;
      }
    });
    console.log(itemHeight);
  }, [itemHeight]);

  useEffect(() => {
    if (!isSpinning) return;

    const rollPromises = spinValues.map((value, index) =>
      rollSpin(
        tapeRefs.current[index].current!,
        itemHeight,
        getRandomInt(12, 35),
        getRandomInt(3, 8),
        value
      ).then(() => reel[value])
    );

    Promise.all(rollPromises).then((results) => {
      onSpinEnd(results);
    });
  }, [spinValues, reel, onSpinEnd, itemHeight, isSpinning]);

  return (
    <div className={style.slotDrum} ref={slotDrumRef}>
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
