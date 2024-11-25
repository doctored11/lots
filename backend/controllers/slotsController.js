const { getUserByChatId, updateUserBalance } = require('../controllers/userController');
const { getSlotGameByUserId, updateSlotGame } = require('../models/slot_games');
const { sendMessage } = require('../services/botService');

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

const spinSlot = async (req, res) => {
  const { chatId, bet, balance } = req.body;

  if (!chatId || bet == null || balance == null) {
    return res.status(400).json({ success: false, error: "chatId, bet и balance обязательны" });
  }

  try {
    const user = await getUserByChatId(chatId);
    if (!user) {
      return res.status(404).json({ success: false, error: "Пользователь не найден" });
    }

    const slotGame = await getSlotGameByUserId(user.id);
    if (!slotGame) {
      return res.status(404).json({ success: false, error: "Слот-машина не найдена" });
    }

    if (balance + bet > user.balance) {
      return res.status(400).json({ success: false, error: "Баланс + ставка больше текущего баланса." });
    }
    if (bet <= 0) {
      return res.status(400).json({ success: false, error: "Ставка должна быть положительным числом." });
    }
    if (balance < 0) {
      return res.status(400).json({ success: false, error: "Баланс не может быть отрицательным." });
    }

    const combination = [
      getRandomInt(slotGame.reel.length),
      getRandomInt(slotGame.reel.length),
      getRandomInt(slotGame.reel.length),
    ];

    const newBalance = balance;

    await updateUserBalance(chatId, newBalance);

    await updateSlotGame(user.id, {
      ...slotGame,
      last_win: 0, // todo логика выигрыша
      machine_lives: slotGame.machine_lives - 1, 
    });

    await sendMessage(
      chatId,
      ` комбинация: ${combination.join(' ')}.\n новый баланс: ${newBalance}.`
    );

    res.status(200).json({
      success: true,
      data: {
        combination,
        newBalance,
      },
    });
  } catch (error) {
    console.error('Ошибка в spinSlot:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { spinSlot };
