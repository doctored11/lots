const TelegramApi = require('node-telegram-bot-api')
// сменить токен)
const token = '7692071006:AAEd1K_CTanWLJ6uhsehjsFeBmk1B1emlbw'

const sequelize = require('./db.js')

const UserModel = require('./models.js')

const { gameOptions, againOptions } = require('./options.js')
const bot = new TelegramApi(token, { polling: true })
bot.setMyCommands([
    { command: '/start', description: 'начальное приветствие' },
    { command: '/info', description: 'информация' },
    { command: '/game', description: 'тестовая игра' },
]);


chats = {}

const startGame = async (chatId) => {
    await bot.sendMessage(chatId, "Я загадал число от 0 до 9 - отгадай)");
    const randomNum = Math.floor(Math.random() * 10);
    chats[chatId] = randomNum;
    await bot.sendMessage(chatId, 'давай выбирай', gameOptions)
}

const start = async () => {

    try {
        await sequelize.authenticate();
        await sequelize.sync()
    } catch (e) {
        console.log('подключение к Бд ' + e)
    }

    bot.on('message', async msg => {
        const text = msg.text;
        const chatId = msg.chat.id;

        try {


            if (text == "/again") {
                return startGame(chatId)

            }
            if (text == "/start") {
                await UserModel.create({ chatId })
                return bot.sendMessage(chatId, "ну привет, формошлеп! ")
            } if (text == "/info") {
                const user = await UserModel.findOne({ chatId })
                return bot.sendMessage(chatId, "у тебя, " + msg.from.first_name + " правильных" + user.right + "и не правильных: " + user.wrong)
            }
            if (text == "/game") {
                await bot.sendMessage(chatId, "игрем " + msg.from.first_name + "?");
                return startGame(chatId)

            }
            console.log(msg)
            return bot.sendMessage(chatId, 'Ты написал мне ' + text + " ? ")
        } catch (e) {
            bot.sendMessage(chatId, '🛑 Что то пошло не по плану  ' + e)
        }





        // console.log(" !_")
    })
    bot.on("callback_query", async msg => {

        const data = msg.data;
        const chatId = msg.message.chat.id;
        if (data === "/again") {
            return startGame(chatId);
        }
        const user = await UserModel.findOne({ chatId })
        if (data == chats[chatId]) {
            user.right += 1;
            await bot.sendMessage(chatId, 'Угадал! 🎉', againOptions);

        } else {
            user.wrong += 1;
            await bot.sendMessage(chatId, 'Не угадал. 😢 Правильный ответ: ' + chats[chatId], againOptions);

        }
        await user.save();

    });

}

start()