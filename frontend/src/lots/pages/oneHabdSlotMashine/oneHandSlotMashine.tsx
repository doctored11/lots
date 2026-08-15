import React, { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { SlotMashine } from "../../components/slotMashine/slotMashine/SlotMashine";
import { SlotProvider } from "../../components/slotMashine/slotMashine/SlotContext";
import style from "./style.module.css";
import { BetControls } from "../../components/betControl/BetControl";
import { Header } from "../../../globalComponents/header/header";

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
            <Link to="/workshop" className={style.workshopLink}>
              🔧 Мастерская (инвентарь и книга рецептов)
            </Link>
          </div>
        </div>{" "}
      </SlotProvider>
    </>
  );

  return page;
}
