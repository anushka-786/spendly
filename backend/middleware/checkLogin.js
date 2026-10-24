const jwt = require("jsonwebtoken");

// Checks the login pass sent by the browser and finds out who the person is
module.exports = function checkLogin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ message: "Please sign in" });
  }

  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = data.id;
    next();
  } catch (error) {
    res.status(401).json({ message: "Your session has ended, please sign in again" });
  }
};