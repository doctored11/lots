const { sendMessage } = require('../services/botService');

const spinSlot = async (req, res) => {
    const { chatId, bet, balance } = req.body;

    if (!chatId || bet == null || balance == null) {
        return res.status(400).json({ success: false, error: "chatId, bet и balance обязательны" });
    }

    try {

        const combination = [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)];
        //логика
        await sendMessage(chatId, `Ваша комбинация: ${combination.join(' ')}`);

        res.status(200).json({ success: true, data: { newBalance: balance - bet, combination } });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { spinSlot };