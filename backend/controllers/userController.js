const pool = require('../db');

async function getUserByChatId(chatId) {
    const result = await pool.query('SELECT * FROM "user" WHERE chat_id = $1', [chatId]);
    return result.rows[0];
}

async function createUser(chatId, username, initialData = {}) {
    const {
        balance = 150, 
        status = '[]', 
        exp = 0,       
        rank = null,   
    } = initialData;

    const result = await pool.query(
        `INSERT INTO "user" (chat_id, username, balance, status, exp, rank) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [chatId, username, balance, status, exp, rank]
    );
    return result.rows[0];
}

async function ensureUserExists(chatId, username = 'miniShl3pP3r') {

    let user = await getUserByChatId(chatId);


    if (!user) {
        user = await createUser(chatId, username);
    }

    return user;
}
async function updateUserBalance(chatId, balance) {
    console.log('Обновляем баланс. Новый баланс:', balance);

    await pool.query('UPDATE "user" SET balance = $1 WHERE chat_id = $2', [balance, chatId]);
}


async function updateusertats(chatId, status, exp, rank) {
    await pool.query(
        'UPDATE "user" SET status = $1, exp = $2, rank = $3 WHERE chat_id = $4',
        [status, exp, rank, chatId]
    );
}

async function getAllUsers() {
    const result = await pool.query('SELECT * FROM "user"');
    return result.rows;
}


async function getUserInfo(chatId) {
    const result = await pool.query('SELECT * FROM "user" WHERE chat_id = $1', [chatId]);
    return result.rows[0];
}


async function getUserBalance(chatId) {
    const result = await pool.query('SELECT balance FROM "user" WHERE chat_id = $1', [chatId]);
    return result.rows[0]?.balance;
}


  

async function deleteUser(chatId) {
    const result = await pool.query('DELETE FROM "user" WHERE chat_id = $1 RETURNING *', [chatId]);
    return result.rows[0];
}

module.exports = {
    getUserByChatId,
    createUser,
    updateUserBalance,
    updateusertats,
    getAllUsers,
    getUserInfo,
    getUserBalance,
    deleteUser,
    ensureUserExists,
};
