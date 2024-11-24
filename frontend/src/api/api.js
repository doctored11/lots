const BASE_URL = process.env.REACT_APP_TARGET_ADDRESS

export const sendMessageToBot = async (chatId, message) => {
    try {
      const response = await fetch("http://localhost:8000/api/send-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId, message }),
      });
  
      if (!response.ok) {
        throw new Error(`Ошибка: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Ошибка при отправке сообщения:", error);
      return { success: false, error: error.message };
    }
  };
  
  export const getWinningCombination = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/get-combination", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
  
      if (!response.ok) {
        throw new Error(`Ошибка: ${response.statusText}`);
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Ошибка получения комбинации:", error);
      return { success: false, error: error.message };
    }
  };
  