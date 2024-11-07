import React from "react";
import { SlotMashine } from "../../components/slotMashine/slotMashine/SlotMashine";
import { SlotProvider } from "../../components/slotMashine/slotMashine/SlotContext";

export function OneHandSlotMashine() {
  const page = (
    <div>
      <SlotProvider>
        <SlotMashine></SlotMashine>
      </SlotProvider>
    </div>
  );
  return page;
}
