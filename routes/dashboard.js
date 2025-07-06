const express = require('express');
const router = express.Router();
const Artwork = require('../models/Artwork');

// ✅ Simple login check middleware
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login'); // Or send a JSON error if it's API
  }
  next();
}

// ✅ Dashboard Route
router.get('/', requireLogin, async (req, res) => {
  try {
    const artworks = await Artwork.find({ artist: req.session.user.username }); // or artistId
    res.render('dashboard', { user: req.session.user, artworks });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.status(500).send("Server error loading dashboard");
  }
});

module.exports = router;
