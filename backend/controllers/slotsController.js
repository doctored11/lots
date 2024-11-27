const pool = require('../db');
const { getUserByChatId, updateUserBalance, getUserBalance } = require('../controllers/userController');
const { sendMessage } = require('../services/botService');
// todo - разделить все тут
// global todo - синхронизировать первую стартовую игровую машину

//todo вынести
const REWARDS = {
    bomb: { values: { 1: { type: 'plus', amount: 0.3 }, 2: { type: 'plus', amount: 0.8 }, 3: { type: 'multiply', factor: 8.8 } } },
    clover: { values: { 1: { type: 'multiply', factor: 3 }, 2: { type: 'multiply', factor: 7 }, 3: { type: "plus", amount: 72 } } },
    grape: { values: { 1: { type: 'plus', amount: 0.1 }, 2: { type: 'plus', amount: 0.2 }, 3: { type: 'plus', amount: 5.5 } } },
    mushroom: { values: { 1: { type: 'plus', amount: 0.1 }, 2: { type: 'plus', amount: 0.4 }, 3: { type: "plus", amount: 4 } } },
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
    const existingSlot = await getSlotGameByUserId(userId);
    if (existingSlot) {
        console.log('Слот уже существует для пользователя:', userId);
        return existingSlot;
    }

    const initialReel = JSON.stringify([
        "bomb", "grape","clover", "bomb", "grape", "grape", 
    ]);

    const randomColor = generateRandomColor();
    const randomBetStep = generateRandomBetStep();
    const lives = 10;

    const result = await pool.query(
        `INSERT INTO slot_game (user_id, reel, bet_step, last_win, max_win, machine_lives, color) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [userId, initialReel, randomBetStep, 0, 0, lives, randomColor]
    );

    return result.rows[0];
}



async function updateSlotState(userId, state) {
    const { reel, bet_step, last_win, max_win, machine_lives, color } = state; 
    const reelAsJson = JSON.stringify(reel);

    console.log("Обновляем состояние автомата:");
    await pool.query(
        `UPDATE slot_game
         SET reel = $1, bet_step = $2, last_win = $3, max_win = $4, machine_lives = $5, color = $6
         WHERE user_id = $7`,
        [reelAsJson, bet_step, last_win, max_win, machine_lives, color, userId]
    );
}



async function getSlotInfo(req, res) {
    const { chatId } = req.params;

    try {
        const user = await getUserByChatId(chatId);
        if (!user) {
            return res.status(404).json({ success: false, error: "Пользователь не найден" });
        }

        const slotQuery = `
        SELECT * FROM slot_game WHERE user_id = $1
      `;
        const result = await pool.query(slotQuery, [user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: "Слот-машина не найдена" });
        }

        const slot = result.rows[0];
        res.status(200).json({
            success: true,
            data: {
                reel: JSON.parse(slot.reel),
                betStep: slot.bet_step,
                lastWin: slot.last_win,
                maxWin: slot.max_win,
                color: slot.color || generateRandomColor(),
                machineLives: slot.machine_lives,
            },
        });
    } catch (error) {
        console.error("Ошибка получения информации о слоте:", error);
        res.status(500).json({ success: false, error: "Внутренняя ошибка сервера" });
    }
};

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
        const currentBalance = await validateBalance(chatId, balance);


        if (typeof bet !== 'number' || bet <= 0 || bet > currentBalance || currentBalance - bet < 0) {
            console.warn(
                `⚠️ Некорректная ставка: \n- Ставка: ${bet}\n- Баланс: ${currentBalance}`
            );
            return res.status(400).json({ success: false, error: 'Некорректная ставка 🤨' });
        }

        const slotGame = await getSlotGameByUserId(user.id);
        if (!slotGame) {
            slotGame = await createSlotGame(user.id);
        }
        console.log('*__ .')
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
        console.log("\n пришло: ", balance, bet, "|", currentBalance)
        console.log("_____")
        const winnings = calculateWinnings(bet, results);
        const newBalance = currentBalance - bet + winnings;
        await updateUserBalance(chatId, newBalance);

        console.log("баданс обновлен", currentBalance, bet, winnings, newBalance)
        console.log("пытаемся обновить слоты")
        await updateSlotState(user.id, {
            ...slotGame,
            last_win: winnings,
            max_win: Math.max(slotGame.max_win, winnings),
            machine_lives: slotGame.machine_lives - 1,
            color: slotGame.color,
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
    const { chatId, balance, machineCost } = req.body;
    console.log('    -  запрос на смену автомата:', req.body);

    if (!chatId || typeof balance === 'undefined' || typeof machineCost !== 'number' || machineCost <= 0) {
        return res.status(400).json({ success: false, error: 'Чего то не хватает' });
    }

    try {
        const user = await getUserByChatId(chatId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
        const currentBalance = await validateBalance(chatId, balance);

        let slotGame = await getSlotGameByUserId(user.id);
        if (!slotGame) {

            slotGame = await createSlotGame(user.id);
        }

        if (currentBalance - machineCost < 0 ) {
            console.log("недостаточно на смену автомата")
            return res.status(400).json({ success: false, error: 'Недостаточно средств для смены автомата' });
        }

        const newReel = generateNewReel();
        const newColor = generateRandomColor();
        const newBetStep = generateRandomBetStep();
        const newLives = generateRandomLives();

        const newBalance = currentBalance - machineCost;

        await updateUserBalance(chatId, newBalance);

        await updateSlotState(user.id, {
            ...slotGame,
            reel: newReel,
            bet_step: newBetStep,
            machine_lives: newLives,
            color: newColor,
        });

        res.status(200).json({
            success: true,
            data: {
                newReel,
                newColor,
                newBetStep,
                newLives,
                newBalance,
            },
        });
    } catch (error) {
        console.error('Ошибка в changeMachine:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

async function validateBalance(chatId, providedBalance) {
    const userBalance = await getUserBalance(chatId);
    if (userBalance !== providedBalance) {
        console.warn(
            `⚠️ Несоответствие баланса: \n- В БД: ${userBalance}\n- Прислано с клиента: ${providedBalance}`
        );
    }
    return userBalance;
}

function generateRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color + 'f0'; // Добавляем прозрачность
}

function generateRandomBetStep() {
    return getRandomInt(2, 10) * 5; 
}

function generateRandomLives() {
    return getRandomInt(30, 100); 
}




module.exports = { spinSlot, createSlotGame, changeMachine, getSlotInfo };
