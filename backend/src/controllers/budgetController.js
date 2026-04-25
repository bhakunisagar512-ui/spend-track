const pool = require('../config/db');

const getBudgets = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM budgets WHERE user_id = $1 ORDER BY category', [req.user.id]);
    res.json({ budgets: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch budgets' });
  }
};

const upsertBudget = async (req, res) => {
  const { category, amount } = req.body;
  if (!category || !amount || isNaN(amount) || amount <= 0) {
    return res.status(400).json({ error: 'Valid category and amount required' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO budgets (user_id, category, amount)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, category)
       DO UPDATE SET amount = $3, updated_at = NOW()
       RETURNING *`,
      [req.user.id, category, parseFloat(amount)]
    );
    res.json({ budget: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save budget' });
  }
};

const deleteBudget = async (req, res) => {
  const { category } = req.params;
  try {
    await pool.query('DELETE FROM budgets WHERE user_id = $1 AND category = $2', [req.user.id, category]);
    res.json({ message: 'Budget removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete budget' });
  }
};

module.exports = { getBudgets, upsertBudget, deleteBudget };
