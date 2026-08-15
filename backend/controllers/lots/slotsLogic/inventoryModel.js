const pool = require('../../../db');

// --- инвентарь ---

async function addItem(userId, itemKey, count = 1) {
    await pool.query(
        `INSERT INTO user_items (user_id, item_key, count)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, item_key)
         DO UPDATE SET count = user_items.count + $3`,
        [userId, itemKey, count]
    );
}

async function getItems(userId) {
    const result = await pool.query(
        'SELECT item_key, count FROM user_items WHERE user_id = $1 AND count > 0',
        [userId]
    );
    return result.rows; // [{ item_key, count }]
}

// попытка списать предметы по списку (например для сборки автомата).
// Возвращает true при успехе, false если какого-то предмета не хватает (ничего не списывает).
async function tryConsumeItems(userId, itemKeys) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const itemKey of itemKeys) {
            const res = await client.query(
                `UPDATE user_items
                 SET count = count - 1
                 WHERE user_id = $1 AND item_key = $2 AND count > 0
                 RETURNING count`,
                [userId, itemKey]
            );
            if (res.rows.length === 0) {
                await client.query('ROLLBACK');
                return false;
            }
        }
        await client.query('COMMIT');
        return true;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}

// --- книга рецептов ---

// открывает описание предмета; возвращает true, если открытие новое
async function unlockRecipe(userId, itemKey) {
    const result = await pool.query(
        `INSERT INTO user_recipes (user_id, item_key)
         VALUES ($1, $2)
         ON CONFLICT (user_id, item_key) DO NOTHING
         RETURNING item_key`,
        [userId, itemKey]
    );
    return result.rows.length > 0;
}

async function getUnlockedRecipes(userId) {
    const result = await pool.query(
        'SELECT item_key FROM user_recipes WHERE user_id = $1',
        [userId]
    );
    return result.rows.map(r => r.item_key);
}

module.exports = { addItem, getItems, tryConsumeItems, unlockRecipe, getUnlockedRecipes };
