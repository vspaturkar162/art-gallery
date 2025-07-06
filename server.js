// Complete server.js with fixes
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const multer = require('multer');
const bcrypt = require('bcrypt');
const fs = require('fs');
const newartworks = []; // Temporary in-memory array
const app = express();
const Artwork = require('./models/Artwork');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // This is crucial for parsing JSON requests
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'mySecretKey',
  resave: false,
  saveUninitialized: false
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const dashboardRoutes = require('./routes/dashboard');
app.use('/dashboard', dashboardRoutes);

// User Schema (inline for now to avoid import issues)
const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// MongoDB Connection
mongoose.connect('mongodb+srv://vaishnavipaturkar:vaishnavi162@vaishnavi.kyjpk0n.mongodb.net/artGallery?retryWrites=true&w=majority&appName=VAISHNAVI', {
  dbName: 'artGallery'
}).then(() => {
  console.log("MongoDB connected successfully");
}).catch(err => {
  console.error("MongoDB connection error:", err);
});

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public/uploads'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// FIXED REGISTER ROUTE
app.post('/register', async (req, res) => {
  console.log("=== REGISTRATION ATTEMPT ===");
  console.log("Request body:", req.body);
  console.log("Content-Type:", req.headers['content-type']);

  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ 
        success: false, 
        message: 'All fields (username, email, password) are required' 
      });
    }

    console.log("✅ All fields provided");
    console.log("Checking for existing user with email:", email);

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("❌ Email already exists:", email);
      return res.status(409).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }

    console.log("✅ Email is available");
    console.log("Hashing password...");

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("✅ Password hashed successfully");

    // Create new user
    console.log("Creating new user...");
    const newUser = new User({ 
      username: username.trim(), 
      email: email.trim().toLowerCase(), 
      password: hashedPassword 
    });
    
    const savedUser = await newUser.save();
    console.log("✅ User saved successfully:", savedUser.username);

    // Send success response
    return res.status(201).json({ 
      success: true, 
      message: 'Registration successful! You can now login.',
      user: { 
        id: savedUser._id,
        username: savedUser.username, 
        email: savedUser.email 
      }
    });

  } catch (error) {
    console.error("❌ REGISTRATION ERROR:", error);
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      console.log("Duplicate key error");
      return res.status(409).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      console.log("Validation error:", error.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid data: ' + error.message 
      });
    }

    // Handle connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongooseError') {
      console.log("Database connection error");
      return res.status(503).json({ 
        success: false, 
        message: 'Database connection error. Please try again later.' 
      });
    }
    
    // Generic error - MUST return JSON
    return res.status(500).json({ 
      success: false, 
      message: 'Registration failed: ' + error.message 
    });
  }
});

// FIXED LOGIN ROUTE
app.post('/login', async (req, res) => {
  console.log("=== LOGIN ATTEMPT ===");
  console.log("Request body:", req.body);

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      console.log("User not found:", email);
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log("Password mismatch for:", email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    req.session.user = {
      id: user._id,
      username: user.username,
      email: user.email
    };

    console.log("✅ Login successful for:", user.username);
    
    return res.json({ 
      success: true, 
      message: 'Login successful!',
      redirect: '/dashboard',
      user: { 
        username: user.username, 
        email: user.email 
      }
    });

  } catch (error) {
    console.error("❌ LOGIN ERROR:", error);
    return res.status(500).json({ 
      success: false, 
      message: 'Login failed. Please try again.' 
    });
  }
});

// Upload Art
app.post('/add-art', upload.single('image'), async (req, res) => {
  const { title, price, description } = req.body;
  const imagePath = '/uploads/' + req.file.filename;
  const artist = req.session?.user?.username || "Unknown";

  try {
    const newArt = new Artwork({ title, price, description, imagePath, artist });
    await newArt.save();

    console.log('✅ New artwork added to MongoDB:', newArt);
    res.redirect('/gallery'); // Redirect to the dynamic gallery page
  } catch (err) {
    console.error('❌ Error saving artwork to DB:', err);
    res.status(500).send('Failed to upload artwork');
  }
});

app.get('/gallery', async (req, res) => {
  try {
    const artworks = await Artwork.find().lean();
    let galleryHTML = `
      <h1>Art Gallery</h1>
      <div style="display: flex; flex-wrap: wrap;">
    `;

    artworks.forEach(art => {
      galleryHTML += `
        <div style="margin: 10px;">
          <img src="${art.imagePath}" style="width: 200px; height: auto;"><br>
          <strong>${art.title}</strong><br>
          <em>${art.artist}</em><br>
          ₹${art.price}<br>
          <p>${art.description}</p>
        </div>
      `;
    });

    galleryHTML += `</div>`;
    res.send(galleryHTML);
  } catch (err) {
    res.status(500).send('Error loading gallery');
  }
});



// Search
const artworks = [
  { name: "Wine & Whimsy", artist: "Vaishnavi Paturkar" },
  { name: "Dog Sketch", artist: "Vaishnavi Paturkar" },
  { name: "Snake", artist: "Vaishnavi Paturkar" }
];

app.get('/newartworks', (req, res) => {
  res.json(newartworks); // Send all uploaded artworks
});

app.get('/api/artworks', async (req, res) => {
  try {
    const artworks = await Artwork.find().lean();
    res.json({ success: true, artworks });
  } catch (err) {
    console.error("Error fetching artworks:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.delete('/api/artworks/:id', async (req, res) => {
  try {
    const artwork = await Artwork.findByIdAndDelete(req.params.id);
    if (!artwork) return res.status(404).json({ success: false, message: 'Artwork not found' });

    // Delete the image file
    const imagePath = path.join(__dirname, 'public', artwork.imagePath);
    fs.unlink(imagePath, err => {
      if (err) console.error('Image file not found or already deleted');
    });

    res.json({ success: true, message: 'Artwork deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Error deleting artwork' });
  }
});

app.get('/search', (req, res) => {
  const query = req.query.query.toLowerCase();
  const results = artworks.filter(art =>
    art.name.toLowerCase().includes(query) ||
    art.artist.toLowerCase().includes(query)
  );
  res.json({ success: true, results });
});

// Error handler middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error' 
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('MongoDB connection state:', mongoose.connection.readyState);
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
});

module.exports = app;