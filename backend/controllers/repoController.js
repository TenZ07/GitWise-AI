const Repo = require('../models/Repo');
const { fetchRepoData } = require('../services/githubService');
const { analyzeRepoWithAI } = require('../services/geminiService');

exports.analyzeRepo = async (req, res) => {
  try {
    const { repoUrl } = req.body;
    const { force } = req.query; // Get 'force' query param (e.g., ?force=true)

    if (!repoUrl || typeof repoUrl !== 'string') {
      return res.status(400).json({ message: 'Valid Repository URL is required' });
    }

    console.log(`🔍 Starting analysis for: ${repoUrl} ${force === 'true' ? '(Force Refresh)' : ''}`);

    // 1. Check Cache ONLY if force is NOT true
    const existingRepo = await Repo.findOne({ repoUrl });
    
    let skipCache = false;
    if (force === 'true') {
      skipCache = true;
      console.log('⏩ Force refresh requested. Skipping cache check.');
    }

    if (!skipCache && existingRepo) {
      const now = new Date();
      const lastFetched = new Date(existingRepo.lastFetched);
      const hoursSinceFetch = (now - lastFetched) / (1000 * 60 * 60);

      if (hoursSinceFetch < 24 && existingRepo.aiSummary) {
        console.log(`✅ Cache hit! Data is ${hoursSinceFetch.toFixed(2)} hours old.`);
        return res.json({ 
          message: 'Data retrieved from cache', 
          data: existingRepo,
          cached: true 
        });
      }
      console.log(`⏳ Cache expired (${hoursSinceFetch.toFixed(2)}h old). Re-analyzing...`);
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
      aiAnalysis = {
        functionalSummary: "AI analysis temporarily unavailable.",
        targetAudienceAndUse: "Could not generate use case.",
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
      fileTree: githubData.fileTree,
      
      // AI Generated Fields
      aiSummary: aiAnalysis.summary, // Keep legacy key just in case
      functionalSummary: aiAnalysis.functionalSummary,
      targetAudienceAndUse: aiAnalysis.targetAudienceAndUse,
      techStack: aiAnalysis.techStack,
      codeHealthScore: aiAnalysis.codeHealthScore,
      improvements: aiAnalysis.improvements,
      generatedDocs: null
    };

    // 5. Save or Update in DB
    const savedRepo = await Repo.findOneAndUpdate(
      { repoUrl },
      repoData,
      { 
        upsert: true,
        new: true,
        runValidators: true 
      }
    );

    console.log(`✅ Analysis complete for ${repoUrl}. Saved to DB.`);

    res.json({ 
      message: 'Repository analyzed successfully', 
      data: savedRepo,
      cached: false,
      forceRefreshed: force === 'true'
    });

  } catch (error) {
    console.error('❌ Controller Critical Error:', error);
    res.status(500).json({ 
      message: 'Internal server error during analysis',
      error: error.message 
    });
  }
};

exports.getRepoById = async (req, res) => {
  try {
    const { id } = req.params;
    const repo = await Repo.findById(id);
    if (!repo) return res.status(404).json({ message: 'Repository not found' });
    res.json(repo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRepoByUrl = async (req, res) => {
  try {
    const { url } = req.params;
    const repo = await Repo.findOne({ repoUrl: decodeURIComponent(url) });
    if (!repo) return res.status(404).json({ message: 'Repository not found in cache' });
    res.json(repo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.refreshRepo = async (req, res) => {
  try {
    const { repoUrl } = req.body;
    await Repo.findOneAndDelete({ repoUrl });
    res.json({ message: 'Cache cleared. Please request analysis again.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};