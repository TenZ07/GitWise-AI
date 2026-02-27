const axios = require('axios');

const chatWithRepo = async (repoData, userMessage, model = process.env.OPENROUTER_MODEL) => {
  try {
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const CLIENT_URL = process.env.CLIENT_URL;
    
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API Key not found in .env');
    }

    // Construct System Context
    const systemContext = `
      YOU ARE AN EXPERT SOFTWARE ARCHITECT ASSISTANT specialized in this repository.
      
      REPOSITORY CONTEXT:
      - Name: ${repoData.owner}/${repoData.repoName}
      - Description: ${repoData.description || 'No description'}
      - Functional Summary: ${repoData.functionalSummary || 'Not available'}
      - Use Case: ${repoData.targetAudienceAndUse || 'Not available'}
      - Tech Stack: ${repoData.techStack ? repoData.techStack.join(', ') : 'Unknown'}
      - Code Health Score: ${repoData.codeHealthScore}/100
      
      FILE STRUCTURE (Top 50 files):
      ${repoData.fileTree && repoData.fileTree.length > 0 
        ? repoData.fileTree.slice(0, 50).map(f => `- ${f.path}`).join('\n') 
        : 'No file structure available.'}
      
      AI IDENTIFIED RISKS:
      ${repoData.riskAssessment && repoData.riskAssessment.length > 0 
        ? repoData.riskAssessment.map(r => `- [${r.severity}] ${r.issue} in ${r.fileReference}`).join('\n') 
        : 'No specific risks identified.'}
      
      AI IDENTIFIED IMPROVEMENTS:
      ${repoData.improvements && repoData.improvements.length > 0 
        ? repoData.improvements.join('\n') 
        : 'No improvements listed.'}
      
      INSTRUCTIONS:
      1. Answer based ONLY on the context above.
      2. If info is missing, admit it politely.
      3. Reference specific files from the "FILE STRUCTURE" list.
      4. Be concise and professional.
    `;

    // Call OpenRouter
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: model,
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

    return response.data.choices[0].message.content;

  } catch (error) {
    console.error('OpenRouter Error:', error.response?.data || error.message);
    throw new Error('Failed to get response from AI chatbot');
  }
};

module.exports = { chatWithRepo };