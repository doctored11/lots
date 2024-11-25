const pool = require('../db');
const { getUserByChatId, updateUserBalance } = require('../controllers/userController');
const { sendMessage } = require('../services/botService');

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}


async function getSlotGameByUserId(userId) {
    const result = await pool.query('SELECT * FROM slot_game WHERE user_id = $1', [userId]);
    return result.rows[0];
}

async function createSlotGame(userId) {
    const initialReel = JSON.stringify([
        "bomb", "clover", "grape", "mushroom", "grape", "melon", "banana", "blueBerrie", "cherry"
    ]);

    const result = await pool.query(
        `INSERT INTO slot_game (user_id, reel, bet_step, last_win, max_win, machine_lives) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [userId, initialReel, 10, 0, 0, 50]
    );

    return result.rows[0];
}


async function updateSlotGame(userId, { reel, bet_step, last_win, max_win, machine_lives }) {
    await pool.query(
        'UPDATE slot_game SET reel = $1, bet_step = $2, last_win = $3, max_win = $4, machine_lives = $5 WHERE user_id = $6',
        [reel, bet_step, last_win, max_win, machine_lives, userId]
    );
}


const spinSlot = async (req, res) => {
    const { chatId, bet, balance } = req.body;

    try {
        const user = await getUserByChatId(chatId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }

        const slotGame = await getSlotGameByUserId(user.id);
        if (!slotGame) {
            return res.status(404).json({ success: false, error: 'Слот-машина не найдена' });
        }
        console.log('slotGame:', slotGame);
        console.log('reel field:', slotGame.reel);

       

        const reel = typeof slotGame.reel == 'string' ? JSON.parse(slotGame.reel) : slotGame.reel;

        console.log('Reel:', reel);

        const combination = [
            Math.floor(Math.random() * reel.length),
            Math.floor(Math.random() * reel.length),
            Math.floor(Math.random() * reel.length),
        ];

        const newBalance = balance - bet;

        await updateUserBalance(chatId, newBalance);
        await updateSlotGame(user.id, {
            ...slotGame,
            last_win: 0, // TODO: логика выигрыша
            machine_lives: slotGame.machine_lives - 1,
        });

        res.status(200).json({
            success: true,
            data: { combination, newBalance },
        });
    } catch (error) {
        console.error('Ошибка в spinSlot:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};


module.exports = { spinSlot, createSlotGame };
