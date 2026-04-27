const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Analyzes repository using Gemini AI (README + Description focused)
 */
const analyzeWithGemini = async (repoInfo, readmeContent) => {
  try {
    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY is missing');
      throw new Error('GEMINI_API_KEY is missing in environment variables');
    }

    console.log('🤖 Calling Gemini API for README/Description analysis...');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `You are a senior software architect analyzing a GitHub repository.

REPOSITORY: ${repoInfo.owner}/${repoInfo.repoName}
DESCRIPTION: ${repoInfo.description || 'No description'}
README CONTENT: ${readmeContent ? readmeContent.substring(0, 4000) : 'No README available'}

Based on the README and description, provide a JSON object with:

{
  "readmeSummary": "2-3 sentences describing what this project does based on README",
  "readmeUseCase": "2-3 sentences describing who uses this and why based on README",
  "technologiesFromReadme": ["Tech 1", "Tech 2", "Tech 3"],
  "featuresFromReadme": ["Feature 1", "Feature 2", "Feature 3"]
}

Focus on what the README explicitly states about the project's purpose and features.
Return ONLY valid JSON, no markdown.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean JSON response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      text = text.substring(jsonStart, jsonEnd + 1);
    }

    const analysis = JSON.parse(text);
    console.log('✅ Gemini README analysis complete');
    
    return analysis;
  } catch (error) {
    console.error('❌ Gemini Analysis Error:', error.message);
    // Fallback
    return {
      readmeSummary: repoInfo.description || 'No description available',
      readmeUseCase: 'Information not available',
      technologiesFromReadme: [],
      featuresFromReadme: []
    };
  }
};

module.exports = { analyzeWithGemini };