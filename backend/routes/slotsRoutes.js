
const express = require('express');
const router = express.Router();
const { spinSlot, changeMachine, getSlotInfo, getInventory, getRecipeBook, buildMachine } = require('../controllers/lots/slotsController');


router.post('/spin', spinSlot);
router.get('/:chatId/inventory', getInventory);
router.get('/:chatId/recipes', getRecipeBook);
router.post('/build-machine', buildMachine);
router.get("/:chatId", getSlotInfo);
router.post('/change-machine', changeMachine);
//+ маршруты тут 

module.exports = router;
