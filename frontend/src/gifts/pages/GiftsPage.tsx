import React, { useContext, useEffect, useState } from "react";
import { GiftButton } from "./components/GiftButton";
import { GiftCooldown } from "./components/GiftCooldown";
import { getGiftStatus } from "../../api/giftsApi";
import { PlayerContext } from "../../PlayerContext";

export function GiftsPage() {
  const [lastCollected, setLastCollected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const player = useContext(PlayerContext);
  const chatId = player?.chatId;

  useEffect(() => {
    if (!chatId) {
      setLoading(false);
      console.error("chatId отсутствует.");
      return;
    }

    const fetchGiftStatus = async () => {
      try {
        const response = await getGiftStatus(chatId);
        if (response.success) {
          setLastCollected(response.data.lastCollected);
        } else {
          console.error("Ошибка получения статуса подарка:", response.error);
        }
      } catch (error) {
        console.error("Ошибка при запросе статуса подарка:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGiftStatus();
  }, [chatId]);

  if (loading) {
    return <div>Загрузка...</div>;
  }

  if (!chatId) {
    return <div>Ошибка: chatId отсутствует.</div>;
  }

  return (
    <div>
      <h1>Гифт</h1>
      {lastCollected !== null ? (
        <>
          <GiftCooldown lastCollected={lastCollected} />
          <GiftButton chatId={chatId} />
        </>
      ) : (
        <p>Не удалось загрузить данные.</p>
      )}
    </div>
  );
}
