const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const scoreRoutes = require('./routes/scores');
const authMiddleware = require('./middleware/auth');

const app = express();

app.disable('etag');

// Allow your local Angular app and deployed Vercel app
// to call the backend.
app.use(cors());

// Parse JSON request bodies.
app.use(express.json());

// API routes.
app.use('/api/auth', authRoutes);
app.use('/api/scores', scoreRoutes);

// Protected test route.
app.get(
  '/api/protected-test',
  authMiddleware,
  (req, res) => {
    res.json({
      message: 'You are authenticated!',
      userId: req.userId,
    });
  }
);

// Health-check route for Render.
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
  });
});

// Root route.
app.get('/', (req, res) => {
  res.send('API is running');
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error(
      'MongoDB connection error:',
      error
    );

    process.exit(1);
  });