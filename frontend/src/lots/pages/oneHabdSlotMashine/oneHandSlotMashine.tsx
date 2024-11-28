import React, { useContext, useEffect } from "react";
import { SlotMashine } from "../../components/slotMashine/slotMashine/SlotMashine";
import { SlotProvider } from "../../components/slotMashine/slotMashine/SlotContext";
import style from "./style.module.css";
import { BetControls } from "../../components/betControl/BetControl";
import { Header } from "../../../globalComponents/header/header";
import { ChangeMashine } from "../../components/changeMashine/ChangeMashine";

import { PlayerContext } from "../../../PlayerContext";
// import "../../../global"

export function OneHandSlotMashine() {
  const playerContext = useContext(PlayerContext);

  const page = (
    <>
      <Header></Header>{" "}
      <SlotProvider>
        <div>
          <p>TextPages-_-</p>

          <div className={style.frame}>
            <SlotMashine />
            <BetControls />
            <ChangeMashine></ChangeMashine>
          </div>
        </div>{" "}
      </SlotProvider>
    </>
  );

  return page;
}
