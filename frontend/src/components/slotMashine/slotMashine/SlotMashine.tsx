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

  const tg = window.Telegram?.WebApp;
  if (tg?.initDataUnsafe?.user) {
    const chatId = tg.initDataUnsafe.user.id;
    console.log("Chat ID:", chatId);
  }

  // тест
  const handleSendMessage = async () => {
    if (!player?.chatId) {
      alert("Не найден Chat ID!");
      return;
    }

    try {
      const response = await sendMessageToBot(
        player.chatId,
        "Сообщение из слота!"
      );
      if (response.success) {
        alert("Сообщение успешно отправлено!");
      } else {
        alert(`Ошибка отправки: ${response.error}`);
      }
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error);
      alert("Ошибка при отправке сообщения в бот!");
    }
  };
  const handleGetCombination = async () => {
    if (!player?.chatId) {
      alert("Не найден Chat ID!");
      return;
    }

    try {
      const response = await getWinningCombination();
      if (response.success) {
        const combination = response.data.combination.join(", ");
        const message = `Выигрышная комбинация: ${combination}`;

        // Отправляем комбинацию в бот
        const botResponse = await sendMessageToBot(player.chatId, message);
        if (botResponse.success) {
          alert("Комбинация успешно отправлена в бот!");
        } else {
          alert(`Ошибка отправки: ${botResponse.error}`);
        }
      } else {
        alert(`Ошибка получения комбинации: ${response.error}`);
      }
    } catch (error) {
      console.error("Ошибка получения комбинации:", error);
      alert("Ошибка при получении комбинации!");
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
