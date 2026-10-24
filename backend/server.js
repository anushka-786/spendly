// Load the secret values from the .env file
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const checkLogin = require("./middleware/checkLogin");


const app = express();

// Allow the webpage to talk to this server and send data in JSON form
app.use(cors());
app.use(express.json());

// Sign in route, anyone can use it
app.use("/api/auth", require("./routes/auth"));

// Expenses and budgets are only for signed in people
app.use("/api/expenses", checkLogin, require("./routes/expenses"));
app.use("/api/budgets", checkLogin, require("./routes/budgets"));
// The assistant is only for signed in people
app.use("/api/chat", checkLogin, require("./routes/chat"));


// Show the website files from the frontend folder
app.use(express.static(path.join(__dirname, "../frontend")));

// Connect to the database first and then start the server
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to the database");
    app.listen(PORT, () => console.log("Server is running on port " + PORT));
  })
  .catch((error) => {
    console.log("Could not connect to the database");
    console.log(error.message);
  });