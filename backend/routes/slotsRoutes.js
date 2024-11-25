
const express = require('express');
const router = express.Router();
const { spinSlot } = require('../controllers/slotsController');


router.post('/spin', spinSlot);

//+ маршруты тут 

module.exports = router;
