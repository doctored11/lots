import React from "react";
import { SlotMashine } from "../../components/slotMashine/slotMashine/SlotMashine";
import {
  SlotProvider,
  useSlotContext,
} from "../../components/slotMashine/slotMashine/SlotContext";
import style from "./style.module.css";
import { BetControls } from "../../components/betControl/BetControl";
import { Header } from "../../components/header/header";

export function OneHandSlotMashine() {
  const page = (
    <>
      <Header></Header>
      <div>
        <SlotProvider>
          <div className={style.frame}>
            <SlotMashine />

            <BetControls />
          </div>
        </SlotProvider>
      </div>
    </>
  );

  return page;
}
