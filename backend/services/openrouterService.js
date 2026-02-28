const axios = require('axios');

const chatWithRepo = async (repoData, userMessage) => {
  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const CLIENT_URL = process.env.CLIENT_URL;
    // ✅ Use Model from Env, fallback to Claude 3.5 Sonnet
    const MODEL = process.env.OPENROUTER_MODEL;
    
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API Key missing in .env');
    }

    // --- 1. CONSTRUCT ENHANCED CONTEXT ---

    // A. Contributor Statistics (Formatted for AI)
    let contributorStats = "No contributor data available.";
    if (repoData.contributors && repoData.contributors.length > 0) {
      contributorStats = repoData.contributors
        .slice(0, 15) // Top 15 contributors
        .map((c, index) => `${index + 1}. ${c.login}: ${c.contributions} commits`)
        .join('\n');
    }

    // B. Recent Commit History (Formatted for AI)
    let recentCommitDetails = "No recent commits found.";
    if (repoData.recentCommits && repoData.recentCommits.length > 0) {
      recentCommitDetails = repoData.recentCommits
        .slice(0, 15) // Last 15 commits
        .map(c => `- [${c.sha.substring(0, 7)}] "${c.message}" by ${c.author}`)
        .join('\n');
    }

    // C. Risks & Improvements
    const risksText = repoData.riskAssessment && repoData.riskAssessment.length > 0 
      ? repoData.riskAssessment.map(r => `- [${r.severity}] ${r.issue} (File: ${r.fileReference || 'N/A'})`).join('\n')
      : 'No specific risks identified.';

    const improvementsText = repoData.improvements && repoData.improvements.length > 0 
      ? repoData.improvements.join('\n')
      : 'No improvements listed.';

    // D. Final System Prompt
    const systemContext = `
YOU ARE AN EXPERT SOFTWARE ARCHITECT AND SENIOR DEVELOPER ASSISTANT.
You have fully analyzed the following repository. Answer user questions based ONLY on this context.

### REPOSITORY OVERVIEW
- **Name**: ${repoData.owner}/${repoData.repoName}
- **Description**: ${repoData.description || 'No description provided'}
- **Functional Summary**: ${repoData.functionalSummary || 'Not available'}
- **Use Case**: ${repoData.targetAudienceAndUse || 'Not available'}
- **Tech Stack**: ${repoData.techStack ? repoData.techStack.join(', ') : 'Unknown'}
- **Code Health Score**: ${repoData.codeHealthScore}/100

### FILE STRUCTURE (Top 50 Files)
${repoData.fileTree && repoData.fileTree.length > 0 
  ? repoData.fileTree.slice(0, 50).map(f => `- ${f.path}`).join('\n') 
  : 'No file structure available.'}

### 📊 CONTRIBUTOR STATISTICS (Commits per User)
${contributorStats}

### 🕒 RECENT COMMIT HISTORY
${recentCommitDetails}

### ⚠️ AI IDENTIFIED RISKS
${risksText}

### 💡 AI IDENTIFIED IMPROVEMENTS
${improvementsText}

### INSTRUCTIONS
1. **Be Precise**: Answer based strictly on the data above. If information is missing, admit it politely.
2. **Commit/Contributor Questions**: If asked about "who committed most" or "recent changes", use the "CONTRIBUTOR STATISTICS" and "RECENT COMMIT HISTORY" sections explicitly.
3. **Code References**: When suggesting fixes, reference specific files from the "FILE STRUCTURE" list.
4. **Tone**: Professional, concise, and helpful. Act as a senior team member reviewing a PR.
5. **Formatting**: Use Markdown (bolding, lists, code blocks) to make your answer readable.
`;

    // --- 2. CALL OPENROUTER API ---
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: MODEL,
        messages: [
          { role: 'system', content: systemContext },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': CLIENT_URL,
          'X-Title': 'GitWise AI Chat',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.data.choices || response.data.choices.length === 0) {
      throw new Error('No response generated from AI');
    }

    return response.data.choices[0].message.content;

  } catch (error) {
    console.error('❌ OpenRouter Service Error:', error.response?.data || error.message);
    
    // User-friendly error message
    let errorMsg = 'Failed to get response from AI.';
    if (error.response?.status === 401) errorMsg = 'Invalid API Key.';
    if (error.response?.status === 429) errorMsg = 'API Quota exceeded. Try again later.';
    if (error.code === 'ECONNABORTED') errorMsg = 'Request timed out.';
    
    throw new Error(errorMsg);
  }
};

module.exports = { chatWithRepo };