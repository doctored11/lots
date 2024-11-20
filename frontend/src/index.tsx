import React, { createContext, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { OneHandSlotMashine } from "./pages/oneHabdSlotMashine/oneHandSlotMashine";
import { PlayerProvider } from "./PlayerContext";
import "./index.css";
import "./normalize.css";
import { useTelegram } from "./hooks/useTelegram";
import { json } from "react-router-dom";
const targetAddress = process.env.REACT_APP_TARGET_ADDRESS;

function App() {
  //todo - вынести игрока и работу с балансом
  const { tg,queryId ,user, chatId, onClose, onToggleButton } = useTelegram();
  const onSendData = useCallback(() => {
    const data = {
        "0": "09",
        queryId,
    };

    console.log('Отправка данных на сервер:', data); 

    fetch(targetAddress + '/web-data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then((response) => response.json())
        .then((result) => {
            console.log('⚠️ Ответ от сервера:', result); 
        })
        .catch((error) => {
            console.error('🛑 Ошибка отправки данных:', error); 
        });
}, [queryId]);


  useEffect(() => {
    tg.onEvent('mainButtonClicked',onSendData)
    return()=>{
      tg.offEvent('mainButtonClicked',onSendData)
    }
  }, []);

  
  useEffect(() => {
    tg.ready();
  }, []);

  const sendMessageToBot = async () => {
    console.log("testClick")
    console.log(tg);
    console.log(targetAddress);
    console.log(`${targetAddress}/api/send-message`);
    try {
      const response = await fetch(`${targetAddress}/api/send-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: chatId,
          message: "Это сообщение отправлено с кнопки toggle!",
        }),
      });

      const result = await response.json();
      console.log("Message sent:", result);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <>
    <div className="">TesT-_-</div>
      <button onClick={onClose}>ЗАкрыть</button>
      <span>{user?.username}</span>
      <PlayerProvider>
        <OneHandSlotMashine />
      </PlayerProvider>
      <button onClick={onToggleButton}>toggle</button>
      <button onClick={sendMessageToBot}>senMEssageToBot</button>
    </>
  );
}

const rootEl = document.getElementById("root");
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<App />);
}
