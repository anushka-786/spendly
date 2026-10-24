const mongoose = require("mongoose");

// One budget for each month for each person, the month looks like 2026-10
const budgetSchema = new mongoose.Schema({
  month: { type: String, required: true },
  amount: { type: Number, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

// The same person cannot have two budgets for the same month
budgetSchema.index({ user: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("Budget", budgetSchema);