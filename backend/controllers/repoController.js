const Repo = require('../models/Repo');
const { fetchRepoData } = require('../services/githubService');
const { analyzeRepoWithAI } = require('../services/geminiService');

/**
 * Analyze a repository:
 * 1. Check cache (valid for 24 hours).
 * 2. If miss, fetch data from GitHub.
 * 3. Send data to Gemini AI for analysis.
 * 4. Save results to MongoDB.
 */
exports.analyzeRepo = async (req, res) => {
  try {
    const { repoUrl } = req.body;

    // Validation
    if (!repoUrl || typeof repoUrl !== 'string') {
      return res.status(400).json({ message: 'Valid Repository URL is required' });
    }

    console.log(`🔍 Starting analysis for: ${repoUrl}`);

    // 1. Check Cache
    const existingRepo = await Repo.findOne({ repoUrl });
    
    if (existingRepo) {
      const now = new Date();
      const lastFetched = new Date(existingRepo.lastFetched);
      const hoursSinceFetch = (now - lastFetched) / (1000 * 60 * 60);

      // If data is less than 24 hours old AND has AI summary, return cache
      if (hoursSinceFetch < 24 && existingRepo.aiSummary) {
        console.log(`✅ Cache hit! Data is ${hoursSinceFetch.toFixed(2)} hours old.`);
        return res.json({ 
          message: 'Data retrieved from cache', 
          data: existingRepo,
          cached: true 
        });
      }
      
      console.log(`⏳ Cache expired (${hoursSinceFetch.toFixed(2)}h old) or incomplete. Re-analyzing...`);
    }

    // 2. Fetch Fresh Data from GitHub
    let githubData;
    try {
      console.log('🔄 Fetching data from GitHub API...');
      githubData = await fetchRepoData(repoUrl);
    } catch (ghError) {
      console.error('GitHub Fetch Failed:', ghError.message);
      return res.status(502).json({ 
        message: 'Failed to fetch data from GitHub. Please check the URL and your GitHub Token.',
        details: ghError.message 
      });
    }

    // 3. Run AI Analysis
    let aiAnalysis;
    try {
      console.log('🤖 Sending data to Gemini AI...');
      aiAnalysis = await analyzeRepoWithAI(githubData);
    } catch (aiError) {
      console.error('AI Analysis Failed:', aiError.message);
      // Fallback: Continue with basic data but mark AI fields as unavailable
      aiAnalysis = {
        summary: "AI analysis temporarily unavailable.",
        techStack: Object.keys(githubData.basicInfo.languages || {}),
        codeHealthScore: 50,
        improvements: ["Unable to generate specific suggestions at this time."]
      };
    }

    // 4. Prepare Full Data Object
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
      fileTree: githubData.fileTree, // Stored for future file-specific AI queries
      
      // AI Generated Fields
      aiSummary: aiAnalysis.summary,
      techStack: aiAnalysis.techStack,
      codeHealthScore: aiAnalysis.codeHealthScore,
      improvements: aiAnalysis.improvements,
      generatedDocs: null // Placeholder for future documentation generation
    };

    // 5. Save or Update in DB
    const savedRepo = await Repo.findOneAndUpdate(
      { repoUrl },
      repoData,
      { 
        upsert: true,       // Create if doesn't exist
        new: true,          // Return the updated document
        runValidators: true 
      }
    );

    console.log(`✅ Analysis complete for ${repoUrl}. Saved to DB.`);

    res.json({ 
      message: 'Repository analyzed successfully', 
      data: savedRepo,
      cached: false 
    });

  } catch (error) {
    console.error('❌ Controller Critical Error:', error);
    res.status(500).json({ 
      message: 'Internal server error during analysis',
      error: error.message 
    });
  }
};

/**
 * Get a specific repository by ID
 * Used for loading dashboard details without re-analyzing
 */
exports.getRepoById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const repo = await Repo.findById(id);
    
    if (!repo) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    res.json(repo);
  } catch (error) {
    console.error('Get Repo Error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get a specific repository by URL
 * Useful for checking status before analyzing
 */
exports.getRepoByUrl = async (req, res) => {
  try {
    const { url } = req.params; // Expecting encoded URL
    
    const repo = await Repo.findOne({ repoUrl: decodeURIComponent(url) });
    
    if (!repo) {
      return res.status(404).json({ message: 'Repository not found in cache' });
    }

    res.json(repo);
  } catch (error) {
    console.error('Get Repo By URL Error:', error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Force refresh cache (Delete and re-analyze)
 */
exports.refreshRepo = async (req, res) => {
  try {
    const { repoUrl } = req.body;
    
    // Delete existing record
    await Repo.findOneAndDelete({ repoUrl });
    
    // Trigger analysis again (reusing logic would be better, but calling analyzeRepo directly is tricky in Express)
    // For now, we just confirm deletion and let the frontend call analyze again
    res.json({ message: 'Cache cleared. Please request analysis again.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};