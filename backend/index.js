const TelegramApi = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');

const token = '7692071006:AAEd1K_CTanWLJ6uhsehjsFeBmk1B1emlbw';
const { gameOptions, againOptions, startProjectOptions } = require('./options.js');

const bot = new TelegramApi(token, { polling: true });
const app = express();

app.use(express.json());
app.use(cors());

bot.setMyCommands([
    { command: '/start', description: 'начальное приветствие' },
    { command: '/info', description: 'информация' },
    { command: '/game', description: 'тестовая игра' },
]);

const chats = {};

const startGame = async (chatId) => {
    await bot.sendMessage(chatId, "Я загадал число от 0 до 9 - отгадай)");
    const randomNum = Math.floor(Math.random() * 10);
    chats[chatId] = randomNum;
    await bot.sendMessage(chatId, 'давай выбирай', gameOptions);
};

const start = async () => {
    bot.on('message', async (msg) => {
        const text = msg.text;
        const chatId = msg.chat.id;

        try {
            if (text === '/again') {
                return startGame(chatId);
            }
            if (text === '/start') {
                return bot.sendMessage(chatId, "ну привет, формошлеп! ", startProjectOptions);
            }
            if (text === '/info') {
               
                return bot.sendMessage(chatId, `Привет, ${msg.from.first_name}`);
            }
            if (text === '/game') {
                await bot.sendMessage(chatId, `Игрем, ${msg.from.first_name}?`);
                return startGame(chatId);
            }
            console.log(msg);
            return bot.sendMessage(chatId, `Ты написал мне: ${text}?`);
        } catch (e) {
            bot.sendMessage(chatId, '🛑 Что-то пошло не по плану: ' + e.message);
        }
    });

    bot.on('callback_query', async (msg) => {
        const data = msg.data;
        const chatId = msg.message.chat.id;

        if (data === '/again') {
            return startGame(chatId);
        }
        if (data == chats[chatId]) {
            await bot.sendMessage(chatId, 'Угадал! 🎉', againOptions);
        } else {
            await bot.sendMessage(chatId, `Не угадал. 😢 Правильный ответ: ${chats[chatId]}`, againOptions);
        }
    });
};

app.post('/web-data', async (req, res) => {
    console.log(' -_- Получен запрос в /web-data:', req.body); 

    try {
        const { queryId } = req.body;
        if (!queryId) {
            console.log('Ошибка: отсутствует queryId');
            return res.status(400).json({ error: 'queryId обязателен' });
        }

        console.log('Обработан queryId:', queryId);
        return res.status(200).json({ success: true, message: 'Данные обработаны!' });
    } catch (e) {
        console.error('Ошибка в обработке /web-data:', e.message);
        return res.status(500).json({ error: 'Ошибка обработки данных' });
    }
});


app.post('/api/send-message', async (req, res) => {
    console.log('Request :', req.body);
    const { chatId, message } = req.body;

    if (!chatId || !message) {
        console.log('Error chatId or message');
        return res.status(400).json({ error: 'chatId и message обязательны' });
    }

    try {
        await bot.sendMessage(chatId, message);
        console.log("0_0", message, chatId);
        res.status(200).json({ success: true, message: 'Сообщение отправлено в бот!' });
    } catch (error) {
        console.error('Error sending message to bot:', error);
        res.status(500).json({ error: 'Ошибка отправки сообщения в бот' });
    }
});

const PORT = 8000;
app.listen(PORT, () => {
    console.log("Сервер запущен на порту _:", PORT);
    start();
});
