const { getGeminiModel } = require('../config/gemini');

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

    const context = `
      REPO: ${repoData.basicInfo.owner}/${repoData.basicInfo.repoName}
      DESCRIPTION: ${repoData.basicInfo.description || 'No description provided'}
      LANGUAGES: ${topLanguages}
      
      FILE PATHS FOUND IN REPO:
      - ${filePaths}
      
      RECENT COMMIT HISTORY:
      ${recentCommitsContext}
    `;

    // 2. REFINED PROFESSIONAL PROMPT
    const prompt = `
YOU ARE A PRINCIPAL SOFTWARE ARCHITECT PERFORMING A PROFESSIONAL CODE REVIEW.

Analyze the repository context carefully. Even if the codebase is small, provide the best possible analysis based on available files (README, package.json, structure).

RETURN A STRICT RAW JSON OBJECT. NO MARKDOWN. NO TEXT OUTSIDE JSON.

JSON STRUCTURE (MUST MATCH EXACTLY):
{
  "functionalSummary": "Detailed explanation of HOW the system works technically. Mention backend/frontend structure, data flow, and key patterns. If code is minimal, describe the intended architecture based on file structure.",
  "targetAudienceAndUse": "Clear non-technical explanation of WHO this is for and WHAT problem it solves.",
  "techStack": ["List", "Every", "Major", "Technology", "Detected"],
  "architectureAssessment": {
    "pattern": "e.g., MVC, Component-Based, Monolithic",
    "strengths": ["Strength 1", "Strength 2"],
    "weaknesses": ["Weakness 1", "Weakness 2"]
  },
  "codeHealthScore": {
    "score": 0,
    "justification": "Explain why this score was given."
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
3. Score must be realistic (0-100).
4. Be analytical and critical.
5. Give 6 improvements.

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
        aiData.scoreJustification = aiData.codeHealthScore.justification; // Save justification if needed later
      } else if (typeof aiData.codeHealthScore === 'number') {
        finalScore = aiData.codeHealthScore;
      }
    }
    aiData.codeHealthScore = finalScore || 50;

    // 2. Convert Improvements Objects to Strings (for current UI)
    if (aiData.improvements && Array.isArray(aiData.improvements)) {
      aiData.improvements = aiData.improvements.map(imp => {
        if (typeof imp === 'string') return imp;
        return `${imp.title || 'Improvement'}: ${imp.description || 'No details'} ${imp.fileReference ? `(File: ${imp.fileReference})` : ''}`;
      });
      // Ensure exactly 5
      while (aiData.improvements.length < 5) {
        aiData.improvements.push("Perform a detailed security audit of the authentication module.");
      }
    } else {
      aiData.improvements = ["Review architecture.", "Update dependencies.", "Add unit tests.", "Improve documentation.", "Optimize build process."];
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