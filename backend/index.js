
const express = require('express');
const cors = require('cors');
const { bot } = require('./services/botService');
const slotsRoutes = require('./routes/slotsRoutes'); 
const { startProjectOptions } = require('./options'); 

const app = express();
app.use(express.json());
app.use(cors());

app.use('/api/slots', slotsRoutes);

bot.setMyCommands([
  { command: '/start', description: 'Начальное приветствие' },
  { command: '/info', description: 'Информация' },
  { command: '/game', description: 'Тестовая игра' },
]);

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  try {
    if (text === '/start') {
      return bot.sendMessage(chatId, "Пошлеппим?", startProjectOptions);
    }
    
  } catch (e) {
    bot.sendMessage(chatId, 'Ошибка: ' + e.message);
  }
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
