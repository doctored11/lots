const pool = require('../../db');


const { getSlotGameByUserId, createSlotGame, updateSlotState } = require('./slotsLogic/slotsModel');
const { calculateWinnings, generateRandomColor, generateRandomBetStep, generateRandomLives, generateNewReel } = require('./slotsLogic/gameLogic');
const { getUserByChatId, updateUserBalance, getUserBalance } = require('../userController');


async function getSlotInfo(req, res) {
    const { chatId } = req.params;

    try {
        console.log("Получение данных для chatId:", chatId);
        const user = await getUserByChatId(chatId);
        if (!user) {
            console.error("Пользователь не найден:", chatId);
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
        console.log("::-::");
        console.log("Данные слота:", slot);
        console.log("::_::");

        res.status(200).json({
            success: true,
            data: {
                reel: slot.reel,
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

        let slotGame = await getSlotGameByUserId(user.id);
        if (!slotGame) {
            slotGame = await createSlotGame(user.id);
        }
        console.log('*__ .')
        console.log('slotGame:', slotGame);
        console.log('reel field:', slotGame.reel);

        if (slotGame.machine_lives <= 0) {
            console.log("HP автомата достигло 0. Смена автомата.");
            const newReel = generateNewReel();
            const newLives = generateRandomLives();
            const newColor = generateRandomColor();
            const newBetStep = generateRandomBetStep();

            await updateSlotState(user.id, {
                ...slotGame,
                reel: newReel,
                machine_lives: newLives,
                bet_step: newBetStep,
                last_win: 0,
                max_win: 0,
                color: newColor,
            });
            await updateUserBalance(chatId, currentBalance - bet);
            return res.status(200).json({
                success: true,
                action: "changeMachine",
                data: {
                    newReel,
                    newLives,
                    newColor,
                    newBetStep,
                    balance: currentBalance - bet,
                },
            });
        }


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
        const newLives = slotGame.machine_lives - 1;


        console.log("баданс обновлен", currentBalance, bet, winnings, newBalance)
        console.log("пытаемся обновить слоты")
        await updateSlotState(user.id, {
            ...slotGame,
            last_win: winnings,
            max_win: Math.max(slotGame.max_win, winnings),
            machine_lives: newLives,
            color: slotGame.color,
            
        });
        console.log("обновили слоты")
        res.status(200).json({
            success: true,
            data: { combination, newBalance, machineLives: newLives },
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

        if (currentBalance - machineCost < 0) {
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
            last_win: 0,
            max_win: 0,
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





module.exports = { spinSlot, changeMachine, getSlotInfo };
