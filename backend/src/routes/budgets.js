const express = require('express');
const router = express.Router();
const { getBudgets, upsertBudget, deleteBudget } = require('../controllers/budgetController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getBudgets);
router.post('/', upsertBudget);
router.delete('/:category', deleteBudget);

module.exports = router;
