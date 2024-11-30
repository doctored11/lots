import React, { createContext, useContext, useEffect, useState } from "react";
import { MashineBody } from "./mashineBody/MashineBody";
import { PlayerContext } from "../../../../PlayerContext";
import { REWARDS } from "lots/constants/drumConstants";
import { SlotContext, SlotProvider } from "./SlotContext";
import style from "./style.module.css";

interface SlotContextType {
  betStep: number;
  betInGame: number;
  combination: Array<number | null>;
  mode: string;
  reel: Array<keyof typeof REWARDS>;
  rollCount: number;
  setCombination: (combination: Array<number | null>) => void;
}

export function SlotMashine() {
  const player = useContext(PlayerContext);
  const mashine = useContext(SlotContext);

  const tg = window.Telegram?.WebApp;
  if (tg?.initDataUnsafe?.user) {
    const chatId = tg.initDataUnsafe.user.id;
    console.log("Chat ID:", chatId);
  }

  //

  useEffect(() => {
    const initializeChatId = () => {
      const tg = window.Telegram?.WebApp;
      if (tg?.initDataUnsafe?.user) {
        const chatId = tg.initDataUnsafe.user.id;
        console.log("Chat ID:", chatId);

        if (player) {
          player.setChatId(chatId + "");
        } else {
          console.error("PlayerContext не найден!");
        }
      } else {
        console.error("Telegram WebApp не предоставляет данные!");
      }
    };

    initializeChatId();
  }, [player]);

  useEffect(() => mashine?.reelUpdate(), []);
  return (
    <>
      {/* <p>Баланс: {player?.balance}</p> */}
      <div>SlotMashine</div>
      <div className={style.frame}>
        <MashineBody />
        <div id="shadow"></div>
      </div>
      <div id="explosion" style={{ display: "none" }}></div>
    </>
  );
}
