
const TelegramApi = require('node-telegram-bot-api');
// заменить перед prod!!!
const token = '7692071006:AAEd1K_CTanWLJ6uhsehjsFeBmk1B1emlbw';

// BOT_ENABLED=false — локальный запуск без polling,
// чтобы не конфликтовать с уже запущенным ботом на этом токене
const botEnabled = process.env.BOT_ENABLED !== 'false';
const bot = new TelegramApi(token, { polling: botEnabled });

if (!botEnabled) {
  console.log('🤖 Бот отключён (BOT_ENABLED=false), polling не запускается');
}

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
