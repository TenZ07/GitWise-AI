const Repo = require('../models/Repo');
const { fetchRepoData, fetchFileContent } = require('../services/githubService');
const { identifyCriticalFiles, analyzeCodeWithGroq } = require('../services/groqService');

// ✅ HELPER: Clean summary text (remove improvement suggestions)
const cleanSummaryText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .split('\n')
    .filter(line => {
      const lowerLine = line.toLowerCase().trim();
      // ❌ Filter out improvement suggestions
      if (lowerLine.match(/^(refactor|implement|add|extract|use|fix|update|create|ensure|consider|should|could|would)/i)) return false;
      if (lowerLine.includes('(file:')) return false;
      if (lowerLine.includes('suggestion')) return false;
      if (lowerLine.includes('improve')) return false;
      if (lowerLine.includes('recommend')) return false;
      // ✅ Keep only descriptive text
      return line.trim().length > 20;
    })
    .join(' ')
    .trim();
};

exports.analyzeRepo = async (req, res) => {
  console.log('🚀 [CONTROLLER] 1. Function Entered');
  
  try {
    console.log('📦 [CONTROLLER] 2. Request Body:', JSON.stringify(req.body));
    const { repoUrl } = req.body;
    
    if (!repoUrl || typeof repoUrl !== 'string') {
      console.error('❌ [CONTROLLER] 3. Validation Failed: No URL');
      return res.status(400).json({ message: 'Valid Repository URL is required' });
    }

    console.log(`🔍 [CONTROLLER] 4. Starting DEEP analysis for: ${repoUrl}`);

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

    // 14. 🤖 GROQ STEP 1: Identify Critical Files
    console.log('🤖 [CONTROLLER] 14. Groq: Identifying critical files...');
    let criticalFiles;
    try {
      criticalFiles = await identifyCriticalFiles(githubData.fileTree, githubData.basicInfo);
      console.log(`✅ [CONTROLLER] 15. Groq selected ${criticalFiles.length} critical files`);
    } catch (error) {
      console.error('⚠️ [CONTROLLER] Groq file selection failed, using fallback');
      criticalFiles = githubData.fileTree
        .filter(f => f.type === 'file' && f.path.match(/\.(js|ts|jsx|tsx|py)$/i))
        .slice(0, 10)
        .map(f => f.path);
    }

    // 16. Fetch Actual Code Content for Critical Files
    console.log('📦 [CONTROLLER] 16. Fetching code contents for critical files...');
    const fileContents = [];
    for (const filePath of criticalFiles) {
      try {
        const file = await fetchFileContent(
          githubData.basicInfo.owner,
          githubData.basicInfo.repoName,
          filePath,
          githubData.basicInfo.defaultBranch
        );
        if (file && file.content) {
          fileContents.push(file);
        }
      } catch (error) {
        console.warn(`⚠️ Could not fetch ${filePath}: ${error.message}`);
      }
    }
    console.log(`✅ [CONTROLLER] 17. Fetched ${fileContents.length} file contents`);

    // 18. 🤖 GROQ STEP 2: Deep Code Analysis
    console.log('🤖 [CONTROLLER] 18. Groq: Analyzing actual CODE...');
    let groqAnalysis;
    try {
      groqAnalysis = await analyzeCodeWithGroq(fileContents, githubData.basicInfo);
      console.log('✅ [CONTROLLER] 19. Groq Code Analysis Complete');
    } catch (aiError) {
      console.error('❌ [CONTROLLER] 20. Groq Analysis Failed:', aiError.message);
      groqAnalysis = {
        functionalSummary: `This repository contains ${githubData.basicInfo.repoName}. ${githubData.basicInfo.description || 'A software project.'}`,
        targetAudienceAndUse: `This application is for users who need ${githubData.basicInfo.description || 'this functionality'}.`,
        codeQualityInsights: {
          strengths: ['Code structure appears organized'],
          weaknesses: ['Unable to perform deep analysis - API error'],
          codeSmells: []
        },
        securityConcerns: [],
        architecturePatterns: {
          detected: ['Standard architecture'],
          recommendations: ['Perform manual code review']
        },
        performanceIssues: [],
        bestPractices: {
          followed: [],
          missing: []
        },
        technicalDebt: ['Code analysis service temporarily unavailable'],
        improvements: ['Retry analysis after fixing API configuration']
      };
    }

    // 21. ✅ CLEAN Summaries (Remove improvement text)
    let functionalSummary = groqAnalysis.functionalSummary || '';
    functionalSummary = cleanSummaryText(functionalSummary);
    
    // Fallback if cleaned summary is too short
    if (functionalSummary.length < 50) {
      functionalSummary = githubData.basicInfo.description 
        ? `This repository contains ${githubData.basicInfo.repoName}. ${githubData.basicInfo.description}`
        : `This repository hosts ${githubData.basicInfo.repoName}. Built with ${Object.keys(githubData.basicInfo.languages || {}).join(', ') || 'web technologies'}.`;
    }

    let targetAudienceAndUse = groqAnalysis.targetAudienceAndUse || '';
    targetAudienceAndUse = cleanSummaryText(targetAudienceAndUse);
    
    // Fallback if cleaned summary is too short
    if (targetAudienceAndUse.length < 50) {
      targetAudienceAndUse = `Used by developers and end users working with ${Object.keys(githubData.basicInfo.languages || {}).join(', ') || 'web technologies'}.`;
    }

    // ✅ 22. Format Improvements - NO DUPLICATION WITH WEAKNESSES
    const improvements = [];

    // 1. Add ONLY from groqAnalysis.improvements array (if exists) - These are actionable suggestions
    if (groqAnalysis.improvements && Array.isArray(groqAnalysis.improvements)) {
      groqAnalysis.improvements.slice(0, 4).forEach(imp => {
        improvements.push(`Improvement: ${imp}`);
      });
    }

    // 2. Add Security Concerns (these are actionable with file references)
    if (groqAnalysis.securityConcerns && groqAnalysis.securityConcerns.length > 0) {
      groqAnalysis.securityConcerns.slice(0, 2).forEach(s => {
        improvements.push(`Security: ${s.issue} (File: ${s.file || 'N/A'})`);
      });
    }

    // 3. Add Performance Issues (these are actionable with file references)
    if (groqAnalysis.performanceIssues && groqAnalysis.performanceIssues.length > 0) {
      groqAnalysis.performanceIssues.slice(0, 2).forEach(p => {
        improvements.push(`Performance: ${p.issue} (File: ${p.file || 'N/A'})`);
      });
    }

    // 4. Add Technical Debt (if no other improvements)
    if (improvements.length < 4 && groqAnalysis.technicalDebt && groqAnalysis.technicalDebt.length > 0) {
      groqAnalysis.technicalDebt.slice(0, 2).forEach(t => {
        improvements.push(`Technical Debt: ${t}`);
      });
    }

    // Remove duplicates and limit to 6
    const uniqueImprovements = [...new Set(improvements)].slice(0, 6);

    // 23. Calculate Health Score based on Groq findings
    const securityIssues = groqAnalysis.securityConcerns?.filter(s => s.severity === 'HIGH')?.length || 0;
    const perfIssues = groqAnalysis.performanceIssues?.filter(p => p.impact === 'HIGH')?.length || 0;
    const weaknesses = groqAnalysis.codeQualityInsights?.weaknesses?.length || 0;
    
    const codeHealthScore = Math.max(0, Math.min(100, 
      100 - (securityIssues * 20) - (perfIssues * 10) - (weaknesses * 5)
    ));

    // 24. Save ALL Data to DB
    console.log('💾 [CONTROLLER] 24. Saving to Database...');
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
      
      // ✅ CLEANED Standard Fields
      functionalSummary,
      targetAudienceAndUse,
      techStack: Object.keys(githubData.basicInfo.languages || {}),
      codeHealthScore,
      improvements: uniqueImprovements, // ✅ No duplication with weaknesses
      
      // ✅ GROQ DEEP ANALYSIS FIELDS (Weaknesses stay separate)
      codeQualityInsights: groqAnalysis.codeQualityInsights,
      securityConcerns: groqAnalysis.securityConcerns,
      architecturePatterns: groqAnalysis.architecturePatterns,
      performanceIssues: groqAnalysis.performanceIssues,
      bestPractices: groqAnalysis.bestPractices,
      technicalDebt: groqAnalysis.technicalDebt,
      filesAnalyzed: fileContents.length,
      
      lastFetched: new Date()
    };

    const savedRepo = await Repo.findOneAndUpdate(
      { repoUrl },
      repoData,
      { upsert: true, returnDocument: 'after', runValidators: true }
    );

    console.log('✅ [CONTROLLER] 25. Analysis Complete & Saved.');
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

// Other exports
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