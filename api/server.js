const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Models
const User = require('./models/User');
const Post = require('./models/Post');

const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const UPLOAD_DIR = 'uploads/';

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Middleware
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(cookieParser());
app.use(`/${UPLOAD_DIR}`, express.static(__dirname + `/${UPLOAD_DIR}`));

// Multer configuration for file uploads
const upload = multer({ dest: UPLOAD_DIR });

// Constants
const salt = bcrypt.genSaltSync(10);

// Routes

// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, salt);
    const userDoc = await User.create({ username, password: hashedPassword });
    res.json(userDoc);
  } catch (err) {
    console.error(err);
    res.status(400).json('Registration failed');
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  if (!userDoc) {
    return res.status(400).json('User not found');
  }
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    jwt.sign({ id: userDoc._id, username }, JWT_SECRET, {}, (err, token) => {
      if (err) throw err;
      res.cookie('token', token, { httpOnly: true }).json({
        id: userDoc._id,
        username,
      });
    });
  } else {
    res.status(400).json('Wrong credentials');
  }
});

// Profile (to check user authentication)
app.get('/profile', (req, res) => {
  const { token } = req.cookies;
  if (!token) return res.status(401).json('Not authenticated');

  jwt.verify(token, JWT_SECRET, {}, (err, userData) => {
    if (err) return res.status(403).json('Token invalid');
    res.json(userData);
  });
});

// Logout
app.post('/logout', (req, res) => {
  res.cookie('token', '', { maxAge: 0 }).json('Logged out');
});

// Create a post
app.post('/post', upload.single('file'), (req, res) => {
  const { file } = req;
  if (!file) return res.status(400).json('No file uploaded');

  const { originalname, path } = file;
  const ext = originalname.split('.').pop();
  const newPath = `${path}.${ext}`;
  fs.renameSync(path, newPath);

  const { token } = req.cookies;
  if (!token) return res.status(401).json('Not authenticated');

  jwt.verify(token, JWT_SECRET, {}, async (err, userData) => {
    if (err) return res.status(403).json('Token invalid');

    const { title, summary, content } = req.body;
    const postDoc = await Post.create({
      title,
      summary,
      content,
      cover: newPath,
      author: userData.id,
    });
    res.json(postDoc);
  });
});

// Get all posts
app.get('/post', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', ['username'])
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json('Error fetching posts');
  }
});

// Get a specific post by ID
app.get('/post/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id).populate('author', ['username']);
    if (!post) return res.status(404).json('Post not found');
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json('Error fetching post');
  }
});

// Update a post
app.put('/post/:id', upload.single('file'), async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;
  
  if (!token) return res.status(401).json('Not authenticated');

  jwt.verify(token, JWT_SECRET, {}, async (err, userData) => {
    if (err) return res.status(403).json('Token invalid');

    const post = await Post.findById(id);
    if (!post) return res.status(404).json('Post not found');

    if (post.author.toString() !== userData.id) {
      return res.status(403).json('You are not authorized to update this post');
    }

    const { title, summary, content } = req.body;

    let newCover = post.cover;
    if (req.file) {
      const { originalname, path } = req.file;
      const ext = originalname.split('.').pop();
      newCover = `${path}.${ext}`;
      fs.renameSync(path, newCover);
    }

    post.title = title;
    post.summary = summary;
    post.content = content;
    post.cover = newCover;

    await post.save();
    res.json(post);
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
