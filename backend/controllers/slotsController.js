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
  
    console.log('Запрос на спин:', { chatId, bet, balance });
  
    if (!chatId || bet == null || balance == null) {
      console.error('Некорректные параметры:', { chatId, bet, balance });
      return res.status(400).json({ success: false, error: 'Некорректные параметры' });
    }
  
    try {
      const user = await getUserByChatId(chatId);
      console.log('Пользователь найден:', user);
  
      if (!user) {
        console.error('Пользователь не найден:', chatId);
        return res.status(404).json({ success: false, error: 'Пользователь не найден' });
      }
  
      const slotGame = await getSlotGameByUserId(user.id);
      console.log('Слот-машина найдена:', slotGame);
  
      if (!slotGame) {
        console.error('Слот-машина не найдена для пользователя:', user.id);
        return res.status(404).json({ success: false, error: 'Слот-машина не найдена' });
      }
  
      
      const combination = [
        Math.floor(Math.random() * slotGame.reel.length),
        Math.floor(Math.random() * slotGame.reel.length),
        Math.floor(Math.random() * slotGame.reel.length),
      ];
  
      console.log('Сгенерированная комбинация:', combination);
  
      const newBalance = balance - bet;
  
      console.log('Обновляем баланс пользователя...');
      await updateUserBalance(chatId, newBalance);
  
      console.log('Обновляем слот-машину...');
      await updateSlotGame(user.id, {
        ...slotGame,
        last_win: 0, // TODO: Добавить логику выигрыша
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
