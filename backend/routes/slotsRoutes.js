
const express = require('express');
const router = express.Router();
const { spinSlot, changeMachine,getSlotInfo } = require('../controllers/slotsController');


router.post('/spin', spinSlot);
router.get("/:chatId", getSlotInfo); 
router.post('/change-machine', changeMachine);
//+ маршруты тут 

module.exports = router;
