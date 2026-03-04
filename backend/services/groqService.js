const axios = require('axios');

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Identifies critical files from directory structure using Groq AI
 * @param {Array} fileTree - Array of file objects with path and type
 * @param {Object} repoInfo - Basic repository information
 * @returns {Promise<Array>} - Array of critical file paths to analyze
 */
const identifyCriticalFiles = async (fileTree, repoInfo) => {
  try {
    if (!GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY is missing in environment variables');
      throw new Error('GROQ_API_KEY is missing in environment variables');
    }

    // Filter only files (not directories) and create a clean list
    const filePaths = fileTree
      .filter(item => item.type === 'file')
      .map(item => item.path)
      .slice(0, 200); // Limit to first 200 files to avoid token limits

    if (filePaths.length === 0) {
      console.log('⚠️ No files found in repository');
      return [];
    }

    console.log(`📁 Found ${filePaths.length} files in repository`);

    const prompt = `You are a senior software architect analyzing a GitHub repository.

REPOSITORY: ${repoInfo.owner}/${repoInfo.repoName}
DESCRIPTION: ${repoInfo.description || 'No description'}
LANGUAGES: ${Object.keys(repoInfo.languages || {}).join(', ')}

FILE STRUCTURE:
${filePaths.join('\n')}

TASK: Identify the 10-15 MOST CRITICAL files that should be analyzed to understand this codebase. Focus on:
1. Main entry points (index.js, main.py, app.js, server.js, etc.)
2. Core business logic files
3. Configuration files (package.json, requirements.txt, etc.)
4. Database models/schemas
5. API routes/controllers
6. Key utility/helper files
7. Important components (for frontend projects)

RULES:
- Prioritize files that reveal architecture and core functionality
- Avoid test files, build outputs, and documentation
- Limit to 15 files maximum
- Return ONLY a JSON array of file paths, nothing else

RESPONSE FORMAT (STRICT JSON):
["path/to/file1.js", "path/to/file2.py", "path/to/file3.jsx"]`;

    console.log('🤖 Calling Groq API to identify critical files...');

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.3-70b-versatile', // Fast and accurate model
        messages: [
          { role: 'system', content: 'You are a code analysis expert. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 500
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      }
    );

    let content = response.data.choices[0].message.content.trim();
    
    console.log('📥 Groq response received:', content.substring(0, 100) + '...');
    
    // Clean up response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse JSON response
    const criticalFiles = JSON.parse(content);
    
    if (!Array.isArray(criticalFiles)) {
      throw new Error('AI did not return an array of file paths');
    }

    console.log(`✅ Groq identified ${criticalFiles.length} critical files`);
    return criticalFiles.slice(0, 15); // Ensure max 15 files

  } catch (error) {
    console.error('❌ Groq Critical Files Error:', error.response?.data || error.message);
    
    // Fallback: Return common critical files based on patterns
    const fallbackFiles = fileTree
      .filter(item => item.type === 'file')
      .filter(item => {
        const path = item.path.toLowerCase();
        return (
          path.includes('package.json') ||
          path.includes('index.') ||
          path.includes('main.') ||
          path.includes('app.') ||
          path.includes('server.') ||
          path.includes('config') ||
          path.match(/\.(js|py|java|go|rs|ts)$/)
        );
      })
      .slice(0, 10)
      .map(item => item.path);

    console.log('⚠️ Using fallback file selection');
    return fallbackFiles;
  }
};

/**
 * Analyzes code content using Groq AI
 * @param {Array} fileContents - Array of {path, content} objects
 * @param {Object} repoInfo - Repository information
 * @returns {Promise<Object>} - Code analysis results
 */
const analyzeCodeWithGroq = async (fileContents, repoInfo) => {
  try {
    if (!GROQ_API_KEY) {
      console.error('❌ GROQ_API_KEY is missing in environment variables');
      throw new Error('GROQ_API_KEY is missing in environment variables');
    }

    if (!fileContents || fileContents.length === 0) {
      console.log('⚠️ No file contents to analyze');
      throw new Error('No file contents provided');
    }

    console.log(`🔍 Analyzing ${fileContents.length} files with Groq AI...`);

    // Prepare code context with validation
    const codeContext = fileContents
      .map(file => {
        // Ensure content is a string
        let content = file.content;
        if (typeof content !== 'string') {
          console.warn(`⚠️ File ${file.path} content is not a string, converting...`);
          if (Buffer.isBuffer(content)) {
            content = content.toString('utf-8');
          } else if (typeof content === 'object') {
            content = JSON.stringify(content);
          } else {
            content = String(content);
          }
        }
        
        return `
=== FILE: ${file.path} ===
${content.substring(0, 3000)} ${content.length > 3000 ? '... [truncated]' : ''}
`;
      })
      .join('\n\n');

    const prompt = `You are a senior software architect performing a deep code review.

REPOSITORY: ${repoInfo.owner}/${repoInfo.repoName}
DESCRIPTION: ${repoInfo.description || 'No description'}

ANALYZED FILES:
${fileContents.map(f => f.path).join('\n')}

CODE CONTENT:
${codeContext}

TASK: Perform a comprehensive code analysis and return a JSON object with the following structure:

{
  "codeQualityInsights": {
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
    "codeSmells": ["Code smell 1", "Code smell 2"]
  },
  "securityConcerns": [
    {
      "issue": "Security issue description",
      "severity": "HIGH|MEDIUM|LOW",
      "file": "path/to/file.js",
      "recommendation": "How to fix it"
    }
  ],
  "architecturePatterns": {
    "detected": ["Pattern 1", "Pattern 2"],
    "recommendations": ["Recommendation 1", "Recommendation 2"]
  },
  "performanceIssues": [
    {
      "issue": "Performance concern",
      "file": "path/to/file.js",
      "impact": "HIGH|MEDIUM|LOW",
      "solution": "How to optimize"
    }
  ],
  "bestPractices": {
    "followed": ["Practice 1", "Practice 2"],
    "missing": ["Missing practice 1", "Missing practice 2"]
  },
  "technicalDebt": [
    "Technical debt item 1",
    "Technical debt item 2"
  ]
}

RULES:
- Be specific and reference actual code patterns you see
- Provide actionable recommendations
- Focus on real issues, not theoretical ones
- Return ONLY valid JSON, no markdown or extra text`;

    console.log('🤖 Calling Groq API for code analysis...');

    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a code analysis expert. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 2000
      },
      {
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout for code analysis
      }
    );

    console.log('📥 Groq code analysis response received');

    let content = response.data.choices[0].message.content.trim();
    
    console.log('📝 Response preview:', content.substring(0, 150) + '...');
    
    // Clean up response
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Parse JSON response
    const analysis = JSON.parse(content);
    
    console.log('✅ Groq code analysis completed');
    return analysis;

  } catch (error) {
    console.error('❌ Groq Code Analysis Error:');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received from Groq API');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    }
    
    console.error('Stack trace:', error.stack);
    
    // Return fallback analysis with more helpful message
    return {
      codeQualityInsights: {
        strengths: ['Code structure appears organized'],
        weaknesses: [`Unable to perform deep analysis: ${error.message}`],
        codeSmells: []
      },
      securityConcerns: [],
      architecturePatterns: {
        detected: ['Standard architecture'],
        recommendations: ['Perform manual code review', 'Check backend logs for details']
      },
      performanceIssues: [],
      bestPractices: {
        followed: [],
        missing: ['Unable to determine without full analysis']
      },
      technicalDebt: ['Code analysis service temporarily unavailable - check API key and quota']
    };
  }
};

module.exports = {
  identifyCriticalFiles,
  analyzeCodeWithGroq
};
