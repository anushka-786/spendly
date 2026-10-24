const express = require("express");
const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Sign in using the proof that Google gives to the browser
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is missing" });
    }

    // Ask Google to check that the proof is real and made for our app
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const info = ticket.getPayload();

    // Find the person, or create them the first time they sign in
    let user = await User.findOne({ googleId: info.sub });
    if (!user) {
      user = await User.create({
        googleId: info.sub,
        name: info.name,
        email: info.email,
        picture: info.picture,
      });
    }

    // Give the browser a login pass that lasts 30 days
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });

    res.json({
      token: token,
      user: { name: user.name, email: user.email, picture: user.picture },
    });
  } catch (error) {
    res.status(401).json({ message: "Google sign in failed" });
  }
});

module.exports = router;