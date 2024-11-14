import React, { useContext } from "react";
import { SlotContext } from "../slotMashine/slotMashine/SlotContext";
import { getRandomColor } from "../../tools/tools";

export function ChangeMashine() {
  const slot = useContext(SlotContext);

  if (!slot) return;
  const handleChangeMashine = () => {
    if (slot.betInGame > 0) return;

    setTimeout(() => {
      slot.setBetStep(10); 
      slot.setLastWin(0); 
      slot.setMaxWin(0); 
      slot.setColor(getRandomColor());
      slot.reelUpdate()
    }, 2000);
  };

  return <button onClick={handleChangeMashine}>Change Slot Machine</button>;
}
