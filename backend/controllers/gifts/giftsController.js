const pool = require('../../db');
const { getUserByChatId, updateUserBalance } = require('../userController');

// Вспомогательная функция для проверки и инициализации записи в таблице gifts
async function ensureGiftRecordExists(userId) {
    console.log(`Проверка наличия записи для user_id: ${userId}`);
    const result = await pool.query(
        'SELECT last_collected FROM gifts WHERE user_id = $1',
        [userId]
    );

    if (result.rows.length === 0) {
        console.log(`Запись для user_id ${userId} отсутствует. Создаем новую.`);
        const distantPast = new Date(2011, 10, 11, 11, 11, 11); // Дата для первого подарка
        const newGift = await pool.query(
            'INSERT INTO gifts (user_id, last_collected) VALUES ($1, $2) RETURNING last_collected',
            [userId, distantPast]
        );
        console.log(`Запись создана: ${JSON.stringify(newGift.rows[0])}`);
        return newGift.rows[0].last_collected;
    }

    console.log(`Запись найдена: ${JSON.stringify(result.rows[0])}`);
    return result.rows[0].last_collected;
}
// 

function calculateTimeDiff(lastCollected) {
    const now = new Date();
    const cooldown = 1 * 60 * 1000; 
    const timeDiff = now - new Date(lastCollected);
    return { timeDiff, cooldown };
}

async function getGiftInfo(req, res) {
    const { chatId } = req.params;
    console.log(`Получение информации о подарке для chatId: ${chatId}`);

    try {
        const user = await getUserByChatId(chatId);
        if (!user) {
            console.log(`Пользователь с chatId ${chatId} не найден.`);
            return res.status(404).json({ success: false, error: "Пользователь не найден." });
        }

        console.log(`Пользователь найден: ${JSON.stringify(user)}`);
        const lastCollected = await ensureGiftRecordExists(user.id);
        console.log(`Последний раз подарок был собран: ${lastCollected}`);

        res.status(200).json({ success: true, data: { lastCollected } });
    } catch (error) {
        console.log('Ошибка получения информации о подарке:', error);
        res.status(500).json({ success: false, error: "Внутренняя ошибка сервера." });
    }
}

async function collectGift(req, res) {
    const { chatId } = req.body;
    console.log(`Сбор подарка для chatId: ${chatId}`);

    try {
        const user = await getUserByChatId(chatId);
        if (!user) {
            console.log(`Пользователь с chatId ${chatId} не найден.`);
            return res.status(404).json({ success: false, error: "Пользователь не найден." });
        }

        console.log(`Пользователь найден: ${JSON.stringify(user)}`);
        const lastCollected = await ensureGiftRecordExists(user.id);

        const { timeDiff, cooldown } = calculateTimeDiff(lastCollected);
        if (timeDiff < cooldown) {
            const timeLeft = cooldown - timeDiff;
            console.log(`Подарок недоступен. Осталось времени: ${timeLeft} ms`);
            return res.status(400).json({
                success: false,
                error: "Подарок пока недоступен.",
                data: { timeLeft },
            });
        }

        const giftAmount = Math.floor(Math.random() * (150 - 5 + 1)) + 5; 
        console.log(`Начисление подарка на сумму: ${giftAmount}`);

        const updatedBalance = await updateUserBalance(chatId, user.balance + giftAmount);
        await pool.query('UPDATE gifts SET last_collected = NOW() WHERE user_id = $1', [user.id]);

        console.log(`Подарок собран. Новый баланс: ${updatedBalance}`);
        res.status(200).json({ success: true, data: { giftAmount, newBalance: updatedBalance } });
    } catch (error) {
        console.log('Ошибка при сборе подарка:', error);
        res.status(500).json({ success: false, error: "Внутренняя ошибка сервера." });
    }
}

module.exports = { getGiftInfo, collectGift };
