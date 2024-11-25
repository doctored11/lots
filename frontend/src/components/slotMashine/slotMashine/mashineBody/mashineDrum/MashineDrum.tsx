import React, { useEffect, useRef, useState } from "react";
import { REWARDS } from "../../../../../constants/drumConstants";
import style from "./mashineDrum.module.css";
import { getRandomInt } from "../../../../../tools/tools";
import { rollSpin } from "./rollSpin";
import { Roll } from "./Roll";

interface MashineDrumProps {
  spinValues: number[];
  reel: Array<keyof typeof REWARDS>;
  onSpinEnd: () => void;
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
  const [currentItemHeight, setCurrentItemHeight] = useState(128);
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

 
  useEffect(() => {
    const updateItemSize = () => {
      if (slotDrumRef.current) {
        const slotDrumWidth = slotDrumRef.current.offsetWidth;

        const calculatedSizeByWidth = slotDrumWidth * 0.3;
        setItemHeight(calculatedSizeByWidth); 
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
    
    if(!isSpinning) setCurrentItemHeight(itemHeight);
  }, [itemHeight]);

 
  useEffect(() => {
    if (!isSpinning) return;

    
    setCurrentItemHeight(itemHeight);
   console.log("👨‍🦼‍➡️ drum ",spinValues)

    const rollPromises = spinValues.map((value, index) =>
      rollSpin(
        tapeRefs.current[index].current!,
        itemHeight, 
        getRandomInt(12, 35),
        getRandomInt(3, 8),
        value
      ).then(() => reel[value])
    );

    Promise.all(rollPromises).then(() => {
      onSpinEnd();

      const winningElements: HTMLElement[] = [];

      spinValues.forEach((targetIndex, reelIndex) => {
        const tape = tapeRefs.current[reelIndex].current;
        if (tape) {
          const winningElement = tape.children[targetIndex];
          if (winningElement instanceof HTMLElement) {
            winningElement.classList.add(style.winEl);
            winningElements.push(winningElement);
          }
        }
      });

      setTimeout(() => {
        winningElements.forEach((element) => {
          element.classList.remove(style.winEl);
        });
      }, 500);
    });
  }, [spinValues])
  return (
    <div className={style.slotDrum} ref={slotDrumRef}>
      {spinValues.map((_, index) => (
        <Roll
          key={index}
          tapeRef={tapeRefs.current[index]}
          addToRollRefs={addToRollRefs}
          reel={reel}
          itemHeight={currentItemHeight} 
        />
      ))}
    </div>
  );
}
