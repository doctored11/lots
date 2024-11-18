const TelegramApi = require('node-telegram-bot-api')
const express = require('express')
const cors = require('cors')
// сменить токен)
const token = '7692071006:AAEd1K_CTanWLJ6uhsehjsFeBmk1B1emlbw'
const webAppUrl = "https://yandex.ru/search/?text=2.3*24*30&clid=2270455&banerid=6301000000%3A6410756e7460f71d765e2614&win=585&lr=213"

const sequelize = require('./db.js')

const UserModel = require('./models.js')

const { gameOptions, againOptions, startProjectOptions } = require('./options.js')
const bot = new TelegramApi(token, { polling: true })
const app = express();

app.use(express.json())
app.use(cors())

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
                // await UserModel.create({ chatId })
                return bot.sendMessage(chatId, "ну привет, формошлеп! ", startProjectOptions)
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

app.post('/web-data', async () => {
    const { queryID } = req.body;
    try {
        await bot.answerCallbackQuery(queryID, {
            type: 'article',
            id: queryID,
            title: 'ответ с бека',
            input_message_content: {
                message_text: "Ответ ответ с бека"
            }

        })
        return res.status(200).json({})
    } catch (e) {
        await bot.answerCallbackQuery(queryID, {
            type: 'article',
            id: queryID,
            title: 'ошибка с бека',
            input_message_content: {
                message_text: "Ответ ОЩИБКА с бека"
            }
        })
        return res.status(500).json({})
    }

})

app.post('/api/send-message', async (req, res) => {
    console.log('Request :', req.body); 
    const { chatId, message } = req.body;

    if (!chatId || !message) {
        console.log('Error chatId or message');
        return res.status(400).json({ error: 'chatId and message are required' });
    }

    try {
        await bot.sendMessage(chatId, message);
        console.log("0_0",message, chatId)
        res.status(200).json({ success: true, message: 'Message sent to bot!' });
    } catch (error) {
        console.error('Error sending message to bot:', error);
        res.status(500).json({ error: 'Failed to send message to bot' });
    }
});
// start()
const PORT = 8000;
app.listen(PORT, () => {
    console.log("server started on : ", PORT);
    start()
})