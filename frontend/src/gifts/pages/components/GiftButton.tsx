import React, { useState } from "react";
import { collectGift } from "../../../api/giftsApi";

interface GiftButtonProps {
  chatId: string;
  onGiftCollected: (newLastCollected: string, giftAmount: number) => void;
}

export function GiftButton({ chatId, onGiftCollected }: GiftButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const response = await collectGift(chatId);
      if (response.success) {
        onGiftCollected(new Date().toISOString(), response.data.giftAmount);
      } else {
        alert(response.error || "Ошибка получения подарка");
      }
    } catch (error) {
      console.error("Ошибка при получении подарка:", error);
      alert("Ошибка при получении подарка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? "Загрузка..." : "Получить подарок"}
    </button>
  );
}
