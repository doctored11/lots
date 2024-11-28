export const getGiftStatus = async (chatId) => {
    try {
      const response = await fetch(`/api/gifts/status/${chatId}`);
      if (!response.ok) {
        throw new Error(`Ошибка: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Ошибка получения статуса подарка:", error);
      return { success: false, error: error.message };
    }
  };
  
  export const collectGift = async (chatId) => {
    try {
      const response = await fetch("/api/gifts/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
      });
      if (!response.ok) {
        throw new Error(`Ошибка: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Ошибка сбора подарка:", error);
      return { success: false, error: error.message };
    }
  };
  