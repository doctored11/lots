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
        console.log("rewardKey", rewardKey, REWARDS[rewardKey]?.values)
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

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
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



async function updateSlotState(userId, state) {
    const { reel, bet_step, last_win, max_win, machine_lives } = state;
    const reelAsJson = JSON.stringify(reel);

    console.log("Обновляем состояние автомата (SlotsController): ");
    console.log("reel:", reelAsJson);
    console.log("bet_step:", bet_step);

    await pool.query(
        'UPDATE slot_game SET reel = $1::jsonb, bet_step = $2, last_win = $3, max_win = $4, machine_lives = $5 WHERE user_id = $6',
        [reelAsJson, bet_step, last_win, max_win, machine_lives, userId]
    );
}

function generateNewReel() {
    const DRUM_CHANCES = {
        bomb: {
            priority: 2,
            maxCount: 1
        },
        clover: {
            priority: 3,
            maxCount: 2
        },
        grape: {
            priority: 10,
            maxCount: 3
        },
        mushroom: {
            priority: 6,
            maxCount: 4
        },
        melon: {
            priority: 6,
            maxCount: 2
        },
        cherry: {
            priority: 4,
            maxCount: 2
        },
        banana: {
            priority: 4,
            maxCount: 2
        },
        blueBerrie: {
            priority: 1,
            maxCount: 1
        },
    };

    const newReel = [];
    const weightedItems = [];

    Object.entries(DRUM_CHANCES).forEach(([item, { priority, maxCount }]) => {
        for (let i = 0; i < priority; i++) {
            weightedItems.push(item);
        }
    });

    weightedItems.sort(() => Math.random() - 0.5);

    const itemCount = {};
    Object.keys(DRUM_CHANCES).forEach(key => {
        itemCount[key] = 0;
    });

    const elCount = getRandomInt(5, 8);
    while (newReel.length < elCount) {
        const randomIndex = getRandomInt(0, weightedItems.length - 1);
        const selectedItem = weightedItems[randomIndex];

        if (itemCount[selectedItem] < DRUM_CHANCES[selectedItem].maxCount) {
            newReel.push(selectedItem);
            itemCount[selectedItem] = (itemCount[selectedItem] || 0) + 1;
        }
    }
    console.log("колесико обновлено, ", elCount, newReel);
    return newReel;

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
        const results = combination.map(index => reel[index]);
        console.log('выпавшие символы:', results);
        console.log("________операции с балансом_______")
        console.log("\n пришло: ", balance, bet)
        console.log("_____")
        const winnings = calculateWinnings(bet, results);
        const newBalance = balance - bet + winnings;
        await updateUserBalance(chatId, newBalance);

        console.log("баданс обновлен", balance, bet, winnings, newBalance)
        console.log("пытаемся обновить слоты")
        await updateSlotState(user.id, {
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

const changeMachine = async (req, res) => {
    const { chatId, bet, balance, machineCost } = req.body;

    try {
        const user = await getUserByChatId(chatId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }

        const slotGame = await getSlotGameByUserId(user.id);
        if (!slotGame) {
            return res.status(404).json({ success: false, error: 'Слот-машина не найдена' });
        }

        if (balance < machineCost) {
            return res.status(400).json({ success: false, error: 'Недостаточно средств для смены автомата' });
        }

        const newReel = generateNewReel();

        const newBalance = balance - machineCost;

        await updateUserBalance(chatId, newBalance);

        await updateSlotState(user.id, {
            ...slotGame,
            reel: newReel,
            machine_lives: 50,
        });

        res.status(200).json({
            success: true,
            data: {
                newReel,
                newBalance,
            },
        });
    } catch (error) {
        console.error('Ошибка в changeMachine:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};




module.exports = { spinSlot, createSlotGame, changeMachine };
