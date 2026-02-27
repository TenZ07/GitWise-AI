const express = require('express');
const router = express.Router();
const { analyzeRepo, getRepoById, getRepoByUrl, refreshRepo } = require('../controllers/repoController');
const { chatWithRepo } = require('../services/openrouterService');
const Repo = require('../models/Repo');

// Existing Routes
router.post('/analyze', analyzeRepo);
router.get('/:id', getRepoById);
router.get('/url/:url', getRepoByUrl);
router.post('/refresh', refreshRepo);

// ✅ NEW CHAT ROUTE
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

    // Get AI Response
    const reply = await chatWithRepo(repoData, message, model);

    res.json({ reply });

  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;