const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

const { requireLogin } = require('./middleware/auth');
const Artwork = require('./models/Artwork'); // if you're using Mongoose

// Register
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const hashedPass = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPass });
    await newUser.save();
    res.redirect('/login.html');
  } catch (err) {
    res.status(500).send('Registration failed');
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.user = user;
      // res.redirect('/index.html');
      res.json({ success: true, redirect: '/dashboard' });
    } else {
      res.status(401).send('Invalid email or password');
    }
  } catch (err) {
    res.status(500).send('Login failed');
  }
});

module.exports = router;
// middleware/auth.js
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

module.exports = { requireLogin };

app.get('/dashboard', requireLogin, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const myArtworks = await Artwork.find({ artistId: userId }); // assuming each artwork has artistId
    res.render('dashboard', { artworks: myArtworks, user: req.session.user });
  } catch (err) {
    res.status(500).send('Error loading dashboard.');
  }
});