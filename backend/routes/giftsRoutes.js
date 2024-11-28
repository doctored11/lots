const express = require('express');
const { getGiftInfo, collectGift } = require('../controllers/gifts/giftsController');

const router = express.Router();

router.get('/status/:chatId', getGiftInfo);

router.post('/collect', collectGift);

module.exports = router;
