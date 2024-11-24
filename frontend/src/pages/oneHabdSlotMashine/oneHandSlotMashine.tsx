import React, { useContext, useEffect } from "react";
import { SlotMashine } from "../../components/slotMashine/slotMashine/SlotMashine";
import {
  SlotProvider,
  useSlotContext,
} from "../../components/slotMashine/slotMashine/SlotContext";
import style from "./style.module.css";
import { BetControls } from "../../components/betControl/BetControl";
import { Header } from "../../components/header/header";
import { ChangeMashine } from "../../components/changeMashine/ChangeMashine";
import {
  sendMessageToBot,
  getWinningCombination,
  getChatId,
} from "../../api/api";
import { PlayerContext } from "../../PlayerContext";
// import "../../../global"

export function OneHandSlotMashine() {
  const playerContext = useContext(PlayerContext);

  useEffect(() => {
    const fetchChatId = async () => {
      if (!playerContext) {
        console.error("нет контекста");
        return;
      }
  
      try {
        const tg = window.Telegram?.WebApp;
        if (tg?.initDataUnsafe?.user) {
          const userId = tg.initDataUnsafe.user.id;
          const chatId = await getChatId(userId); 
          playerContext.setChatId(chatId); 
        } else {
          console.error("Telegram WebApp недоступен или user отсутствует");
        }
      } catch (error) {
        console.error("Ошибка получения chatId:", error);
      }
    };
  
    fetchChatId();
  }, [playerContext]);
  

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
function setPlayer(arg0: (prev: any) => any) {
  throw new Error("Function not implemented.");
}
