
const TelegramApi = require('node-telegram-bot-api');
// заменить перед prod!!!
const token = '7692071006:AAEd1K_CTanWLJ6uhsehjsFeBmk1B1emlbw';
const bot = new TelegramApi(token, { polling: true });

const sendMessage = async (chatId, message) => {
  try {
    await bot.sendMessage(chatId, message);
  } catch (error) {
    console.error("Ошибка отправки сообщения:", error);
  }
};



module.exports = {
  bot,
  sendMessage,
};
