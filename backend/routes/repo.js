const express = require('express');
const router = express.Router();
const { analyzeRepo, getRepo } = require('../controllers/repoController');

// POST /api/repo/analyze
router.post('/analyze', analyzeRepo);

// GET /api/repo/:id
router.get('/:id', getRepo);

module.exports = router;