const express = require('express');
const router = express.Router();

// ✅ Import Controller Functions
const { analyzeRepo, getRepoById, getRepoByUrl, refreshRepo } = require('../controllers/repoController');

// ✅ Import Chat Service
const { chatWithRepo } = require('../services/openrouterService');
const Repo = require('../models/Repo');

// Lightweight per-IP rate limiter (no extra dependency).
// Render terminates TLS and sets X-Forwarded-For; fall back to req.ip locally.
const createRateLimiter = (windowMs, max, message) => {
  const requests = new Map();

  return (req, res, next) => {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.ip) || 'unknown';
    const now = Date.now();

    let record = requests.get(ip);
    if (!record || now - record.start >= windowMs) {
      record = { start: now, count: 0 };
      requests.set(ip, record);
    }
    record.count += 1;

    if (requests.size > 1000) {
      for (const [key, value] of requests) {
        if (now - value.start >= windowMs) requests.delete(key);
      }
    }

    if (record.count > max) {
      return res.status(429).json({ message });
    }
    next();
  };
};

const analyzeLimiter = createRateLimiter(
  10 * 60 * 1000,
  10,
  'Too many analysis requests. Please try again in 10 minutes.'
);
const chatLimiter = createRateLimiter(
  10 * 60 * 1000,
  30,
  'Too many chat messages. Please try again in 10 minutes.'
);

// --- ROUTES ---

// 1. Analyze Repository
router.post('/analyze', analyzeLimiter, analyzeRepo);

// 2. Get Repo by ID
router.get('/:id', getRepoById);

// 3. Get Repo by URL
router.get('/url/:url', getRepoByUrl);

// 4. Refresh Cache
router.post('/refresh', analyzeLimiter, refreshRepo);

// 5. NEW: Chat with Repo
router.post('/chat', chatLimiter, async (req, res) => {
  try {
    const { repoUrl, message, model } = req.body;

    if (!repoUrl || !message) {
      return res.status(400).json({ message: 'Repo URL and message are required' });
    }

    // Fetch repo data from DB
    const repoData = await Repo.findOne({ repoUrl });
    if (!repoData) {
      return res.status(404).json({ message: 'Repository not analyzed yet. Please analyze first.' });
    }

    // Call AI Service
    const reply = await chatWithRepo(repoData, message, model);

    res.json({ reply });

  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ message: error.message || 'Failed to process chat' });
  }
});

// ✅ Export the Router
module.exports = router;