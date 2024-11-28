const pool = require('../../db');
const { getUserByChatId } = require('../userController');

async function getGiftInfo(req, res) {
    const { chatId } = req.params;
    console.log(`Получение информации о подарке для chatId: ${chatId}`);

    try {
        const user = await getUserByChatId(chatId);
        if (!user) {
            console.error(`Пользователь с chatId ${chatId} не найден.`);
            return res.status(404).json({ success: false, error: "Пользователь не найден." });
        }

        console.log(`Пользователь найден: ${JSON.stringify(user)}`);
        //!!тут ломается
        const result = await pool.query(
            'SELECT last_collected FROM gifts WHERE user_id = $1',
            [user.id]
        );
        console.log(result)
        if (result.rows.length === 0) {
            console.log(`Записи о подарке для пользователя ${user.id} не найдено. Создаем новую.`);

            const distantPast = new Date(2011, 10, 11, 11, 11, 11);
            const newGift = await pool.query(
                'INSERT INTO gifts (user_id, last_collected) VALUES ($1, $2) RETURNING last_collected',
                [user.id, distantPast]
            );

            console.log(`Успешно создана запись для пользователя ${user.id}.`);
            return res.status(200).json({
                success: true,
                data: { lastCollected: newGift.rows[0].last_collected },
            });
        }

        const lastCollected = result.rows[0].last_collected;
        console.log(`Последний раз подарок был собран: ${lastCollected}`);
        return res.status(200).json({
            success: true,
            data: { lastCollected },
        });
    } catch (error) {
        console.error('Ошибка получения информации о подарке:', error);
        res.status(500).json({ success: false, error: "Внутренняя ошибка сервера." });
    }
}

async function collectGift(req, res) {
    const { chatId } = req.body;
    console.log(`Сбор подарка для chatId: ${chatId}`);

    try {
        const user = await getUserByChatId(chatId);
        if (!user) {
            console.error(`Пользователь с chatId ${chatId} не найден.`);
            return res.status(404).json({ success: false, error: "Пользователь не найден." });
        }

        console.log(`Пользователь найден: ${JSON.stringify(user)}`);
        let result
        try {
            console.log(`Попытка выполнения SELECT запроса в таблице gifts для user_id: ${user.id}`);
             result = await pool.query(
                'SELECT last_collected FROM gifts WHERE user_id = $1',
                [user.id]
            );
            console.log(`Результат SELECT запроса: ${JSON.stringify(result.rows)}`);
        } catch (err) {
            console.error('Ошибка выполнения SELECT-запроса к таблице gifts:', err);
            throw err; // Проброс ошибки, чтобы основной catch обработал
        }
        
        console.log(result)
        if (result.rows.length === 0) {
            console.log(`Записи о подарке для пользователя ${user.id} не найдено. Создаем новую.`);

            const distantPast = new Date(2011, 10, 11, 11, 11, 11);
            await pool.query(
                'INSERT INTO gifts (user_id, last_collected) VALUES ($1, $2)',
                [user.id, distantPast]
            );


            result = await pool.query(
                'SELECT last_collected FROM gifts WHERE user_id = $1',
                [user.id]
            );
        }

        const lastCollected = new Date(result.rows[0].last_collected);
        const now = new Date();
        const cooldown = 30 * 60 * 1000;
        const timeDiff = now - lastCollected;

        console.log(`Время с последнего сбора: ${timeDiff} ms`);
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

        await pool.query(
            'UPDATE gifts SET last_collected = NOW() WHERE user_id = $1',
            [user.id]
        );

        console.log(`Подарок собран. Новый баланс: ${updatedBalance}`);
        res.status(200).json({
            success: true,
            data: { giftAmount, newBalance: updatedBalance },
        });
    } catch (error) {
        console.error('Ошибка при сборе подарка:', error);
        res.status(500).json({ success: false, error: "Внутренняя ошибка сервера." });
    }
}




module.exports = { getGiftInfo, collectGift };
