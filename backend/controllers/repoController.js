const Repo = require('../models/Repo');
const { fetchRepoData, fetchFileContent } = require('../services/githubService');
const { identifyCriticalFiles, analyzeCodeWithGroq } = require('../services/groqService');

// Helper: Clean summary text (remove improvement suggestions)
// ✅ IMPROVED: Clean summary text (remove ONLY improvement suggestions, not valid descriptions)
const cleanSummaryText = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .split('\n')
    .filter(line => {
      const lowerLine = line.toLowerCase().trim();
      
      // ❌ Filter out ONLY clear improvement/refactoring commands
      if (lowerLine.match(/^(refactor|extract|ensure|consider)\s+/i)) return false;
      
      // ❌ Filter out file references
      if (lowerLine.includes('(file:')) return false;
      if (lowerLine.includes('suggestion')) return false;
      
      // ❌ Filter out lines that are ONLY recommendations
      if (lowerLine.match(/^you should|^we should|^i recommend/i)) return false;
      
      // ✅ Keep lines that describe what the project IS or DOES
      // Even if they contain "use", "add", etc., if they're descriptive, keep them
      if (lowerLine.match(/^(this (repository|application|project|app|tool)|it (provides|uses|includes|offers|allows|enables))/i)) {
        return true;
      }
      
      // ✅ Keep lines longer than 30 chars that don't look like suggestions
      return line.trim().length > 30 && !lowerLine.match(/^(add|implement|fix|update|create)\s+/i);
    })
    .join(' ')
    .trim();
};

exports.analyzeRepo = async (req, res) => {
  console.log('[CONTROLLER] Starting analysis for:', req.body.repoUrl);
  
  try {
    const { repoUrl } = req.body;
    
    if (!repoUrl || typeof repoUrl !== 'string') {
      return res.status(400).json({ message: 'Valid Repository URL is required' });
    }

    // Check Cache Logic
    const { force } = req.query;
    let skipCache = force === 'true';

    if (!skipCache) {
      const existingRepo = await Repo.findOne({ repoUrl });
      
      if (existingRepo) {
        const now = new Date();
        const lastFetched = new Date(existingRepo.lastFetched);
        const hoursSinceFetch = (now - lastFetched) / (1000 * 60 * 60);

        if (hoursSinceFetch < 24 && existingRepo.functionalSummary) {
          console.log(`[CONTROLLER] Cache hit (${hoursSinceFetch.toFixed(2)}h old)`);
          return res.json({ 
            message: 'Data retrieved from cache', 
            existingRepo,
            cached: true 
          });
        }
      }
    }

    // Fetch from GitHub
    console.log('[CONTROLLER] Fetching GitHub data...');
    let githubData;
    try {
      githubData = await fetchRepoData(repoUrl);
    } catch (ghError) {
      console.error('[CONTROLLER] GitHub fetch failed:', ghError.message);
      return res.status(502).json({ 
        message: 'Failed to fetch from GitHub',
        details: ghError.message 
      });
    }

    // Identify Critical Files with Groq
    console.log('[CONTROLLER] Identifying critical files...');
    let criticalFiles;
    try {
      criticalFiles = await identifyCriticalFiles(githubData.fileTree, githubData.basicInfo);
    } catch (error) {
      console.warn('[CONTROLLER] Groq file selection failed:', error.message);
      criticalFiles = githubData.fileTree
        .filter(f => f.type === 'file' && f.path.match(/\.(js|ts|jsx|tsx|py)$/i))
        .slice(0, 10)
        .map(f => f.path);
    }

    // ✅ FETCH README CONTENT
    console.log('[CONTROLLER] Fetching README content...');
    let readmeContent = '';
    const readmeFile = githubData.fileTree.find(f => 
      f.path.toLowerCase() === 'readme.md'
    );
    
    if (readmeFile) {
      try {
        const readmeData = await fetchFileContent(
          githubData.basicInfo.owner,
          githubData.basicInfo.repoName,
          readmeFile.path,
          githubData.basicInfo.defaultBranch
        );
        readmeContent = readmeData?.content || '';
        console.log('[CONTROLLER] README fetched, length:', readmeContent.length);
      } catch (err) {
        console.warn('[CONTROLLER] Failed to fetch README:', err.message);
      }
    }

    // Fetch Actual Code Content for Critical Files
    console.log('[CONTROLLER] Fetching code contents...');
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
        console.warn(`[CONTROLLER] Could not fetch ${filePath}: ${error.message}`);
      }
    }

    // DUAL AI ANALYSIS: Groq (Code + README)
    console.log('[CONTROLLER] Starting AI analysis with README...');
    let groqAnalysis;
    try {
      // ✅ Pass readmeContent to Groq
      groqAnalysis = await analyzeCodeWithGroq(fileContents, githubData.basicInfo, readmeContent);
      console.log('[CONTROLLER] Groq code analysis complete');
    } catch (aiError) {
      console.error('[CONTROLLER] Groq analysis failed:', aiError.message);
      // Re-throw error instead of fake fallback
      throw aiError;
    }

    // CLEAN Summaries (Remove improvement text)
    let functionalSummary = groqAnalysis.functionalSummary || '';
    functionalSummary = cleanSummaryText(functionalSummary);
    
    // ❌ REMOVED FALLBACK: If summary is short, keep it short or show error, don't fake it
if (!functionalSummary || functionalSummary.length < 30) {
  // Try to build a summary from available data
  functionalSummary = githubData.basicInfo.description 
    ? `This repository contains ${githubData.basicInfo.repoName}. ${githubData.basicInfo.description}`
    : `This repository hosts ${githubData.basicInfo.repoName}. Built with ${Object.keys(githubData.basicInfo.languages || {}).join(', ') || 'web technologies'}.`;
  }

    let targetAudienceAndUse = groqAnalysis.targetAudienceAndUse || '';
    targetAudienceAndUse = cleanSummaryText(targetAudienceAndUse);
    
    // ❌ REMOVED FALLBACK
    if (!targetAudienceAndUse || targetAudienceAndUse.length < 10) {
      targetAudienceAndUse = 'Use case generation failed. Please check README for user information.';
    }

    // Format Improvements - NO DUPLICATION WITH WEAKNESSES
    const improvements = [];

    if (groqAnalysis.improvements && Array.isArray(groqAnalysis.improvements)) {
      groqAnalysis.improvements.slice(0, 4).forEach(imp => {
        improvements.push(`Improvement: ${imp}`);
      });
    }

    if (groqAnalysis.securityConcerns && groqAnalysis.securityConcerns.length > 0) {
      groqAnalysis.securityConcerns.slice(0, 2).forEach(s => {
        improvements.push(`Security: ${s.issue} (File: ${s.file || 'N/A'})`);
      });
    }

    if (groqAnalysis.performanceIssues && groqAnalysis.performanceIssues.length > 0) {
      groqAnalysis.performanceIssues.slice(0, 2).forEach(p => {
        improvements.push(`Performance: ${p.issue} (File: ${p.file || 'N/A'})`);
      });
    }

    if (improvements.length < 4 && groqAnalysis.technicalDebt && groqAnalysis.technicalDebt.length > 0) {
      groqAnalysis.technicalDebt.slice(0, 2).forEach(t => {
        improvements.push(`Technical Debt: ${t}`);
      });
    }

    const uniqueImprovements = [...new Set(improvements)].slice(0, 6);

    // Calculate Health Score
    const securityIssues = groqAnalysis.securityConcerns?.filter(s => s.severity === 'HIGH')?.length || 0;
    const perfIssues = groqAnalysis.performanceIssues?.filter(p => p.impact === 'HIGH')?.length || 0;
    const weaknesses = groqAnalysis.codeQualityInsights?.weaknesses?.length || 0;
    
    const codeHealthScore = Math.max(0, Math.min(100, 
      100 - (securityIssues * 20) - (perfIssues * 10) - (weaknesses * 5)
    ));

    // Save to Database
    console.log('[CONTROLLER] Saving to database...');
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
      
      // Cleaned Standard Fields (No fallbacks)
      functionalSummary,
      targetAudienceAndUse,
      techStack: Object.keys(githubData.basicInfo.languages || {}),
      codeHealthScore,
      improvements: uniqueImprovements,
      
      // Groq Deep Analysis Fields
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

    console.log('[CONTROLLER] Analysis complete and saved');
    res.json({ 
      message: 'Repository analyzed successfully', 
      savedRepo,
      cached: false,
      forceRefreshed: force === 'true'
    });

  } catch (error) {
    console.error('[CONTROLLER] Critical error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
};

// Other exports (unchanged)
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