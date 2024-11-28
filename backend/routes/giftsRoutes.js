const express = require('express');
const { getGiftInfo, collectGift } = require('../controllers/giftsController');
const router = express.Router();

router.get('/:chatId', getGiftInfo);

router.post('/collect', collectGift);

module.exports = router;
