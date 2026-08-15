const pool = require('../../db');


const { getSlotGameByUserId, createSlotGame, updateSlotState } = require('./slotsLogic/slotsModel');
const { calculateWinnings, generateRandomColor, generateRandomBetStep, generateRandomLives, generateNewReel, rollItemDrop, rollSpinDamage, ITEM_RARITY } = require('./slotsLogic/gameLogic');
const { getUserByChatId, updateUserBalance, getUserBalance } = require('../userController');
const { addItem, getItems, tryConsumeItems, unlockRecipe, getUnlockedRecipes } = require('./slotsLogic/inventoryModel');

const MACHINE_MAX_HP = 100;
const REPAIR_COST = 50;
const REPAIR_AMOUNT = 10;
const SHOP_ROLL_COST = 1000;

// стартовый набор предметов, чтобы новичку было из чего собрать первый автомат
const STARTER_ITEMS = ['grape', 'grape', 'cherry', 'cherry', 'banana'];


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
            // стартовый набор предметов для первой сборки
            for (const item of STARTER_ITEMS) {
                await addItem(user.id, item, 1);
            }
        }
        console.log('*__ .')
        console.log('slotGame:', slotGame);
        console.log('reel field:', slotGame.reel);

        // сломанный автомат не крутится — сначала ремонт
        if (slotGame.machine_lives <= 0) {
            console.log("Автомат сломан (0 HP), нужен ремонт");
            return res.status(400).json({ success: false, error: 'Автомат сломан! Почини его за ' + REPAIR_COST, broken: true });
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
        // урон автомату за прокрут: 0..5 HP, не ниже нуля
        const spinDamage = rollSpinDamage();
        const newLives = Math.max(0, slotGame.machine_lives - spinDamage);
        console.log(`🔧 урон автомату: -${spinDamage} HP (${slotGame.machine_lives} -> ${newLives})`);


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

        // дроп случайного предмета за спин
        const droppedItem = rollItemDrop();
        await addItem(user.id, droppedItem, 1);
        console.log("🎁 дроп:", droppedItem, "(", ITEM_RARITY[droppedItem], ")");

        // тройка одинаковых — открывает описание в книге рецептов
        let unlockedRecipeItem = null;
        if (results[0] === results[1] && results[1] === results[2]) {
            const isNew = await unlockRecipe(user.id, results[0]);
            if (isNew) {
                unlockedRecipeItem = results[0];
                console.log("📖 открыт рецепт:", unlockedRecipeItem);
            }
        }

        res.status(200).json({
            success: true,
            data: {
                combination,
                newBalance,
                machineLives: newLives,
                machineMaxLives: MACHINE_MAX_HP,
                spinDamage,
                broken: newLives <= 0,
                droppedItem,
                droppedItemRarity: ITEM_RARITY[droppedItem],
                unlockedRecipeItem,
            },
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


// инвентарь игрока (выбитые предметы)
const getInventory = async (req, res) => {
    const { chatId } = req.params;
    try {
        const user = await getUserByChatId(chatId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
        const items = await getItems(user.id);
        res.status(200).json({
            success: true,
            data: items.map(({ item_key, count }) => ({
                item: item_key,
                count,
                rarity: ITEM_RARITY[item_key] || 'common',
            })),
        });
    } catch (error) {
        console.error('Ошибка в getInventory:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// книга рецептов: какие предметы открыты (тройкой одинаковых)
const getRecipeBook = async (req, res) => {
    const { chatId } = req.params;
    try {
        const user = await getUserByChatId(chatId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
        const unlocked = await getUnlockedRecipes(user.id);
        const book = Object.entries(ITEM_RARITY).map(([item, rarity]) => ({
            item,
            rarity,
            unlocked: unlocked.includes(item),
        }));
        res.status(200).json({ success: true, data: book });
    } catch (error) {
        console.error('Ошибка в getRecipeBook:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// сборка своего автомата из предметов инвентаря.
// body: { chatId, reel: ["bomb", "grape", ...] } — предметы списываются 1:1
const buildMachine = async (req, res) => {
    const { chatId, reel } = req.body;

    if (!chatId || !Array.isArray(reel) || reel.length < 4 || reel.length > 8) {
        return res.status(400).json({ success: false, error: 'Лента должна содержать от 4 до 8 предметов' });
    }
    const invalid = reel.filter(item => !(item in ITEM_RARITY));
    if (invalid.length > 0) {
        return res.status(400).json({ success: false, error: 'Неизвестные предметы: ' + invalid.join(', ') });
    }

    try {
        const user = await getUserByChatId(chatId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }

        const consumed = await tryConsumeItems(user.id, reel);
        if (!consumed) {
            return res.status(400).json({ success: false, error: 'Не хватает предметов в инвентаре' });
        }

        let slotGame = await getSlotGameByUserId(user.id);
        if (!slotGame) {
            slotGame = await createSlotGame(user.id);
        }

        await updateSlotState(user.id, {
            ...slotGame,
            reel,
            last_win: 0,
            max_win: 0,
            machine_lives: generateRandomLives(),
            color: slotGame.color,
        });

        console.log('🔧 собран свой автомат:', reel);
        res.status(200).json({ success: true, data: { newReel: reel } });
    } catch (error) {
        console.error('Ошибка в buildMachine:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ремонт автомата: +10 HP за 50 монет
const repairMachine = async (req, res) => {
    const { chatId, balance } = req.body;

    if (!chatId || typeof balance === 'undefined') {
        return res.status(400).json({ success: false, error: 'Чего то не хватает' });
    }

    try {
        const user = await getUserByChatId(chatId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
        const currentBalance = await validateBalance(chatId, balance);

        if (currentBalance - REPAIR_COST < 0) {
            return res.status(400).json({ success: false, error: 'Недостаточно средств для ремонта' });
        }

        const slotGame = await getSlotGameByUserId(user.id);
        if (!slotGame) {
            return res.status(404).json({ success: false, error: 'Слот-машина не найдена' });
        }

        if (slotGame.machine_lives >= MACHINE_MAX_HP) {
            return res.status(400).json({ success: false, error: 'Автомат полностью исправен' });
        }

        const newLives = Math.min(MACHINE_MAX_HP, slotGame.machine_lives + REPAIR_AMOUNT);
        const newBalance = currentBalance - REPAIR_COST;

        await updateUserBalance(chatId, newBalance);
        await updateSlotState(user.id, {
            ...slotGame,
            machine_lives: newLives,
            color: slotGame.color,
        });

        console.log(`🔧 ремонт: ${slotGame.machine_lives} -> ${newLives} HP`);
        res.status(200).json({
            success: true,
            data: { newLives, newBalance, maxLives: MACHINE_MAX_HP },
        });
    } catch (error) {
        console.error('Ошибка в repairMachine:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// магазин: прокрут гачи за 1000 — случайный предмет в коллекцию
const shopRoll = async (req, res) => {
    const { chatId, balance } = req.body;

    if (!chatId || typeof balance === 'undefined') {
        return res.status(400).json({ success: false, error: 'Чего то не хватает' });
    }

    try {
        const user = await getUserByChatId(chatId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'Пользователь не найден' });
        }
        const currentBalance = await validateBalance(chatId, balance);

        if (currentBalance - SHOP_ROLL_COST < 0) {
            return res.status(400).json({ success: false, error: 'Недостаточно средств (нужно ' + SHOP_ROLL_COST + ')' });
        }

        const item = rollItemDrop();
        await addItem(user.id, item, 1);
        const newBalance = currentBalance - SHOP_ROLL_COST;
        await updateUserBalance(chatId, newBalance);

        console.log(`🎰 гача: выпал ${item} (${ITEM_RARITY[item]})`);
        res.status(200).json({
            success: true,
            data: { item, rarity: ITEM_RARITY[item], newBalance },
        });
    } catch (error) {
        console.error('Ошибка в shopRoll:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};





module.exports = { spinSlot, changeMachine, getSlotInfo, getInventory, getRecipeBook, buildMachine, repairMachine, shopRoll };
