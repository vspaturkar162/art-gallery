// models/Artwork.js
const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
  title: String,
  price: String,
  description: String,
  imagePath: String,
  artist: String
});

module.exports = mongoose.model('Artwork', artworkSchema);
