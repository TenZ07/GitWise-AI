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
      DESCRIPTION: ${repoData.basicInfo.description || 'No description'}
      LANGUAGES: ${topLanguages}
      
      FILE PATHS FOUND IN REPO:
      - ${filePaths}
      
      RECENT COMMIT HISTORY:
      ${recentCommitsContext}
    `;

    // 2. Strict Prompt
    const prompt = `
      ACT AS A SENIOR STAFF ENGINEER. Analyze the repository context.

      RETURN A STRICT JSON OBJECT with these EXACT keys. No markdown, no extra text.

      REQUIRED JSON STRUCTURE:
      {
        "functionalSummary": "Technical explanation of WHAT the code does (architecture, features, stack).",
        "targetAudienceAndUse": "Plain English explanation of WHO uses this and WHAT PROBLEM it solves.",
        "techStack": ["Array", "of", "5", "technologies"],
        "codeHealthScore": 85,
        "improvements": [
          "Specific suggestion 1 referencing a file path",
          "Specific suggestion 2 referencing a file path",
          "Specific suggestion 3 referencing a file path",
          "Specific suggestion 4 referencing a file path",
          "Specific suggestion 5 referencing a file path",
          "Specific suggestion 5 referencing a file path"
        ]
      }

      CRITICAL INSTRUCTIONS:
      1. 'functionalSummary' must be technical (e.g., "Uses React hooks and Express middleware...").
      2. 'targetAudienceAndUse' must be non-technical use case (e.g., "Helps developers track bugs..."). DO NOT leave this empty.
      3. 'improvements' MUST reference specific files from the provided file list.
      4. If you cannot determine the use case, infer it logically from the README description. DO NOT return an empty string.

      CONTEXT DATA:
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

    const aiData = JSON.parse(responseText);

    // 🛡️ FALLBACK LOGIC: Ensure "What It Is Used For" is NEVER empty
    if (!aiData.targetAudienceAndUse || aiData.targetAudienceAndUse.trim() === "") {
      console.log('⚠️ AI failed to generate use case. Generating fallback locally...');
      const desc = repoData.basicInfo.description || "This project";
      const stack = aiData.techStack ? aiData.techStack.slice(0, 3).join(", ") : "modern web technologies";
      
      aiData.targetAudienceAndUse = 
        `Based on its functionality as "${desc}", this tool is primarily used by developers working with ${stack} to streamline their workflow, automate tasks, or build similar applications. It serves as a practical solution for users needing ${aiData.functionalSummary ? aiData.functionalSummary.split(' ')[0] : 'a robust'} software component.`;
    }

    // Safety check for improvements count
    if (!aiData.improvements || aiData.improvements.length < 5) {
      const filler = [
        `Review '${repoData.fileTree[0]?.path || 'src'}' for potential modularization.`,
        `Analyze commit history in '${repoData.fileTree[1]?.path || 'server.js'}' for recurring fix patterns.`,
        `Implement strict typing or JSDoc in '${repoData.fileTree[2]?.path || 'index.js'}'.`,
        `Optimize bundle size by auditing dependencies in 'package.json'.`,
        `Add error boundaries to '${repoData.fileTree[3]?.path || 'src/App.jsx'}'.`
      ];
      while (aiData.improvements.length < 5) {
        aiData.improvements.push(filler[aiData.improvements.length]);
      }
    }

    return aiData;

  } catch (error) {
    console.error('Gemini AI Error:', error.message);
    return {
      functionalSummary: "Analysis unavailable due to AI error.",
      targetAudienceAndUse: "Could not connect to AI service. Please retry.",
      techStack: [],
      codeHealthScore: 50,
      improvements: [
        "Check server logs for details.",
        "Verify GEMINI_API_KEY in .env.",
        "Retry the analysis request.",
        "Ensure GitHub token has read access.",
        "Contact support if issue persists."
      ]
    };
  }
};

module.exports = { analyzeRepoWithAI };