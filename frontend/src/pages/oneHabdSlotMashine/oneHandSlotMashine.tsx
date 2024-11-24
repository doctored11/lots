import React from "react";
import { SlotMashine } from "../../components/slotMashine/slotMashine/SlotMashine";
import {
  SlotProvider,
  useSlotContext,
} from "../../components/slotMashine/slotMashine/SlotContext";
import style from "./style.module.css";
import { BetControls } from "../../components/betControl/BetControl";
import { Header } from "../../components/header/header";
import { ChangeMashine } from "../../components/changeMashine/ChangeMashine";

export function OneHandSlotMashine() {
  const page = (
    <>
      <Header></Header>
      <div>
        <p>TextPages-_-</p>
        <SlotProvider>
          <div className={style.frame}>
            <SlotMashine />
            <BetControls />
            <ChangeMashine></ChangeMashine>
          </div>
        </SlotProvider>
      </div>
    </>
  );

  return page;
}
