import React, { useContext, useEffect, useState } from "react";
import { GiftButton } from "./components/GiftButton";
import { GiftCooldown } from "./components/GiftCooldown";
import { getGiftStatus } from "../../api/giftsApi";
import { PlayerContext } from "PlayerContext";

interface Props {
  chatId: string;
}

export function GiftsPage() {
  const [lastCollected, setLastCollected] = useState<string>("");
  const player = useContext(PlayerContext);
   const chatId = player?.chatId
   if(!chatId) return
  
  useEffect(() => {
    const fetchGiftStatus = async () => {
      const response = await getGiftStatus(chatId); 
      if (response.success) {
        setLastCollected(response.data.lastCollected);
      } else {
        console.error("Ошибка получения статуса подарка:", response.error);
      }
    };

    fetchGiftStatus();
  }, [chatId]);

  return (
    <div>
      <h1>Гифт</h1>
      <GiftCooldown lastCollected={lastCollected} />
      <GiftButton chatId={chatId} />
    </div>
  );
};
