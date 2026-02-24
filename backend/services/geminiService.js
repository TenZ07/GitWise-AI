const { getGeminiModel } = require('../config/gemini');

/**
 * Analyzes repository data using Gemini AI
 * @param {Object} repoData - The data fetched from GitHub (basicInfo, commits, contributors, fileTree)
 * @returns {Promise<Object>} - AI generated summary, score, and improvements
 */
const analyzeRepoWithAI = async (repoData) => {
  try {
    const model = getGeminiModel();

    // Construct a concise context string to avoid token limits
    const context = `
      Repository: ${repoData.basicInfo.owner}/${repoData.basicInfo.repoName}
      Description: ${repoData.basicInfo.description}
      Stars: ${repoData.basicInfo.stars}, Forks: ${repoData.basicInfo.forks}
      Languages: ${JSON.stringify(repoData.basicInfo.languages)}
      Recent Commits Count: ${repoData.recentCommits.length}
      Top Contributors: ${repoData.contributors.slice(0, 5).map(c => c.login).join(', ')}
      File Structure (Root): ${repoData.fileTree.slice(0, 20).map(f => `${f.type}:${f.name}`).join(', ')}
    `;

    const prompt = `
      You are an expert software architect and code reviewer. Analyze the following GitHub repository context and return a STRICT JSON object (no markdown formatting, no code blocks) with these fields:
      
      1. "summary": A 2-sentence engaging summary of what this project does.
      2. "techStack": An array of the top 5 key technologies/frameworks detected.
      3. "codeHealthScore": A number between 0 and 100. 
         - Give high scores for active commits, many contributors, clear file structure, and high stars.
         - Deduct points for no description, few files, or no recent activity.
      4. "improvements": An array of 3 specific, actionable suggestions to improve the codebase or documentation.

      Context:
      ${context}

      Response Format Example:
      {
        "summary": "...",
        "techStack": ["React", "Node.js", "..."],
        "codeHealthScore": 85,
        "improvements": ["Add unit tests", "Update README", "..."]
      }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean up potential markdown code blocks if the AI adds them despite instructions
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const aiData = JSON.parse(cleanJson);

    return aiData;

  } catch (error) {
    console.error('Gemini AI Error:', error.message);
    // Fallback values if AI fails, so the app doesn't crash
    return {
      summary: "AI analysis unavailable.",
      techStack: [],
      codeHealthScore: 50,
      improvements: ["Unable to generate suggestions."]
    };
  }
};

module.exports = { analyzeRepoWithAI };