const express = require("express");
const Budget = require("../models/Budget");

const router = express.Router();

// Get only the budgets of the signed in person
router.get("/", async (req, res) => {
  try {
    const budgets = await Budget.find({ user: req.userId });
    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: "Could not load budgets" });
  }
});

// Set the budget for one month, or change it if it already exists
router.put("/:month", async (req, res) => {
  try {
    const { amount } = req.body;

    if (!/^\d{4}-\d{2}$/.test(req.params.month) || !(amount > 0)) {
      return res.status(400).json({ message: "A month like 2026-10 and an amount above zero are required" });
    }

    const budget = await Budget.findOneAndUpdate(
      { month: req.params.month, user: req.userId },
      { amount },
      { new: true, upsert: true }
    );
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: "Could not save the budget" });
  }
});

// Remove the budget of one month for the signed in person
router.delete("/:month", async (req, res) => {
  try {
    await Budget.findOneAndDelete({ month: req.params.month, user: req.userId });
    res.json({ message: "Budget removed" });
  } catch (error) {
    res.status(500).json({ message: "Could not remove the budget" });
  }
});

module.exports = router;