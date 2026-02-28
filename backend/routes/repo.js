const express = require('express');
const router = express.Router();

// ✅ Import Controller Functions
const { analyzeRepo, getRepoById, getRepoByUrl, refreshRepo } = require('../controllers/repoController');

// ✅ Import Chat Service
const { chatWithRepo } = require('../services/openrouterService');
const Repo = require('../models/Repo');

// --- ROUTES ---

// 1. Analyze Repository
router.post('/analyze', analyzeRepo);

// 2. Get Repo by ID
router.get('/:id', getRepoById);

// 3. Get Repo by URL
router.get('/url/:url', getRepoByUrl);

// 4. Refresh Cache
router.post('/refresh', refreshRepo);

// 5. NEW: Chat with Repo
router.post('/chat', async (req, res) => {
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