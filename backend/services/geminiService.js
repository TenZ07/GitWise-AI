const { getGeminiModel } = require('../config/gemini');

const analyzeRepoWithAI = async (repoData) => {
  try {
    const model = getGeminiModel();

    // 1. Prepare Data for Context
    const topLanguages = Object.entries(repoData.basicInfo.languages || {})
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([lang, bytes]) => `${lang}`)
      .join(', ');

    // Get detailed file paths (up to 50 items for better context)
    const filePaths = repoData.fileTree
      .filter(f => f.type === 'file') // Focus on files for specific advice
      .slice(0, 50)
      .map(f => f.path)
      .join('\n- ');

    // Analyze commit messages for specific patterns
    const recentCommitsContext = repoData.recentCommits.map(c => 
      `- [${c.sha}] ${c.message} by ${c.author}`
    ).join('\n');

    const context = `
      REPO: ${repoData.basicInfo.owner}/${repoData.basicInfo.repoName}
      DESCRIPTION: ${repoData.basicInfo.description}
      LANGUAGES: ${topLanguages}
      
      FILE PATHS FOUND IN REPO:
      - ${filePaths}
      
      RECENT COMMIT HISTORY:
      ${recentCommitsContext}
    `;

    // 2. The "Strict Engineer" Prompt
    const prompt = `
      ACT AS A SENIOR STAFF ENGINEER conducting a harsh code review. 
      You have access to the actual FILE PATHS and COMMIT MESSAGES of this repository.

      YOUR GOAL: Generate 5 SPECIFIC, ACTIONABLE improvements. 

      STRICT RULES FOR "improvements" ARRAY:
      1. You MUST provide exactly 5 items.
      2. DO NOT use generic advice like "Add tests", "Update README", "Improve security", or "Refactor code" without specifics.
      3. EVERY suggestion MUST reference a specific file path from the "FILE PATHS FOUND" list above (e.g., "src/App.jsx", "server.js", "utils/api.js").
      4. Look at the COMMIT MESSAGES. If you see "fix", "bug", or "issue", suggest a specific architectural change to prevent that specific type of error in the related file.
      5. Look at the FILE STRUCTURE. If you see a large file or a messy folder, suggest a specific split or reorganization.

      EXAMPLE OF BAD SUGGESTION (DO NOT DO THIS):
      - "Add unit tests."
      - "Update the documentation."

      EXAMPLE OF GOOD SUGGESTION (DO THIS):
      - "The file 'src/components/ChatWindow.jsx' appears to handle both state logic and UI rendering; extract the socket.io logic into a custom hook 'useSocket.js'."
      - "Commit messages show repeated 'fix token' errors; move the API key validation from 'server.js' into a dedicated middleware 'middleware/auth.js' to centralize error handling."
      - "The 'public' folder contains unoptimized assets; implement a build script in 'package.json' to compress images before deployment."

      RETURN ONLY RAW JSON. No markdown. No explanations.

      FIELDS:
      - summary: 2 sentences max, technical tone.
      - techStack: Array of 5 specific libs/frameworks inferred from files.
      - codeHealthScore: Integer 0-100.
      - improvements: Array of exactly 5 strings, each citing a specific file.

      CONTEXT:
      ${context}
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // Clean up markdown if AI ignores instructions
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Handle cases where AI might return text before/after JSON
    const jsonStart = responseText.indexOf('{');
    const jsonEnd = responseText.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      responseText = responseText.substring(jsonStart, jsonEnd + 1);
    }

    const aiData = JSON.parse(responseText);

    // Safety check: Ensure we have 5 improvements
    if (!aiData.improvements || aiData.improvements.length < 5) {
      console.warn("AI failed to generate 5 suggestions, filling gaps...");
      const filler = [
        `Review '${repoData.fileTree[0]?.path || 'src'}' for potential modularization based on file size.`,
        `Analyze commit history in '${repoData.fileTree[1]?.path || 'server.js'}' for recurring fix patterns.`,
        `Implement strict typing or JSDoc in '${repoData.fileTree[2]?.path || 'index.js'}'.`,
        `Optimize bundle size by auditing dependencies in 'package.json'.`,
        `Add error boundaries to '${repoData.fileTree[3]?.path || 'src/App.jsx'}' to prevent full app crashes.`
      ];
      while (aiData.improvements.length < 5) {
        aiData.improvements.push(filler[aiData.improvements.length]);
      }
    }

    return aiData;

  } catch (error) {
    console.error('Gemini AI Error:', error.message);
    return {
      summary: "Analysis unavailable due to AI error.",
      techStack: [],
      codeHealthScore: 50,
      improvements: [
        "Could not connect to AI service.",
        "Check server logs for details.",
        "Verify GEMINI_API_KEY in .env.",
        "Retry the analysis request.",
        "Ensure GitHub token has read access."
      ]
    };
  }
};

module.exports = { analyzeRepoWithAI };