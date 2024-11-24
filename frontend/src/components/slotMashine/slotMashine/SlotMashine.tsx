import React, { createContext, useContext, useEffect, useState } from "react";
import { MashineBody } from "./mashineBody/MashineBody";
import { PlayerContext } from "../../../PlayerContext";
import { REWARDS } from "constants/drumConstants";
import { SlotContext, SlotProvider } from "./SlotContext";
import style from "./style.module.css";
import { sendMessageToBot, getWinningCombination } from "../../../api/api";

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

  // тест
  const handleSendMessage = async () => {
    if (!player?.id) {
      alert("Не найден ID игрока!");
      return;
    }

    const response = await sendMessageToBot(
      player.id,
      "Запрос отправлен в бота!"
    );
    if (response.success) {
      alert("Сообщение успешно отправлено!");
    } else {
      alert(`Ошибка: ${response.error}`);
    }
  };

  const handleGetCombination = async () => {
    const response = await getWinningCombination();
    if (response.success) {
      alert(`Выигрышная комбинация: ${response.data.combination.join(", ")}`);
    } else {
      alert(`Ошибка: ${response.error}`);
    }
  };
  //
  useEffect(() => mashine?.reelUpdate(), []);
  return (
    <>
      {/* <p>Баланс: {player?.balance}</p> */}
      <div>SlotMashine</div>
      <div className={style.frame}>
        <MashineBody />
        <div id="shadow"></div>
      </div>
      <button onClick={handleSendMessage} className={style.button}>
        Отправить сообщение в бот
      </button>
      <button onClick={handleGetCombination} className={style.button}>
        Получить выигрышную комбинацию
      </button>
    </>
  );
}
