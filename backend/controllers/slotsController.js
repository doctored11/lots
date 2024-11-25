const pool = require('../db');
const { getUserByChatId, updateUserBalance } = require('../controllers/userController');
const { sendMessage } = require('../services/botService');


//todo вынести
const REWARDS = {
    bomb: { values: { 1: { type: 'plus', amount: 3 }, 2: { type: 'plus', amount: 6 }, 3: { type: 'multiply', factor: 2 } } },
    clover: { values: { 1: { type: 'multiply', factor: 1.5 }, 2: { type: 'multiply', factor: 2 }, 3: { type: 'multiply', factor: 3 } } },
    grape: { values: { 1: { type: 'plus', amount: 1 }, 2: { type: 'plus', amount: 2 }, 3: { type: 'multiply', factor: 10 } } },
    mushroom: { values: { 1: { type: 'plus', amount: 2 }, 2: { type: 'plus', amount: 4 }, 3: { type: 'multiply', factor: 1.2 } } },
    melon: {
        values: {
            1: { type: "plus", amount: 0.0 },
            2: { type: "plus", amount: 0.2 },
            3: { type: "plus", amount: 7.7 }
        }
    },
    cherry: {
        values: {
            1: { type: "plus", amount: 0.4 },
            2: { type: "plus", amount: 0.8 },
            3: { type: "plus", amount: 2.2 }
        }
    },
    banana: {
        values: {
            1: { type: "plus", amount: 0.0 },
            2: { type: "plus", amount: 0.5 },
            3: { type: "plus", amount: 10 }
        }
    },
    blueBerrie: {
        values: {
            1: { type: "plus", amount: 0.1 },
            2: { type: "plus", amount: 0.5 },
            3: { type: "plus", amount: 16.6 }
        }
    },
};

function calculateWinnings(bet, results) {
    let totalPlus = 0;
    let totalMultiply = 1;

    const counts = results.reduce((acc, symbol) => {
        acc[symbol] = (acc[symbol] || 0) + 1;
        return acc;
    }, {});

    Object.entries(counts).forEach(([symbol, count]) => {
        const rewardKey = symbol;
        const rewardValues = REWARDS[rewardKey]?.values;
        const reward = rewardValues?.[count];

        if (!reward) return;

        if (reward.type === 'plus') {
            totalPlus += reward.amount;
        } else if (reward.type === 'multiply') {
            totalMultiply *= reward.factor;
        }
    });

    return Math.ceil(bet * (totalPlus || 1) * totalMultiply);
}

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
    const reelAsJson = JSON.stringify(reel);

    console.log("Обновляем Слоты (SlotsController): ");
    console.log("reel:", reelAsJson);
    console.log("bet_step:", bet_step);


    await pool.query(
        'UPDATE slot_game SET reel = $1::jsonb, bet_step = $2, last_win = $3, max_win = $4, machine_lives = $5 WHERE user_id = $6',
        [reelAsJson, bet_step, last_win, max_win, machine_lives, userId]
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



        const reel = slotGame.reel;


        console.log('Reel:', reel);

        const combination = [
            Math.floor(Math.random() * reel.length),
            Math.floor(Math.random() * reel.length),
            Math.floor(Math.random() * reel.length),
        ];

        const winnings = calculateWinnings(bet, combination);
        const newBalance = balance - bet + winnings;
        await updateUserBalance(chatId, newBalance);

        console.log("баданс обновлен",balance,bet,winnings,newBalance)
        console.log("пытаемся обновить слоты")
        await updateSlotGame(user.id, {
            ...slotGame,
            last_win: winnings,
            max_win: Math.max(slotGame.max_win, winnings),
            machine_lives: slotGame.machine_lives - 1,
        });
        console.log("обновили слоты")
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
