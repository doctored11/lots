const TelegramApi = require('node-telegram-bot-api')

const token = '7692071006:AAGtbi0N5H1wPOv9xO8lTDN06XE2NL_bKLw'

const bot = new TelegramApi(token, { polling: true })
bot.setMyCommands([
    { command: '/start', description: 'начальное приветствие' },
    { command: '/info', description: 'информация' },
    { command: '/testGame', description: 'тестовая игра' },
]);

chats = {}
const gameOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: "1", callback_data: "1" }, { text: "2", callback_data: "2" }, { text: "3", callback_data: "3" }],
            [{ text: "4", callback_data: "4" }, { text: "5", callback_data: "5" }, { text: "6", callback_data: "6" }],
            [{ text: "7", callback_data: "7" }, { text: "8", callback_data: "8" }, { text: "9", callback_data: "9" }],
            [{ text: "0", callback_data: "0" }]
        ]
    })
}
const againOptions = {
    reply_markup: JSON.stringify({
        inline_keyboard: [
            [{ text: "еще раз!", callback_data: "/again" }]
        ]
    })
}
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