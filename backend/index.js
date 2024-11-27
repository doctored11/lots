
const express = require('express');
const cors = require('cors');
const path = require('path');

const { bot } = require('./services/botService');
const slotsRoutes = require('./routes/slotsRoutes');
const userRoutes = require('./routes/userRoutes');
const { ensureUserExists } = require('./controllers/userController');
const {createSlotGame} = require('./controllers/slotsLogic/slotsModel')

const { startProjectOptions } = require('./options');


const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'frontend/dist')));


app.use('/api/slots', slotsRoutes);
app.use('/api/user', userRoutes);

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

            const username = msg.from.username || `shl${chatId}pp3r`; 
            await bot.sendMessage(chatId, username)
            const user = await ensureUserExists(chatId, username);
            await createSlotGame(user.id);
            return bot.sendMessage(chatId, ` ${username}, Пошлеппим? `, startProjectOptions);
        }

    } catch (e) {
        bot.sendMessage(chatId, 'Ошибка: ' + e.message);
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend/dist', 'index.html'));
});
const PORT = 8000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
