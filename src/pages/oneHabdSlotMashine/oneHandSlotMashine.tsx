import React from "react";
import { SlotMashine } from "../../components/slotMashine/slotMashine/SlotMashine";
import { SlotProvider } from "../../components/slotMashine/slotMashine/SlotContext";
import style from "./style.module.css";
export function OneHandSlotMashine() {
  const page = (
    <div>
      <SlotProvider>
        <div className={style.frame}>
          <SlotMashine></SlotMashine>
        </div>
      </SlotProvider>
    </div>
  );
  return page;
}
