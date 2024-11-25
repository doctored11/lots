
const express = require('express');
const router = express.Router();
const { spinSlot, changeMachine } = require('../controllers/slotsController');


router.post('/spin', spinSlot);
router.post('/change-machine', changeMachine);
//+ маршруты тут 

module.exports = router;
