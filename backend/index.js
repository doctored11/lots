const TelegramApi = require('node-telegram-bot-api')
// сменить токен)
const token = '7692071006:AAEd1K_CTanWLJ6uhsehjsFeBmk1B1emlbw'
const {gameOptions, againOptions} = require('./options.js')
const bot = new TelegramApi(token, { polling: true })
bot.setMyCommands([
    { command: '/start', description: 'начальное приветствие' },
    { command: '/info', description: 'информация' },
    { command: '/testGame', description: 'тестовая игра' },
]);

chats = {}

const startGame = async (chatId) => {
    await bot.sendMessage(chatId, "Я загадал число от 0 до 9 - отгадай)");
    const randomNum = Math.floor(Math.random() * 10);
    chats[chatId] = randomNum;
    await bot.sendMessage(chatId, 'давай выбирай', gameOptions)
}

const start = () => {

    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;

        if (text == "/again") {
            return startGame(chatId)

        }
        if (text == "/start") {
            return bot.sendMessage(chatId, "ну привет, формошлеп! ")
        } if (text == "/info") {
            return bot.sendMessage(chatId, "гугл в помощь " + msg.from.first_name)
        }
        if (text == "/testGame") {
            await bot.sendMessage(chatId, "игрем " + msg.from.first_name + "?");
            return startGame(chatId)

        }
        console.log(msg)
        return bot.sendMessage(chatId, 'Ты написал мне ' + text + " ? ")


        // console.log(" !_")
    })
    bot.on("callback_query", async msg => {

        const data = msg.data;
        const chatId = msg.message.chat.id; 
        if (data === "/again") {
            return startGame(chatId);
        }
        if (data == chats[chatId]) {
            await bot.sendMessage(chatId, 'Угадал! 🎉', againOptions);
        } else {
            await bot.sendMessage(chatId, 'Не угадал. 😢 Правильный ответ: ' + chats[chatId], againOptions);
        }

    });

}

start()