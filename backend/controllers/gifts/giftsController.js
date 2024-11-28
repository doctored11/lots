const pool = require('../../db');
const { getUserByChatId, updateUserBalance } = require('../userController');

async function getGiftInfo(req, res) {
    const { chatId } = req.params;

    try {
        const user = await getUserByChatId(chatId);
        if (!user) {
            return res.status(404).json({ success: false, error: "Пользователь не найден." });
        }

        const result = await pool.query(
            'SELECT last_collected FROM gifts WHERE user_id = $1',
            [user.id]
        );

        if (result.rows.length === 0) {
            const newGift = await pool.query(
                'INSERT INTO gifts (user_id) VALUES ($1) RETURNING last_collected',
                [user.id]
            );
            return res.status(200).json({
                success: true,
                data: { lastCollected: newGift.rows[0].last_collected },
            });
        }

        const lastCollected = result.rows[0].last_collected;
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

    try {
        const user = await getUserByChatId(chatId);
        if (!user) {
            return res.status(404).json({ success: false, error: "Пользователь не найден." });
        }

        const result = await pool.query(
            'SELECT last_collected FROM gifts WHERE user_id = $1',
            [user.id]
        );

        const now = new Date();
        const cooldown = 30 * 60 * 1000; 

        let lastCollected;
        if (result.rows.length === 0) {
            await pool.query('INSERT INTO gifts (user_id, last_collected) VALUES ($1, NOW())', [user.id]);
            lastCollected = new Date(0); 
        } else {
            lastCollected = new Date(result.rows[0].last_collected);
        }

        const timeDiff = now - lastCollected;
        if (timeDiff < cooldown) {
            const timeLeft = cooldown - timeDiff;
            return res.status(400).json({
                success: false,
                error: "Подарок пока недоступен.",
                data: { timeLeft },
            });
        }

        
        const giftAmount = Math.floor(Math.random() * (150 - 5 + 1)) + 5; //todo вынести в переменные

        const updatedBalance = await updateUserBalance(chatId, user.balance + giftAmount);

        await pool.query(
            'UPDATE gifts SET last_collected = NOW() WHERE user_id = $1',
            [user.id]
        );

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
