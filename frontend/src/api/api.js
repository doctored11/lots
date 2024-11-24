const BASE_URL = process.env.REACT_APP_TARGET_ADDRESS


export const sendMessageToBot = async (chatId, message) => {
    try {
        const response = await fetch(`${BASE_URL}/send-message`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ chatId, message }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("Ошибка отправки сообщения:", error);
            return { success: false, error: error.message };
        }

        const result = await response.json();
        console.log("Сообщение отправлено:", result);
        return { success: true, data: result };
    } catch (e) {
        console.error("Ошибка в sendMessageToBot:", e);
        return { success: false, error: e.message };
    }
};

export const getWinningCombination = async () => {
    try {
        const response = await fetch(`${BASE_URL}/winning-combination`, {
            method: "GET",
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("ошибка комбинации ", error);
            return { success: false, error: error.message };
        }

        const result = await response.json();
        console.log("Полученая комбинация с ьекенда:", result);
        return { success: true, data: result };
    } catch (e) {
        console.error("ошибка получения комбинации с бекенда:", e);
        return { success: false, error: e.message };
    }
};
export async function getChatId(userId) {
    try {
        const response = await fetch(`/api/get-chat-id?userId=${userId}`);
        const data = await response.json();
        if (data.chatId) {
            return data.chatId;
        }
        throw new Error('Chat ID не найден');
    } catch (error) {
        console.error('Ошибка получения chatId:', error);
        return null;
    }
}
