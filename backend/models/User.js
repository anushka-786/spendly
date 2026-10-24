const mongoose = require("mongoose");

// This describes one person who signed in with Google
const userSchema = new mongoose.Schema({
  googleId: { type: String, required: true, unique: true },
  name: { type: String, default: "" },
  email: { type: String, default: "" },
  picture: { type: String, default: "" },
});

module.exports = mongoose.model("User", userSchema);