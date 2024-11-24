const BASE_URL = process.env.REACT_APP_TARGET_ADDRESS; // Должен быть определён в .env файле

if (!BASE_URL) {
  console.error("BASE_URL не определён. Проверьте переменные окружения.");
}

export const sendMessageToBot = async (chatId, message) => {
    console.log("⚠️"+BASE_URL)
  try {
    const response = await fetch(`${BASE_URL}/api/send-message`, {
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
    const response = await fetch(`${BASE_URL}/api/get-combination`, {
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
