
const express = require('express');
const router = express.Router();
const { spinSlot, changeMachine, getSlotInfo, getInventory, getRecipeBook, buildMachine, repairMachine, shopRoll } = require('../controllers/lots/slotsController');


router.post('/spin', spinSlot);
router.get('/:chatId/inventory', getInventory);
router.get('/:chatId/recipes', getRecipeBook);
router.post('/build-machine', buildMachine);
router.post('/repair', repairMachine);
router.post('/shop-roll', shopRoll);
router.get("/:chatId", getSlotInfo);
router.post('/change-machine', changeMachine);
//+ маршруты тут 

module.exports = router;
