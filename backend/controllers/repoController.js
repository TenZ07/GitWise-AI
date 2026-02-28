const Repo = require('../models/Repo');
const { fetchRepoData } = require('../services/githubService');
const { analyzeRepoWithAI } = require('../services/geminiService');

exports.analyzeRepo = async (req, res) => {
  console.log('🚀 [CONTROLLER] 1. Function Entered');
  
  try {
    // 2. Check Request Body
    console.log('📦 [CONTROLLER] 2. Request Body:', JSON.stringify(req.body));
    const { repoUrl } = req.body;
    
    if (!repoUrl || typeof repoUrl !== 'string') {
      console.error('❌ [CONTROLLER] 3. Validation Failed: No URL');
      return res.status(400).json({ message: 'Valid Repository URL is required' });
    }

    console.log(`🔍 [CONTROLLER] 4. Starting analysis for: ${repoUrl}`);

    // 5. Check Cache Logic
    const { force } = req.query;
    let skipCache = false;
    if (force === 'true') {
      skipCache = true;
      console.log('⏩ [CONTROLLER] 5. Force Refresh requested.');
    }

    if (!skipCache) {
      console.log('⏳ [CONTROLLER] 6. Checking Database for cache...');
      const existingRepo = await Repo.findOne({ repoUrl });
      
      if (existingRepo) {
        console.log('💾 [CONTROLLER] 7. Found existing record.');
        const now = new Date();
        const lastFetched = new Date(existingRepo.lastFetched);
        const hoursSinceFetch = (now - lastFetched) / (1000 * 60 * 60);

        if (hoursSinceFetch < 24 && existingRepo.functionalSummary) {
          console.log(`✅ [CONTROLLER] 8. Cache Hit! (${hoursSinceFetch.toFixed(2)}h old). Returning cached data.`);
          return res.json({ 
            message: 'Data retrieved from cache', 
            existingRepo,
            cached: true 
          });
        }
        console.log(`⏳ [CONTROLLER] 9. Cache Expired. Re-fetching...`);
      } else {
        console.log('🆕 [CONTROLLER] 10. No existing record found. Fresh analysis.');
      }
    }

    // 11. Fetch from GitHub
    console.log('🔄 [CONTROLLER] 11. Calling GitHub Service...');
    let githubData;
    try {
      githubData = await fetchRepoData(repoUrl);
      console.log('✅ [CONTROLLER] 12. GitHub Data Received. Owner:', githubData.basicInfo.owner);
    } catch (ghError) {
      console.error('❌ [CONTROLLER] 13. GitHub Fetch Failed:', ghError.message);
      return res.status(502).json({ 
        message: 'Failed to fetch from GitHub',
        details: ghError.message 
      });
    }

    // 14. Run AI Analysis
    console.log('🤖 [CONTROLLER] 14. Calling AI Service...');
    let aiAnalysis;
    try {
      aiAnalysis = await analyzeRepoWithAI(githubData);
      console.log('✅ [CONTROLLER] 15. AI Analysis Received. Score:', aiAnalysis.codeHealthScore);
    } catch (aiError) {
      console.error('❌ [CONTROLLER] 16. AI Analysis Failed:', aiError.message);
      // Fallback AI data so we don't crash
      aiAnalysis = {
        functionalSummary: "AI service unavailable.",
        targetAudienceAndUse: "Could not generate use case.",
        techStack: Object.keys(githubData.basicInfo.languages || {}),
        codeHealthScore: 50,
        improvements: ["Retry analysis later."]
      };
    }

    // 17. Save to DB
    console.log('💾 [CONTROLLER] 17. Saving to Database...');
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
      functionalSummary: aiAnalysis.functionalSummary,
      targetAudienceAndUse: aiAnalysis.targetAudienceAndUse,
      techStack: aiAnalysis.techStack,
      codeHealthScore: aiAnalysis.codeHealthScore,
      improvements: aiAnalysis.improvements,
      riskAssessment: aiAnalysis.riskAssessment,
      architectureAssessment: aiAnalysis.architectureAssessment
    };

    const savedRepo = await Repo.findOneAndUpdate(
      { repoUrl },
      repoData,
      { upsert: true, returnDocument: 'after', runValidators: true }
    );

    console.log('✅ [CONTROLLER] 18. Analysis Complete & Saved.');
    res.json({ 
      message: 'Repository analyzed successfully', 
      savedRepo,
      cached: false,
      forceRefreshed: force === 'true'
    });

  } catch (error) {
    console.error('💥 [CONTROLLER] CRITICAL ERROR:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Other exports (keep your existing ones)
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