const pool = require('../../../db');
const { generateRandomColor } = require('./gameLogic');

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
        "bomb", "grape", "clover", "bomb", "grape", "grape",
    ]);

    const randomColor = generateRandomColor();
    const betStep = 10;
    const lives = 10;

    const result = await pool.query(
        `INSERT INTO slot_game (user_id, reel, bet_step, last_win, max_win, machine_lives, color) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [userId, initialReel, betStep, 0, 0, lives, randomColor]
    );

    return result.rows[0];
}



async function updateSlotState(userId, state) {
    const { reel, bet_step, last_win, max_win, machine_lives, color } = state;
    const reelAsJson = JSON.stringify(reel);
    if (!reel || bet_step === undefined || last_win === undefined || max_win === undefined || machine_lives === undefined || !color) {
        throw new Error("Недостаточно данных для обновления автомата");
    }
    console.log("Обновляем состояние автомата:");
    await pool.query(
        `UPDATE slot_game
         SET reel = $1, bet_step = $2, last_win = $3, max_win = $4, machine_lives = $5, color = $6
         WHERE user_id = $7`,
        [reelAsJson, bet_step, last_win, max_win, machine_lives, color, userId]
    );
}

module.exports = { getSlotGameByUserId, createSlotGame, updateSlotState };
