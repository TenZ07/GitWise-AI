const express = require('express');
const router = express.Router();
const { 
  analyzeRepo, 
  getRepoById, 
  getRepoByUrl, 
  refreshRepo 
} = require('../controllers/repoController');

// POST /api/repo/analyze -> Analyze a new repo
router.post('/analyze', analyzeRepo);

// GET /api/repo/:id -> Get repo by MongoDB ID
router.get('/:id', getRepoById);

// GET /api/repo/url/:url -> Get repo by URL (optional helper)
// Note: If you want to use this, ensure the URL is encoded in the request
router.get('/url/:url', getRepoByUrl);

// POST /api/repo/refresh -> Force clear cache and re-analyze
router.post('/refresh', refreshRepo);

module.exports = router;