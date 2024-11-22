require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const fs = require('fs');
const connectDB = require('./config/db');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt=require('bcryptjs')
const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Utility for salting passwords
const salt = bcrypt.genSaltSync(10);

// **Routes**
// Register
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = bcrypt.hashSync(password, salt);
    const userDoc = await User.create({ username, password: hashedPassword });
    res.json(userDoc);
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userDoc = await User.findOne({ username });
    if (!userDoc) return res.status(400).json('User not found');

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
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json('Internal server error');
  }
});

// Profile
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
  const { token } = req.cookies;

  if (!token) return res.status(401).json('Not authenticated');
  if (!file) return res.status(400).json('No file uploaded');

  const { originalname, path } = file;
  const ext = originalname.split('.').pop();
  const newPath = `${path}.${ext}`;
  fs.renameSync(path, newPath);

  jwt.verify(token, JWT_SECRET, {}, async (err, userData) => {
    if (err) return res.status(403).json('Token invalid');

    const { title, summary, content } = req.body;
    try {
      const postDoc = await Post.create({
        title,
        summary,
        content,
        cover: newPath,
        author: userData.id,
      });
      res.json(postDoc);
    } catch (err) {
      console.error('Error creating post:', err);
      res.status(500).json('Failed to create post');
    }
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
    console.error('Error fetching posts:', err);
    res.status(500).json('Failed to fetch posts');
  }
});

// Get a specific post
app.get('/post/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Post.findById(id).populate('author', ['username']);
    if (!post) return res.status(404).json('Post not found');
    res.json(post);
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json('Failed to fetch post');
  }
});

// Update a post
app.put('/post/:id', upload.single('file'), async (req, res) => {
  const { id } = req.params;
  const { token } = req.cookies;

  if (!token) return res.status(401).json('Not authenticated');

  jwt.verify(token, JWT_SECRET, {}, async (err, userData) => {
    if (err) return res.status(403).json('Token invalid');

    try {
      const post = await Post.findById(id);
      if (!post) return res.status(404).json('Post not found');

      if (post.author.toString() !== userData.id) {
        return res.status(403).json('Not authorized');
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
    } catch (err) {
      console.error('Error updating post:', err);
      res.status(500).json('Failed to update post');
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
