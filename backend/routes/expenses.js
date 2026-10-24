const express = require("express");
const Expense = require("../models/Expense");

const router = express.Router();

// Get only the expenses of the signed in person, newest date first
router.get("/", async (req, res) => {
  try {
    const expenses = await Expense.find({ user: req.userId }).sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: "Could not load expenses" });
  }
});

// Add a new expense for the signed in person
router.post("/", async (req, res) => {
  try {
    const { amount, category, date, note } = req.body;

    if (!(amount > 0) || !category || !date) {
      return res.status(400).json({ message: "Amount, category and date are required" });
    }

    const expense = await Expense.create({ amount, category, date, note, user: req.userId });
    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: "Could not save the expense" });
  }
});

// Change an expense, only if it belongs to the signed in person
router.put("/:id", async (req, res) => {
  try {
    const { amount, category, date, note } = req.body;

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      { amount, category, date, note },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: "Could not update the expense" });
  }
});

// Delete an expense, only if it belongs to the signed in person
router.delete("/:id", async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, user: req.userId });

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }
    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ message: "Could not delete the expense" });
  }
});

module.exports = router;