const Repo = require('../models/Repo');
const { fetchRepoData } = require('../services/githubService');

/**
 * Analyze a repository
 * 1. Check cache
 * 2. If miss, fetch from GitHub
 * 3. Save to DB (AI analysis will happen in next step)
 */
exports.analyzeRepo = async (req, res) => {
  try {
    const { repoUrl } = req.body;

    if (!repoUrl) {
      return res.status(400).json({ message: 'Repository URL is required' });
    }

    // 1. Check Cache (Simple check: does doc exist?)
    // In a real prod app, we'd check lastFetched < 24h here strictly
    const existingRepo = await Repo.findOne({ repoUrl });
    
    if (existingRepo) {
      // Calculate time difference
      const hoursSinceFetch = (Date.now() - new Date(existingRepo.lastFetched)) / (1000 * 60 * 60);
      
      if (hoursSinceFetch < 24) {
        console.log('✅ Cache hit! Returning stored data.');
        return res.json({ 
          message: 'Data retrieved from cache', 
          data: existingRepo,
          cached: true 
        });
      }
      
      // If older than 24h, we could delete it or update it. 
      // For now, let's just update it below.
      console.log('⏳ Cache expired. Fetching fresh data...');
    }

    // 2. Fetch Fresh Data from GitHub
    const githubData = await fetchRepoData(repoUrl);

    // 3. Prepare Data for Saving (AI fields will be empty for now)
    const repoData = {
      repoUrl,
      owner: githubData.basicInfo.owner,
      repoName: githubData.basicInfo.repoName,
      description: githubData.basicInfo.description,
      stars: githubData.basicInfo.stars,
      forks: githubData.basicInfo.forks,
      languages: githubData.basicInfo.languages,
      contributors: githubData.contributors,
      recentCommits: githubData.recentCommits,
      // AI fields initialized as empty/null
      aiSummary: null,
      techStack: [],
      codeHealthScore: null,
      improvements: [],
      generatedDocs: null,
      fileTree: githubData.fileTree // Storing file tree for AI context later
    };

    // 4. Save or Update in DB
    const savedRepo = await Repo.findOneAndUpdate(
      { repoUrl },
      repoData,
      { upsert: true, new: true }
    );

    res.json({ 
      message: 'Repository analyzed successfully', 
      data: savedRepo,
      cached: false 
    });

  } catch (error) {
    console.error('Controller Error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Repo Summary (Helper for frontend)
 */
exports.getRepo = async (req, res) => {
  try {
    const { id } = req.params;
    const repo = await Repo.findById(id);
    if (!repo) return res.status(404).json({ message: 'Repo not found' });
    res.json(repo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};