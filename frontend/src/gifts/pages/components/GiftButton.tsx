import React, { useState } from "react";
import { collectGift } from "../../../api/giftsApi";

interface Props {
  chatId: string;
}

export const GiftButton: React.FC<Props> = ({ chatId }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    const response = await collectGift(chatId); 
    setLoading(false);

    if (response.success) {
      alert(`Вы получили ${response.data.giftAmount} монет!`);
    } else {
      alert(response.error || "Ошибка получения подарка");
    }
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading ? "Загрузка..." : "Получить подарок"}
    </button>
  );
};
