const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserByChatId,
    getUserInfo,
    getUserBalance,
    deleteUser,
    ensureUserExists, 
} = require('../controllers/userController');

router.get('/', async (req, res) => {
    try {
        const users = await getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:chatId', async (req, res) => {
    const { chatId } = req.params;
    try {
        const user = await getUserInfo(chatId);
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'Пользователь не найден' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:chatId/balance', async (req, res) => {
    const { chatId } = req.params;
    try {
        const balance = await getUserBalance(chatId);
        if (balance !== undefined) {
            res.json({ chatId, balance });
        } else {
            res.status(404).json({ message: 'Пользователь не найден' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/initialize', async (req, res) => {
    const { chatId, username } = req.body;

    try {
        const user = await ensureUserExists(chatId, username);
        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        console.error('Ошибка инициализации пользователя:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


router.delete('/:chatId', async (req, res) => {
    const { chatId } = req.params;
    try {
        const deletedUser = await deleteUser(chatId);
        if (deletedUser) {
            res.json({ message: 'Пользователь удалён', deletedUser });
        } else {
            res.status(404).json({ message: 'Пользователь не найден' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
