const { getGeminiModel } = require('../config/gemini');
const { identifyCriticalFiles, analyzeCodeWithGroq } = require('./groqService');
const { fetchMultipleFiles } = require('./githubService');

const analyzeRepoWithAI = async (repoData) => {
  try {
    const model = getGeminiModel();

    // 1. Prepare Context
    const topLanguages = Object.entries(repoData.basicInfo.languages || {})
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([lang]) => lang)
      .join(', ');

    const filePaths = repoData.fileTree
      .filter(f => f.type === 'file')
      .slice(0, 50)
      .map(f => f.path)
      .join('\n- ');

    const recentCommitsContext = repoData.recentCommits.map(c => 
      `- [${c.sha}] ${c.message} by ${c.author}`
    ).join('\n');

    // 🆕 2. GROQ CODE ANALYSIS - Identify and analyze critical files
    let codeAnalysis = null;
    let analyzedFiles = [];
    
    try {
      console.log('🤖 Starting Groq code analysis...');
      console.log(`📊 Repository has ${repoData.fileTree.length} items in file tree`);
      
      // Step 1: Identify critical files using Groq AI
      const criticalFiles = await identifyCriticalFiles(
        repoData.fileTree,
        repoData.basicInfo
      );
      
      if (criticalFiles.length === 0) {
        console.log('⚠️ No critical files identified, skipping code analysis');
      } else {
        console.log(`📋 Critical files identified: ${criticalFiles.join(', ')}`);
        
        // Step 2: Fetch actual file contents from GitHub
        const fileContents = await fetchMultipleFiles(
          repoData.basicInfo.owner,
          repoData.basicInfo.repoName,
          criticalFiles
        );
        
        analyzedFiles = fileContents.map(f => f.path);
        
        // Step 3: Analyze code with Groq AI
        if (fileContents.length > 0) {
          console.log(`📝 Fetched ${fileContents.length} files, starting analysis...`);
          codeAnalysis = await analyzeCodeWithGroq(fileContents, repoData.basicInfo);
          console.log('✅ Groq code analysis completed successfully');
        } else {
          console.log('⚠️ No files fetched for analysis');
        }
      }
      
    } catch (groqError) {
      console.error('⚠️ Groq analysis failed, continuing with basic analysis:');
      console.error('Error:', groqError.message);
      console.error('Stack:', groqError.stack);
    }

    const context = `
      REPO: ${repoData.basicInfo.owner}/${repoData.basicInfo.repoName}
      DESCRIPTION: ${repoData.basicInfo.description || 'No description provided'}
      LANGUAGES: ${topLanguages}
      
      FILE PATHS FOUND IN REPO:
      - ${filePaths}
      
      RECENT COMMIT HISTORY:
      ${recentCommitsContext}
      
      ${codeAnalysis ? `
      DEEP CODE ANALYSIS (Groq AI):
      Files Analyzed: ${analyzedFiles.join(', ')}
      
      Code Quality:
      - Strengths: ${codeAnalysis.codeQualityInsights?.strengths?.join(', ') || 'N/A'}
      - Weaknesses: ${codeAnalysis.codeQualityInsights?.weaknesses?.join(', ') || 'N/A'}
      
      Security Concerns: ${codeAnalysis.securityConcerns?.length || 0} issues found
      Performance Issues: ${codeAnalysis.performanceIssues?.length || 0} issues found
      Architecture Patterns: ${codeAnalysis.architecturePatterns?.detected?.join(', ') || 'N/A'}
      ` : ''}
    `;

    // 3. REFINED PROFESSIONAL PROMPT
    const prompt = `
YOU ARE A PRINCIPAL SOFTWARE ARCHITECT PERFORMING A PROFESSIONAL CODE REVIEW.

Analyze the repository context carefully. ${codeAnalysis ? 'Deep code analysis has been performed on critical files.' : 'Provide the best possible analysis based on available metadata.'}

RETURN A STRICT RAW JSON OBJECT. NO MARKDOWN. NO TEXT OUTSIDE JSON.

JSON STRUCTURE (MUST MATCH EXACTLY):
{
  "functionalSummary": "Detailed explanation of HOW the system works technically. Mention backend/frontend structure, data flow, and key patterns. ${codeAnalysis ? 'Reference the analyzed code files.' : 'If code is minimal, describe the intended architecture based on file structure.'}",
  "targetAudienceAndUse": "Clear non-technical explanation of WHO this is for and WHAT problem it solves.",
  "techStack": ["List", "Every", "Major", "Technology", "Detected"],
  "architectureAssessment": {
    "pattern": "e.g., MVC, Component-Based, Monolithic",
    "strengths": ["Strength 1", "Strength 2"],
    "weaknesses": ["Weakness 1", "Weakness 2"]
  },
  "codeHealthScore": {
    "score": 0,
    "justification": "Explain why this score was given. ${codeAnalysis ? 'Consider the code quality insights from deep analysis.' : ''}"
  },
  "riskAssessment": [
    { "issue": "Risk description", "severity": "LOW|MEDIUM|HIGH", "fileReference": "path/to/file", "reason": "Why it's risky" }
  ],
  "improvements": [
    { "title": "Short title", "description": "Detailed actionable step", "fileReference": "path/to/file", "priority": "LOW|MEDIUM|HIGH" }
  ]
}

STRICT REQUIREMENTS:
1. You MUST reference real file paths from the list above.
2. Do NOT leave 'functionalSummary' or 'targetAudienceAndUse' empty. Infer from README if source code is missing.
3. Score must be realistic (0-100). ${codeAnalysis ? 'Adjust based on code quality findings.' : ''}
4. Be analytical and critical.
5. Give 6 improvements.
${codeAnalysis ? '6. Incorporate security concerns and performance issues from code analysis into riskAssessment.' : ''}

REPOSITORY CONTEXT:
${context}
`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // Clean up markdown
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      responseText = responseText.substring(jsonStart, jsonEnd + 1);
    }

    let aiData = JSON.parse(responseText);

    // ---------------------------------------------------------
    // 🛡️ CRITICAL: FLATTEN SCORE & FORMAT IMPROVEMENTS
    // ---------------------------------------------------------

    // 1. Flatten Score Object to Number
    let finalScore = 50;
    if (aiData.codeHealthScore) {
      if (typeof aiData.codeHealthScore === 'object' && aiData.codeHealthScore.score !== undefined) {
        finalScore = parseInt(aiData.codeHealthScore.score, 10);
        aiData.scoreJustification = aiData.codeHealthScore.justification;
      } else if (typeof aiData.codeHealthScore === 'number') {
        finalScore = aiData.codeHealthScore;
      }
    }
    
    // Adjust score based on code analysis if available
    if (codeAnalysis) {
      const securityIssues = codeAnalysis.securityConcerns?.length || 0;
      const performanceIssues = codeAnalysis.performanceIssues?.length || 0;
      
      // Deduct points for issues
      if (securityIssues > 0) finalScore -= Math.min(securityIssues * 5, 20);
      if (performanceIssues > 0) finalScore -= Math.min(performanceIssues * 3, 15);
      
      finalScore = Math.max(0, Math.min(100, finalScore)); // Clamp between 0-100
    }
    
    aiData.codeHealthScore = finalScore || 50;

    // 2. Convert Improvements Objects to Strings (for current UI)
    if (aiData.improvements && Array.isArray(aiData.improvements)) {
      aiData.improvements = aiData.improvements.map(imp => {
        if (typeof imp === 'string') return imp;
        return `${imp.title || 'Improvement'}: ${imp.description || 'No details'} ${imp.fileReference ? `(File: ${imp.fileReference})` : ''}`;
      });
      
      // Add code-specific improvements from Groq analysis
      if (codeAnalysis) {
        if (codeAnalysis.securityConcerns && codeAnalysis.securityConcerns.length > 0) {
          codeAnalysis.securityConcerns.slice(0, 2).forEach(concern => {
            aiData.improvements.push(`Security: ${concern.issue} in ${concern.file} - ${concern.recommendation}`);
          });
        }
        if (codeAnalysis.performanceIssues && codeAnalysis.performanceIssues.length > 0) {
          codeAnalysis.performanceIssues.slice(0, 2).forEach(issue => {
            aiData.improvements.push(`Performance: ${issue.issue} in ${issue.file} - ${issue.solution}`);
          });
        }
      }
      
      // Ensure exactly 5-8 improvements
      aiData.improvements = aiData.improvements.slice(0, 8);
      while (aiData.improvements.length < 5) {
        aiData.improvements.push("Perform a detailed security audit of the authentication module.");
      }
    } else {
      aiData.improvements = ["Review architecture.", "Update dependencies.", "Add unit tests.", "Improve documentation.", "Optimize build process."];
    }

    // 3. Add Groq code analysis to response
    if (codeAnalysis) {
      aiData.codeAnalysis = {
        analyzedFiles,
        ...codeAnalysis
      };
    }

    // ---------------------------------------------------------
    // 🛡️ AGGRESSIVE FALLBACKS (GUARANTEE NO EMPTY BOXES)
    // ---------------------------------------------------------

    const desc = repoData.basicInfo.description || "a software project";
    const stack = aiData.techStack && aiData.techStack.length > 0 
      ? aiData.techStack.join(", ") 
      : "modern web technologies";

    // Fallback 1: Functional Summary
    if (!aiData.functionalSummary || aiData.functionalSummary.trim().length < 10) {
      console.log('⚠️ AI Summary empty. Generating fallback...');
      aiData.functionalSummary = 
        `This repository implements ${desc}. Technically, it is built using ${stack}. Based on the file structure, it follows standard architectural patterns for this stack, organizing code into logical modules for frontend and backend operations. It serves as a functional implementation of its described goals.`;
    }

    // Fallback 2: Use Case
    if (!aiData.targetAudienceAndUse || aiData.targetAudienceAndUse.trim().length < 10) {
      console.log('⚠️ AI Use Case empty. Generating fallback...');
      aiData.targetAudienceAndUse = 
        `This tool is designed for developers and engineers working with ${stack}. It solves the problem of ${desc}, providing a streamlined solution for building, testing, or deploying applications in this domain. It is suitable for both learning purposes and production use cases depending on the maturity of the codebase.`;
    }

    return aiData;

  } catch (error) {
    console.error('Gemini AI Error:', error.message);
    // Full Fallback on Crash
    return {
      functionalSummary: "This project appears to be a software application built with standard web technologies. It aims to provide functionality related to its repository description.",
      targetAudienceAndUse: "Used by developers to build and deploy web applications. It serves as a practical tool for its intended audience.",
      techStack: ["JavaScript", "HTML", "CSS"],
      codeHealthScore: 50,
      improvements: ["Check server logs for details.", "Verify API keys.", "Retry request.", "Check GitHub token.", "Contact support."]
    };
  }
};

module.exports = { analyzeRepoWithAI };
